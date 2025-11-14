const express = require("express");
const path = require("path");
const router = express.Router();
const logger = require("../utils/logger");
const imageStore = require("../utils/imageStore");
const { upload } = require("../middleware/upload");
const config = require("../config/config");

/**
 * GET /api/health
 * 서버 상태 확인
 */
router.get("/health", (req, res) => {
  logger.info("헬스체크 요청");
  const stats = {
    status: "OK",
    message: "서버가 정상적으로 작동 중입니다.",
    timestamp: new Date().toISOString(),
    activeImages: imageStore.getImageCount(),
    uptime: process.uptime(),
  };
  res.json(stats);
});

/**
 * POST /api/upload
 * 이미지 업로드 (안드로이드에서 호출)
 */
router.post("/upload", upload.single("image"), (req, res) => {
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
      expiresAt: new Date(Date.now() + config.image.expirationTime).toISOString(),
    };

    // 메모리에 저장
    imageStore.addImage(imageId, imageInfo);

    // 로깅
    logger.upload(imageId, req.file.originalname, req.file.size);

    // 10분 후 자동 삭제 예약
    imageStore.scheduleImageDeletion(imageId, req.file.path);

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
      expiresIn: `${config.image.expirationMinutes}분`,
      expiresAt: imageInfo.expiresAt,
    });
  } catch (error) {
    logger.error("이미지 업로드 중 오류 발생:", error.message);
    res.status(500).json({ error: "이미지 업로드 중 오류가 발생했습니다." });
  }
});

/**
 * GET /api/image/:id
 * 이미지 정보 조회
 */
router.get("/image/:id", (req, res) => {
  const imageId = req.params.id;
  const imageInfo = imageStore.getImage(imageId);

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

module.exports = router;

