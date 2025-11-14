const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");

/**
 * GET /
 * 기본 라우트 (메인 페이지)
 */
router.get("/", (req, res) => {
  logger.info("메인 페이지 접속");
  res.send("PhotoTemi-QR 서버가 실행 중입니다!");
});

module.exports = router;

