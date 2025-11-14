const fs = require("fs");
const logger = require("./logger");
const config = require("../config/config");

// 이미지 저장소 (메모리 기반 - DB 불필요)
const imageStore = new Map();

/**
 * 이미지 정보를 저장소에 추가
 */
function addImage(imageId, imageInfo) {
  imageStore.set(imageId, imageInfo);
  logger.info(`이미지 저장됨 - ID: ${imageId}, 현재 저장된 이미지 수: ${imageStore.size}`);
}

/**
 * 이미지 정보를 저장소에서 조회
 */
function getImage(imageId) {
  return imageStore.get(imageId);
}

/**
 * 이미지 정보를 저장소에서 삭제
 */
function deleteImage(imageId) {
  imageStore.delete(imageId);
  logger.info(`메모리에서 이미지 정보 삭제됨 - ID: ${imageId}`);
}

/**
 * 저장된 이미지 개수 반환
 */
function getImageCount() {
  return imageStore.size;
}

/**
 * 10분 후 이미지 자동 삭제 스케줄링
 */
function scheduleImageDeletion(imageId, filePath) {
  logger.info(`이미지 삭제 예약됨 (${config.image.expirationMinutes}분 후) - ID: ${imageId}`);

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
    deleteImage(imageId);
  }, config.image.expirationTime);
}

module.exports = {
  addImage,
  getImage,
  deleteImage,
  getImageCount,
  scheduleImageDeletion,
};

