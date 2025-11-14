const express = require("express");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 3000;

// 로거 유틸리티
const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
  },
  success: (message, ...args) => {
    console.log(
      `[SUCCESS] [${new Date().toISOString()}] ✅ ${message}`,
      ...args
    );
  },
  warning: (message, ...args) => {
    console.warn(
      `[WARNING] [${new Date().toISOString()}] ⚠️  ${message}`,
      ...args
    );
  },
  error: (message, ...args) => {
    console.error(
      `[ERROR] [${new Date().toISOString()}] ❌ ${message}`,
      ...args
    );
  },
  upload: (imageId, filename, size) => {
    console.log(
      `[UPLOAD] [${new Date().toISOString()}] 📤 이미지 업로드 - ID: ${imageId}, 파일: ${filename}, 크기: ${(
        size / 1024
      ).toFixed(2)}KB`
    );
  },
  delete: (imageId) => {
    console.log(
      `[DELETE] [${new Date().toISOString()}] 🗑️  이미지 자동 삭제 - ID: ${imageId}`
    );
  },
  view: (imageId, found) => {
    if (found) {
      console.log(
        `[VIEW] [${new Date().toISOString()}] 👁️  이미지 조회 - ID: ${imageId}`
      );
    } else {
      console.log(
        `[VIEW] [${new Date().toISOString()}] 🔍 이미지 조회 실패 - ID: ${imageId} (만료 또는 존재하지 않음)`
      );
    }
  },
};

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info("업로드 디렉토리 생성됨:", uploadDir);
} else {
  logger.info("업로드 디렉토리 확인됨:", uploadDir);
}

// 이미지 저장소 (메모리 기반 - DB 불필요)
const imageStore = new Map();

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드 가능합니다."));
    }
  },
});

// 10분 후 이미지 자동 삭제 함수
function scheduleImageDeletion(imageId, filePath) {
  logger.info(`이미지 삭제 예약됨 (10분 후) - ID: ${imageId}`);

  setTimeout(() => {
    // 파일 삭제
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error(`파일 삭제 실패 - ID: ${imageId}`, err.message);
      } else {
        logger.delete(imageId);
      }
    });

    // 메모리에서 삭제
    imageStore.delete(imageId);
    logger.info(`메모리에서 이미지 정보 삭제됨 - ID: ${imageId}`);
  }, 10 * 60 * 1000); // 10분 = 600,000ms
}

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan HTTP 요청 로깅 (개발 환경용)
morgan.token("body", (req) => {
  if (req.method === "POST" && req.path === "/api/upload") {
    return req.file ? `파일: ${req.file.originalname}` : "파일 없음";
  }
  return "";
});

// 커스텀 포맷: 시간, 메서드, URL, 상태코드, 응답시간, 추가정보
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
);

// 정적 파일 제공 (public 폴더)
app.use(express.static(path.join(__dirname, "public")));

// 업로드된 이미지 제공
app.use("/uploads", express.static(uploadDir));

// 기본 라우트
app.get("/", (req, res) => {
  logger.info("메인 페이지 접속");
  res.send("PhotoTemi-QR 서버가 실행 중입니다!");
});

// API 라우트 예시
app.get("/api/health", (req, res) => {
  logger.info("헬스체크 요청");
  const stats = {
    status: "OK",
    message: "서버가 정상적으로 작동 중입니다.",
    timestamp: new Date().toISOString(),
    activeImages: imageStore.size,
    uptime: process.uptime(),
  };
  res.json(stats);
});

