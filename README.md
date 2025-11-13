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

## API 엔드포인트

- `GET /` - 메인 페이지
- `GET /api/health` - 서버 상태 확인

## 프로젝트 구조

```
PhotoTemi-QR/
├── server.js           # 메인 서버 파일
├── public/             # 정적 파일 디렉토리
│   └── index.html      # 메인 HTML 페이지
├── package.json        # 프로젝트 설정 및 의존성
└── README.md          # 프로젝트 문서
```

## 기술 스택

- **Node.js** - JavaScript 런타임
- **Express** - 웹 애플리케이션 프레임워크

## 환경 변수

`.env` 파일을 생성하여 다음 환경 변수를 설정할 수 있습니다:

```
PORT=3000
```

