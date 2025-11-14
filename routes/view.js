const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const logger = require("../utils/logger");
const imageStore = require("../utils/imageStore");

/**
 * GET /view/:id
 * 이미지 보기 페이지
 */
router.get("/:id", (req, res) => {
  const imageId = req.params.id;
  const imageInfo = imageStore.getImage(imageId);

  if (!imageInfo) {
    logger.view(imageId, false);
    return res
      .status(404)
      .sendFile(path.join(__dirname, "..", "public", "not-found.html"));
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
  const templatePath = path.join(__dirname, "..", "public", "view-image.html");
  let html = fs.readFileSync(templatePath, "utf8");

  html = html
    .replace(/\{\{IMAGE_URL\}\}/g, imageUrl)
    .replace(/\{\{ORIGINAL_NAME\}\}/g, imageInfo.originalName)
    .replace(/\{\{REMAINING_MINUTES\}\}/g, remainingMinutes.toString())
    .replace(/\{\{EXPIRES_AT\}\}/g, imageInfo.expiresAt);

  res.send(html);
});

module.exports = router;

