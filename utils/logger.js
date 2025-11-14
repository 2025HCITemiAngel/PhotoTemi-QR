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

module.exports = logger;

