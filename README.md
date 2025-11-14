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

## 주요 기능

### 이미지 업로드 및 임시 저장

- 안드로이드에서 이미지를 업로드하면 서버가 이미지를 저장하고 고유 URL을 반환
- 업로드된 이미지는 **10분 후 자동 삭제** (DB 불필요)
- QR 코드를 생성하여 다른 기기에서 이미지 확인 가능

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
├── config/                   # 설정 파일
│   └── config.js            # 애플리케이션 전역 설정
├── middleware/              # Express 미들웨어
│   └── upload.js           # Multer 업로드 설정
├── routes/                  # 라우트 핸들러
│   ├── index.js            # 기본 라우트
│   ├── api.js              # API 라우트
│   └── view.js             # 이미지 뷰 라우트
├── utils/                   # 유틸리티 함수
│   ├── logger.js           # 로깅 시스템
│   └── imageStore.js       # 이미지 저장소 및 스케줄러
├── public/                  # 정적 파일
│   ├── index.html          # 메인 페이지
│   ├── upload.html         # 업로드 페이지
│   ├── view-image.html     # 이미지 보기 템플릿
│   └── not-found.html      # 404 페이지
├── uploads/                 # 업로드된 이미지 저장 (자동 생성, gitignore)
├── server.js               # 메인 서버 파일 (간소화됨)
├── package.json            # 프로젝트 설정 및 의존성
├── README.md               # 프로젝트 문서
├── API_DOCUMENTATION.md    # API 문서 (안드로이드 개발용)
├── PROJECT_STRUCTURE.md    # 상세한 프로젝트 구조 설명
└── .gitignore             # Git 제외 파일 목록
```

> **📝 참고**: 프로젝트 구조와 아키텍처에 대한 자세한 설명은 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)를 참고하세요.

## 기술 스택

- **Node.js** - JavaScript 런타임
- **Express** - 웹 애플리케이션 프레임워크
- **Multer** - 파일 업로드 미들웨어
- **Morgan** - HTTP 요청 로깅
- **Crypto (내장)** - 고유 ID 생성
