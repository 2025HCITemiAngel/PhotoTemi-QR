# 로깅 가이드

PhotoTemi-QR 서버의 로깅 시스템 설명 문서입니다.

## 로깅 시스템 개요

서버는 두 가지 로깅 시스템을 사용합니다:
1. **Morgan** - HTTP 요청/응답 로깅
2. **커스텀 로거** - 애플리케이션 이벤트 로깅

---

## 1. 커스텀 로거

### 로그 레벨

#### INFO (정보)
일반적인 정보성 메시지
```javascript
logger.info('업로드 디렉토리 확인됨:', uploadDir);
```
**출력 예시:**
```
[INFO] [2024-01-15T12:00:00.000Z] 업로드 디렉토리 확인됨: C:\uploads
```

#### SUCCESS (성공)
성공적으로 완료된 작업 ✅
```javascript
logger.success('이미지 업로드 완료 - ID: abc123');
```
**출력 예시:**
```
[SUCCESS] [2024-01-15T12:05:30.000Z] ✅ 이미지 업로드 완료 - ID: abc123
```

#### WARNING (경고)
문제가 될 수 있는 상황 ⚠️
```javascript
logger.warning('이미지 업로드 실패: 파일 없음');
```
**출력 예시:**
```
[WARNING] [2024-01-15T12:10:00.000Z] ⚠️ 이미지 업로드 실패: 파일 없음
```

#### ERROR (오류)
오류 및 예외 상황 ❌
```javascript
logger.error('이미지 업로드 중 오류 발생:', error.message);
```
**출력 예시:**
```
[ERROR] [2024-01-15T12:15:00.000Z] ❌ 이미지 업로드 중 오류 발생: 파일 크기 초과
```

### 특수 로그 타입

#### UPLOAD (업로드)
이미지 업로드 정보 📤
```javascript
logger.upload(imageId, filename, size);
```
**출력 예시:**
```
[UPLOAD] [2024-01-15T12:05:30.000Z] 📤 이미지 업로드 - ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890, 파일: vacation.jpg, 크기: 2048.75KB
```

