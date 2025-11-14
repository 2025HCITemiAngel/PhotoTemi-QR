const path = require("path");

const config = {
  // 서버 설정
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // 파일 업로드 설정
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    uploadDir: path.join(__dirname, "..", "uploads"),
    allowedMimeTypes: ["image/"], // "image/"로 시작하는 모든 타입
  },

  // 이미지 만료 설정
  image: {
    expirationTime: 10 * 60 * 1000, // 10분 (밀리초)
    expirationMinutes: 10, // 10분
  },
};

module.exports = config;

