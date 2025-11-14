const express = require("express");
const path = require("path");
const morgan = require("morgan");
const config = require("./config/config");
const logger = require("./utils/logger");
const { uploadDir } = require("./middleware/upload");

// 라우터 import
const indexRouter = require("./routes/index");
const apiRouter = require("./routes/api");
const viewRouter = require("./routes/view");

const app = express();

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

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadDir));

// 라우터 설정
app.use("/", indexRouter);
app.use("/api", apiRouter);
app.use("/view", viewRouter);

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
app.listen(config.port, () => {
  console.log("\n" + "=".repeat(60));
  logger.success(`PhotoTemi-QR 서버 시작됨`);
  logger.info(`URL: http://localhost:${config.port}`);
  logger.info(`환경: ${config.nodeEnv}`);
  logger.info(`Node.js 버전: ${process.version}`);
  logger.info(`업로드 디렉토리: ${uploadDir}`);
  logger.info(`최대 파일 크기: ${config.upload.maxFileSize / 1024 / 1024}MB`);
  logger.info(`이미지 만료 시간: ${config.image.expirationMinutes}분`);
  console.log("=".repeat(60) + "\n");
});

module.exports = app;