// 이미지 업로드 API (안드로이드에서 호출)
app.post("/api/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      logger.warning("이미지 업로드 실패: 파일 없음");
      return res.status(400).json({ error: "이미지 파일이 필요합니다." });
    }

    const imageId = path.parse(req.file.filename).name; // UUID 부분만 추출
    const imageInfo = {
      id: imageId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };

    // 메모리에 저장
    imageStore.set(imageId, imageInfo);

    // 로깅
    logger.upload(imageId, req.file.originalname, req.file.size);
    logger.info(`현재 저장된 이미지 수: ${imageStore.size}`);

    // 10분 후 자동 삭제 예약
    scheduleImageDeletion(imageId, req.file.path);

    // 이미지를 볼 수 있는 URL 생성
    const viewUrl = `${req.protocol}://${req.get("host")}/view/${imageId}`;
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    logger.success(`이미지 업로드 완료 - ID: ${imageId}`);

    res.json({
      success: true,
      message: "이미지가 성공적으로 업로드되었습니다.",
      viewUrl: viewUrl,
      imageUrl: imageUrl,
      imageId: imageId,
      expiresIn: "10분",
      expiresAt: imageInfo.expiresAt,
    });
  } catch (error) {
    logger.error("이미지 업로드 중 오류 발생:", error.message);
    res.status(500).json({ error: "이미지 업로드 중 오류가 발생했습니다." });
  }
});

// 이미지 조회 API
app.get("/api/image/:id", (req, res) => {
  const imageId = req.params.id;
  const imageInfo = imageStore.get(imageId);

  if (!imageInfo) {
    logger.warning(
      `이미지 조회 실패 - ID: ${imageId} (만료 또는 존재하지 않음)`
    );
    return res
      .status(404)
      .json({ error: "이미지를 찾을 수 없거나 만료되었습니다." });
  }

  logger.info(`이미지 정보 조회 성공 - ID: ${imageId}`);

  res.json({
    success: true,
    image: {
      id: imageInfo.id,
      originalName: imageInfo.originalName,
      uploadedAt: imageInfo.uploadedAt,
      expiresAt: imageInfo.expiresAt,
      imageUrl: `${req.protocol}://${req.get("host")}/uploads/${
        imageInfo.filename
      }`,
    },
  });
});

// 이미지 보기 페이지
app.get("/view/:id", (req, res) => {
  const imageId = req.params.id;
  const imageInfo = imageStore.get(imageId);

  if (!imageInfo) {
    logger.view(imageId, false);
    return res
      .status(404)
      .sendFile(path.join(__dirname, "public", "not-found.html"));
  }

  logger.view(imageId, true);

  const imageUrl = `/uploads/${imageInfo.filename}`;
  const expiresAt = new Date(imageInfo.expiresAt);
  const now = new Date();
  const remainingMinutes = Math.max(
    0,
    Math.floor((expiresAt - now) / 1000 / 60)
  );

  // 템플릿 파일 읽기 및 변수 치환
  const templatePath = path.join(__dirname, "public", "view-image.html");
  let html = fs.readFileSync(templatePath, "utf8");

  html = html
    .replace(/\{\{IMAGE_URL\}\}/g, imageUrl)
    .replace(/\{\{ORIGINAL_NAME\}\}/g, imageInfo.originalName)
    .replace(/\{\{REMAINING_MINUTES\}\}/g, remainingMinutes.toString())
    .replace(/\{\{EXPIRES_AT\}\}/g, imageInfo.expiresAt);

  res.send(html);
});

// 404 에러 핸들러
app.use((req, res) => {
  logger.warning(`404 - 페이지를 찾을 수 없음: ${req.method} ${req.url}`);
  res.status(404).json({ error: "페이지를 찾을 수 없습니다." });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  logger.error("서버 오류 발생:", err.message);
  logger.error("스택 트레이스:", err.stack);
  res.status(500).json({ error: "서버 오류가 발생했습니다." });
});

// 서버 시작
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  logger.success(`PhotoTemi-QR 서버 시작됨`);
  logger.info(`URL: http://localhost:${PORT}`);
  logger.info(`환경: ${process.env.NODE_ENV || "development"}`);
  logger.info(`Node.js 버전: ${process.version}`);
  logger.info(`업로드 디렉토리: ${uploadDir}`);
  logger.info(`최대 파일 크기: 10MB`);
  logger.info(`이미지 만료 시간: 10분`);
  console.log("=".repeat(60) + "\n");
});

module.exports = app;
