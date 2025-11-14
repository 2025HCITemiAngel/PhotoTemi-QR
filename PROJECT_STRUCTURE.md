# 📁 프로젝트 구조

이 문서는 PhotoTemi-QR 프로젝트의 디렉토리 구조와 각 파일의 역할을 설명합니다.

## 디렉토리 구조

```
PhotoTemi-QR/
├── config/                 # 설정 파일
│   └── config.js          # 애플리케이션 설정값 (포트, 업로드 제한 등)
│
├── middleware/            # Express 미들웨어
│   └── upload.js         # Multer 업로드 설정 및 미들웨어
│
├── routes/               # 라우트 핸들러
│   ├── index.js         # 기본 라우트 (/)
│   ├── api.js           # API 라우트 (/api/*)
│   └── view.js          # 이미지 뷰 라우트 (/view/:id)
│
├── utils/               # 유틸리티 함수
│   ├── logger.js        # 로깅 유틸리티
│   └── imageStore.js    # 이미지 저장소 및 스케줄러
│
├── public/              # 정적 파일 (HTML, CSS, JS)
│   ├── index.html       # 메인 페이지
│   ├── upload.html      # 업로드 페이지
│   ├── view-image.html  # 이미지 보기 템플릿
│   └── not-found.html   # 404 에러 페이지
│
├── uploads/             # 업로드된 이미지 저장 디렉토리
│
├── server.js            # 메인 서버 파일 (간소화됨)
├── package.json         # npm 패키지 정보
└── README.md            # 프로젝트 설명

```

## 파일별 상세 설명

### 📂 config/

#### `config.js`

- **역할**: 애플리케이션 전역 설정값 관리
- **내용**:
  - 서버 포트 및 환경 설정
  - 파일 업로드 제한 (최대 크기, 허용 타입)
  - 이미지 만료 시간 설정

---

### 📂 middleware/

#### `upload.js`

- **역할**: 파일 업로드 처리를 위한 Multer 미들웨어 설정
- **기능**:
  - 업로드 디렉토리 생성 및 확인
  - 파일명 생성 (UUID 기반)
  - 파일 크기 및 타입 검증
  - 이미지 파일만 허용

---

### 📂 routes/

#### `index.js`

- **역할**: 기본 라우트 처리
- **엔드포인트**:
  - `GET /` - 메인 페이지

#### `api.js`

- **역할**: API 엔드포인트 처리
- **엔드포인트**:
  - `GET /api/health` - 서버 상태 확인
  - `POST /api/upload` - 이미지 업로드
  - `GET /api/image/:id` - 이미지 정보 조회

#### `view.js`

- **역할**: 이미지 뷰 페이지 처리
- **엔드포인트**:
  - `GET /view/:id` - 이미지 보기 페이지 (템플릿 렌더링)

---

### 📂 utils/

#### `logger.js`

- **역할**: 통합 로깅 시스템
- **기능**:
  - 다양한 로그 레벨 지원 (info, success, warning, error)
  - 이미지 업로드/삭제/조회 전용 로깅
  - 타임스탬프 자동 추가

#### `imageStore.js`

- **역할**: 이미지 메타데이터 저장 및 관리
- **기능**:
  - 메모리 기반 이미지 정보 저장소 (Map)
  - 이미지 CRUD 작업
  - 자동 삭제 스케줄링 (10분 후)
  - 이미지 개수 추적

---

### 📂 public/

정적 HTML 파일들이 저장됩니다.

#### `index.html`

- 서비스 메인 페이지

#### `upload.html`

- 이미지 업로드 인터페이스

#### `view-image.html`

- 이미지 보기 페이지 템플릿 (서버에서 동적으로 렌더링)

#### `not-found.html`

- 이미지를 찾을 수 없을 때 표시되는 에러 페이지

---

### 📄 server.js

- **역할**: Express 애플리케이션의 진입점
- **기능**:
  - 미들웨어 설정
  - 라우터 연결
  - 정적 파일 제공
  - 에러 핸들링
  - 서버 시작

**간소화된 구조**로 각 라우트와 기능을 모듈에 위임합니다.

---

## 아키텍처 장점

### 1. **관심사의 분리 (Separation of Concerns)**

- 각 모듈이 명확한 책임을 가짐
- 코드 수정 시 영향 범위가 제한적

### 2. **재사용성 (Reusability)**

- `logger`, `imageStore` 등 유틸리티를 여러 곳에서 재사용
- 새로운 라우트 추가가 용이

### 3. **테스트 용이성 (Testability)**

- 각 모듈을 독립적으로 테스트 가능
- Mock 객체 주입이 쉬움

### 4. **유지보수성 (Maintainability)**

- 기능별로 파일이 분리되어 코드 찾기 쉬움
- 버그 수정 및 기능 추가가 간편

### 5. **확장성 (Scalability)**

- 새로운 라우트나 기능 추가 시 기존 코드에 영향 없음
- 설정값을 중앙에서 관리하여 일관성 유지

---

## 코드 흐름 예시

### 이미지 업로드 흐름

```
1. 클라이언트 → POST /api/upload
2. server.js → app.use('/api', apiRouter)
3. routes/api.js → upload 미들웨어 실행
4. middleware/upload.js → 파일 저장 (UUID 생성)
5. routes/api.js → imageStore.addImage() 호출
6. utils/imageStore.js → 메모리에 저장
7. utils/imageStore.js → scheduleImageDeletion() 호출
8. routes/api.js → 응답 반환 (viewUrl, imageUrl)
```

### 이미지 조회 흐름

```
1. 클라이언트 → GET /view/:id
2. server.js → app.use('/view', viewRouter)
3. routes/view.js → imageStore.getImage() 호출
4. utils/imageStore.js → 이미지 정보 반환
5. routes/view.js → 템플릿 파일 읽기
6. routes/view.js → 변수 치환 및 HTML 반환
```

---

## 모듈 간 의존성

```
server.js
  ├── config/config.js
  ├── utils/logger.js
  ├── middleware/upload.js (→ config, logger)
  ├── routes/index.js (→ logger)
  ├── routes/api.js (→ logger, imageStore, upload, config)
  └── routes/view.js (→ logger, imageStore)

utils/imageStore.js
  ├── utils/logger.js
  └── config/config.js
```