#### DELETE (삭제)
이미지 자동 삭제 🗑️
```javascript
logger.delete(imageId);
```
**출력 예시:**
```
[DELETE] [2024-01-15T12:15:30.000Z] 🗑️ 이미지 자동 삭제 - ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

#### VIEW (조회)
이미지 조회 이벤트 👁️
```javascript
logger.view(imageId, found);
```
**출력 예시 (성공):**
```
[VIEW] [2024-01-15T12:10:00.000Z] 👁️ 이미지 조회 - ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```
**출력 예시 (실패):**
```
[VIEW] [2024-01-15T12:10:00.000Z] 🔍 이미지 조회 실패 - ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890 (만료 또는 존재하지 않음)
```

---

## 2. Morgan HTTP 로깅

### 로그 포맷

```
METHOD URL STATUS_CODE CONTENT_LENGTH - RESPONSE_TIME ADDITIONAL_INFO
```

### 예시

```bash
GET /api/health 200 125 - 3.456 ms
POST /api/upload 200 256 - 234.567 ms 파일: photo.jpg
GET /view/abc123 200 3847 - 12.345 ms
GET /api/image/xyz789 404 45 - 2.123 ms
```

### 필드 설명

- **METHOD**: HTTP 메서드 (GET, POST, PUT, DELETE 등)
- **URL**: 요청 URL 경로
- **STATUS_CODE**: HTTP 상태 코드 (200, 404, 500 등)
- **CONTENT_LENGTH**: 응답 본문 크기 (바이트)
- **RESPONSE_TIME**: 응답 시간 (밀리초)
- **ADDITIONAL_INFO**: 추가 정보 (업로드 파일명 등)

---

## 3. 서버 시작 로그

서버가 시작되면 다음과 같은 초기화 정보가 표시됩니다:

```
============================================================
[SUCCESS] [2024-01-15T12:00:00.000Z] ✅ PhotoTemi-QR 서버 시작됨
[INFO] [2024-01-15T12:00:00.000Z] URL: http://localhost:3000
[INFO] [2024-01-15T12:00:00.000Z] 환경: development
[INFO] [2024-01-15T12:00:00.000Z] Node.js 버전: v20.18.0
[INFO] [2024-01-15T12:00:00.000Z] 업로드 디렉토리: C:\uploads
[INFO] [2024-01-15T12:00:00.000Z] 최대 파일 크기: 10MB
[INFO] [2024-01-15T12:00:00.000Z] 이미지 만료 시간: 10분
============================================================
```

---

## 4. 이미지 업로드 플로우 로그 예시

전체 이미지 업로드 과정의 로그:

```
POST /api/upload 200 256 - 234.567 ms 파일: vacation.jpg
[UPLOAD] [2024-01-15T12:05:30.000Z] 📤 이미지 업로드 - ID: a1b2c3d4, 파일: vacation.jpg, 크기: 2048.75KB
[INFO] [2024-01-15T12:05:30.000Z] 현재 저장된 이미지 수: 3
[INFO] [2024-01-15T12:05:30.000Z] 이미지 삭제 예약됨 (10분 후) - ID: a1b2c3d4
[SUCCESS] [2024-01-15T12:05:30.000Z] ✅ 이미지 업로드 완료 - ID: a1b2c3d4
```

---

## 5. 이미지 조회 플로우 로그 예시

이미지 보기 페이지 접근 시:

```
GET /view/a1b2c3d4 200 3847 - 12.345 ms
[VIEW] [2024-01-15T12:10:00.000Z] 👁️ 이미지 조회 - ID: a1b2c3d4
```

---

## 6. 이미지 삭제 플로우 로그 예시

10분 후 자동 삭제 시:

```
[DELETE] [2024-01-15T12:15:30.000Z] 🗑️ 이미지 자동 삭제 - ID: a1b2c3d4
[INFO] [2024-01-15T12:15:30.000Z] 메모리에서 이미지 정보 삭제됨 - ID: a1b2c3d4
```

---

## 7. 오류 로그 예시

### 파일 없이 업로드 시도
```
POST /api/upload 400 45 - 2.123 ms 파일 없음
[WARNING] [2024-01-15T12:20:00.000Z] ⚠️ 이미지 업로드 실패: 파일 없음
```

### 존재하지 않는 이미지 조회
```
GET /api/image/invalid123 404 67 - 1.234 ms
[WARNING] [2024-01-15T12:25:00.000Z] ⚠️ 이미지 조회 실패 - ID: invalid123 (만료 또는 존재하지 않음)
```

### 404 에러
```
GET /api/nonexistent 404 45 - 0.789 ms
[WARNING] [2024-01-15T12:30:00.000Z] ⚠️ 404 - 페이지를 찾을 수 없음: GET /api/nonexistent
```

### 서버 오류
```
[ERROR] [2024-01-15T12:35:00.000Z] ❌ 서버 오류 발생: Cannot read property 'x' of undefined
[ERROR] [2024-01-15T12:35:00.000Z] ❌ 스택 트레이스: Error: Cannot read property 'x' of undefined
    at ...
```

---

## 8. 헬스체크 로그

서버 상태 확인 시:

```
GET /api/health 200 125 - 3.456 ms
[INFO] [2024-01-15T12:40:00.000Z] 헬스체크 요청
```

**응답 데이터에 포함되는 정보:**
- `activeImages`: 현재 메모리에 저장된 이미지 수
- `uptime`: 서버 가동 시간 (초)

---

## 9. 로그 분석 팁

### 특정 이미지 추적
특정 이미지 ID의 전체 라이프사이클을 추적:
```bash
# Windows PowerShell
npm start | Select-String "a1b2c3d4"

# Linux/Mac
npm start | grep "a1b2c3d4"
```

### 오류만 보기
오류 로그만 필터링:
```bash
# Windows PowerShell
npm start | Select-String "ERROR"

# Linux/Mac
npm start | grep "ERROR"
```

### 업로드 통계
업로드된 파일 추적:
```bash
# Windows PowerShell
npm start | Select-String "UPLOAD"

# Linux/Mac
npm start | grep "UPLOAD"
```

---

## 10. 프로덕션 환경 로깅

프로덕션 환경에서는 로그를 파일로 저장하는 것을 권장합니다:

```bash
# Windows
npm start > logs.txt 2>&1

# Linux/Mac
npm start >> logs/server.log 2>&1
```

또는 Winston과 같은 고급 로깅 라이브러리 사용을 고려하세요.

---

## 로그 타임스탬프

모든 로그는 ISO 8601 형식의 UTC 타임스탬프를 포함합니다:
```
2024-01-15T12:00:00.000Z
```

한국 시간으로 변환하려면 +9시간을 더하세요.

