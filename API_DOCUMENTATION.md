# PhotoTemi-QR API 문서

안드로이드 앱에서 PhotoTemi-QR 서버와 통신하기 위한 API 문서입니다.

## 기본 정보

- **Base URL**: `http://localhost:3000` (개발 환경)
- **Content-Type**: `multipart/form-data` (이미지 업로드 시)
- **응답 형식**: JSON

---

## 1. 이미지 업로드

안드로이드 앱에서 이미지를 서버에 업로드합니다.

### 요청

**Endpoint**: `POST /api/upload`

**Content-Type**: `multipart/form-data`

**Parameters**:
- `image` (파일, 필수): 업로드할 이미지 파일

### 성공 응답

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "이미지가 성공적으로 업로드되었습니다.",
  "viewUrl": "http://localhost:3000/view/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "imageUrl": "http://localhost:3000/uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
  "imageId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "expiresIn": "10분",
  "expiresAt": "2024-01-15T12:30:00.000Z"
}
```

**응답 필드 설명**:
- `viewUrl`: 이미지를 볼 수 있는 웹 페이지 URL (QR 코드로 생성)
- `imageUrl`: 이미지 파일 직접 접근 URL
- `imageId`: 이미지 고유 ID (UUID)
- `expiresIn`: 유효 기간 (10분)
- `expiresAt`: 만료 시간 (ISO 8601 형식)

### 오류 응답

**400 Bad Request** - 이미지 파일이 없는 경우
```json
{
  "error": "이미지 파일이 필요합니다."
}
```

**500 Internal Server Error** - 서버 오류
```json
{
  "error": "이미지 업로드 중 오류가 발생했습니다."
}
```

---

## 2. 이미지 정보 조회

업로드된 이미지의 정보를 조회합니다.

### 요청

**Endpoint**: `GET /api/image/:id`

**Parameters**:
- `id` (경로 파라미터, 필수): 이미지 ID

**예시**: `GET /api/image/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 성공 응답

**Status Code**: `200 OK`

```json
{
  "success": true,
  "image": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "originalName": "photo.jpg",
    "uploadedAt": "2024-01-15T12:20:00.000Z",
    "expiresAt": "2024-01-15T12:30:00.000Z",
    "imageUrl": "http://localhost:3000/uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"
  }
}
```

### 오류 응답

**404 Not Found** - 이미지를 찾을 수 없거나 만료된 경우
```json
{
  "error": "이미지를 찾을 수 없거나 만료되었습니다."
}
```

---

## 3. 이미지 보기 페이지

웹 브라우저에서 이미지를 볼 수 있는 페이지입니다. (QR 코드 스캔 시 이동)

### 요청

**Endpoint**: `GET /view/:id`

**Parameters**:
- `id` (경로 파라미터, 필수): 이미지 ID

**예시**: `GET /view/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 응답

HTML 페이지 또는 404 페이지를 반환합니다.

---

## 4. 서버 상태 확인

서버가 정상적으로 작동하는지 확인합니다.

### 요청

**Endpoint**: `GET /api/health`

### 성공 응답

**Status Code**: `200 OK`

```json
{
  "status": "OK",
  "message": "서버가 정상적으로 작동 중입니다.",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

## Android 예제 코드 (Kotlin)

### 1. 권한 추가 (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### 2. 이미지 업로드 함수

```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.asRequestBody
import org.json.JSONObject
import java.io.File
import java.io.IOException

class PhotoUploader {
    private val client = OkHttpClient()
    private val serverUrl = "http://YOUR_SERVER_IP:3000" // 실제 서버 IP로 변경
    
    fun uploadImage(imageFile: File, callback: (success: Boolean, viewUrl: String?, error: String?) -> Unit) {
        val requestBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart(
                "image",
                imageFile.name,
                imageFile.asRequestBody("image/*".toMediaTypeOrNull())
            )
            .build()
        
        val request = Request.Builder()
            .url("$serverUrl/api/upload")
            .post(requestBody)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(false, null, e.message)
            }
            
            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (response.isSuccessful) {
                        val responseBody = response.body?.string()
                        val jsonObject = JSONObject(responseBody ?: "")
                        val viewUrl = jsonObject.getString("viewUrl")
                        callback(true, viewUrl, null)
                    } else {
                        callback(false, null, "업로드 실패: ${response.code}")
                    }
                }
            }
        })
    }
}
```

### 3. 사용 예제

```kotlin
val uploader = PhotoUploader()
val imageFile = File("/path/to/image.jpg")

uploader.uploadImage(imageFile) { success, viewUrl, error ->
    runOnUiThread {
        if (success && viewUrl != null) {
            // QR 코드 생성
            generateQRCode(viewUrl)
            Toast.makeText(this, "업로드 성공!", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "업로드 실패: $error", Toast.LENGTH_SHORT).show()
        }
    }
}
```

### 4. QR 코드 생성 (ZXing 라이브러리 사용)

**build.gradle 의존성 추가**:
```gradle
implementation 'com.google.zxing:core:3.5.1'
implementation 'com.journeyapps:zxing-android-embedded:4.3.0'
```

**QR 코드 생성 함수**:
```kotlin
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import android.graphics.Bitmap
import android.graphics.Color

fun generateQRCode(content: String, width: Int = 512, height: Int = 512): Bitmap {
    val qrCodeWriter = QRCodeWriter()
    val bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, width, height)
    
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565)
    for (x in 0 until width) {
        for (y in 0 until height) {
            bitmap.setPixel(x, y, if (bitMatrix[x, y]) Color.BLACK else Color.WHITE)
        }
    }
    return bitmap
}
```

---

## 중요 사항

1. **유효 기간**: 업로드된 이미지는 10분 후 자동으로 삭제됩니다.
2. **파일 크기 제한**: 최대 10MB까지 업로드 가능합니다.
3. **지원 형식**: 모든 이미지 형식 (JPEG, PNG, GIF 등)
4. **데이터베이스**: 별도의 DB 없이 메모리와 파일 시스템만 사용합니다.
5. **서버 재시작**: 서버가 재시작되면 메모리에 저장된 이미지 정보가 사라집니다. (파일은 남아있음)

---

## 테스트 방법

1. 서버 실행:
```bash
npm start
```

2. 웹 브라우저에서 테스트:
- `http://localhost:3000` - 메인 페이지
- `http://localhost:3000/upload.html` - 업로드 테스트 페이지

3. cURL로 테스트:
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "image=@/path/to/image.jpg"
```

---

## 문제 해결

### 안드로이드에서 연결이 안 되는 경우

1. **네트워크 보안 설정** (`res/xml/network_security_config.xml`):
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">YOUR_SERVER_IP</domain>
    </domain-config>
</network-security-config>
```

2. **AndroidManifest.xml에 추가**:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

3. **서버 IP 확인**: `localhost` 대신 실제 서버의 IP 주소 사용 (예: `192.168.0.10:3000`)

