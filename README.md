# PhotoTemi-QR

Node.js와 Express로 구축된 PhotoTemi-QR 서버입니다.

## 설치

```bash
npm install
```

## 실행

```bash
npm start
```

또는 개발 모드로 실행:

```bash
npm run dev
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 주요 기능

### 이미지 업로드 및 임시 저장

- 안드로이드에서 이미지를 업로드하면 서버가 이미지를 저장하고 고유 URL을 반환
- 업로드된 이미지는 **10분 후 자동 삭제** (DB 불필요)
- QR 코드를 생성하여 다른 기기에서 이미지 확인 가능

### 데이터베이스가 필요 없는 이유

- 이미지는 10분만 유지되므로 임시 저장만 필요
- 메모리(Map)와 파일 시스템만으로 충분
- 자동 삭제 메커니즘(setTimeout)으로 관리

## API 엔드포인트

- `GET /` - 메인 페이지
- `GET /upload.html` - 업로드 테스트 페이지
- `POST /api/upload` - 이미지 업로드 (안드로이드에서 사용)
- `GET /api/image/:id` - 이미지 정보 조회
- `GET /view/:id` - 이미지 보기 페이지 (QR 코드 스캔 시)
- `GET /api/health` - 서버 상태 확인

자세한 API 문서는 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)를 참고하세요.

## 프로젝트 구조

```
PhotoTemi-QR/
├── server.js                  # 메인 서버 파일 (로깅 포함)
├── public/                    # 정적 파일 디렉토리
│   ├── index.html            # 메인 HTML 페이지
│   └── upload.html           # 업로드 테스트 페이지
├── uploads/                   # 업로드된 이미지 저장 (자동 생성, gitignore)
├── package.json              # 프로젝트 설정 및 의존성
├── README.md                 # 프로젝트 문서
├── API_DOCUMENTATION.md      # API 문서 (안드로이드 개발용)
├── LOGGING.md                # 로깅 시스템 상세 가이드
└── .gitignore               # Git 제외 파일 목록
```

## 기술 스택

- **Node.js** - JavaScript 런타임
- **Express** - 웹 애플리케이션 프레임워크
- **Multer** - 파일 업로드 미들웨어
- **Morgan** - HTTP 요청 로깅
- **Crypto (내장)** - 고유 ID 생성

## 로깅 기능

서버는 다음과 같은 상세한 로그를 제공합니다:

### 로그 타입

- **[INFO]** - 일반 정보
- **[SUCCESS]** ✅ - 성공 작업
- **[WARNING]** ⚠️ - 경고 메시지
- **[ERROR]** ❌ - 오류 메시지
- **[UPLOAD]** 📤 - 이미지 업로드 정보
- **[DELETE]** 🗑️ - 이미지 삭제 정보
- **[VIEW]** 👁️ - 이미지 조회 정보

### 로그 예시

```
[INFO] [2024-01-15T12:00:00.000Z] 업로드 디렉토리 확인됨: C:\uploads
[UPLOAD] [2024-01-15T12:05:30.000Z] 📤 이미지 업로드 - ID: abc123, 파일: photo.jpg, 크기: 1024.50KB
[SUCCESS] [2024-01-15T12:05:30.000Z] ✅ 이미지 업로드 완료 - ID: abc123
[VIEW] [2024-01-15T12:10:00.000Z] 👁️ 이미지 조회 - ID: abc123
[DELETE] [2024-01-15T12:15:30.000Z] 🗑️ 이미지 자동 삭제 - ID: abc123
```

### HTTP 요청 로그 (Morgan)

모든 HTTP 요청은 다음 형식으로 기록됩니다:

```
GET /api/health 200 - 5.123 ms
POST /api/upload 200 - 234.567 ms 파일: photo.jpg
```

## 환경 변수

`.env` 파일을 생성하여 다음 환경 변수를 설정할 수 있습니다:

```
PORT=3000
NODE_ENV=development
```
