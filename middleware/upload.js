const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const config = require("../config/config");
const logger = require("../utils/logger");

// 업로드 디렉토리 생성
const uploadDir = config.upload.uploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info("업로드 디렉토리 생성됨:", uploadDir);
} else {
  logger.info("업로드 디렉토리 확인됨:", uploadDir);
}

// Multer 스토리지 설정
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

// Multer 설정
const upload = multer({
  storage: storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    const isImage = config.upload.allowedMimeTypes.some((type) =>
      file.mimetype.startsWith(type)
    );

    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드 가능합니다."));
    }
  },
});

module.exports = {
  upload,
  uploadDir,
};

