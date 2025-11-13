const express = require('express');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// 로거 유틸리티
const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
  },
  success: (message, ...args) => {
    console.log(`[SUCCESS] [${new Date().toISOString()}] ✅ ${message}`, ...args);
  },
  warning: (message, ...args) => {
    console.warn(`[WARNING] [${new Date().toISOString()}] ⚠️  ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ❌ ${message}`, ...args);
  },
  upload: (imageId, filename, size) => {
    console.log(`[UPLOAD] [${new Date().toISOString()}] 📤 이미지 업로드 - ID: ${imageId}, 파일: ${filename}, 크기: ${(size / 1024).toFixed(2)}KB`);
  },
  delete: (imageId) => {
    console.log(`[DELETE] [${new Date().toISOString()}] 🗑️  이미지 자동 삭제 - ID: ${imageId}`);
  },
  view: (imageId, found) => {
    if (found) {
      console.log(`[VIEW] [${new Date().toISOString()}] 👁️  이미지 조회 - ID: ${imageId}`);
    } else {
      console.log(`[VIEW] [${new Date().toISOString()}] 🔍 이미지 조회 실패 - ID: ${imageId} (만료 또는 존재하지 않음)`);
    }
  }
};

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info('업로드 디렉토리 생성됨:', uploadDir);
} else {
  logger.info('업로드 디렉토리 확인됨:', uploadDir);
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
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
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
morgan.token('body', (req) => {
  if (req.method === 'POST' && req.path === '/api/upload') {
    return req.file ? `파일: ${req.file.originalname}` : '파일 없음';
  }
  return '';
});

// 커스텀 포맷: 시간, 메서드, URL, 상태코드, 응답시간, 추가정보
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

// 정적 파일 제공 (public 폴더)
app.use(express.static(path.join(__dirname, 'public')));

// 업로드된 이미지 제공
app.use('/uploads', express.static(uploadDir));

// 기본 라우트
app.get('/', (req, res) => {
  logger.info('메인 페이지 접속');
  res.send('PhotoTemi-QR 서버가 실행 중입니다!');
});

// API 라우트 예시
app.get('/api/health', (req, res) => {
  logger.info('헬스체크 요청');
  const stats = {
    status: 'OK', 
    message: '서버가 정상적으로 작동 중입니다.',
    timestamp: new Date().toISOString(),
    activeImages: imageStore.size,
    uptime: process.uptime()
  };
  res.json(stats);
});

// 이미지 업로드 API (안드로이드에서 호출)
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      logger.warning('이미지 업로드 실패: 파일 없음');
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
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
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    };

    // 메모리에 저장
    imageStore.set(imageId, imageInfo);
    
    // 로깅
    logger.upload(imageId, req.file.originalname, req.file.size);
    logger.info(`현재 저장된 이미지 수: ${imageStore.size}`);

    // 10분 후 자동 삭제 예약
    scheduleImageDeletion(imageId, req.file.path);

    // 이미지를 볼 수 있는 URL 생성
    const viewUrl = `${req.protocol}://${req.get('host')}/view/${imageId}`;
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    logger.success(`이미지 업로드 완료 - ID: ${imageId}`);

    res.json({
      success: true,
      message: '이미지가 성공적으로 업로드되었습니다.',
      viewUrl: viewUrl,
      imageUrl: imageUrl,
      imageId: imageId,
      expiresIn: '10분',
      expiresAt: imageInfo.expiresAt
    });

  } catch (error) {
    logger.error('이미지 업로드 중 오류 발생:', error.message);
    res.status(500).json({ error: '이미지 업로드 중 오류가 발생했습니다.' });
  }
});

// 이미지 조회 API
app.get('/api/image/:id', (req, res) => {
  const imageId = req.params.id;
  const imageInfo = imageStore.get(imageId);

  if (!imageInfo) {
    logger.warning(`이미지 조회 실패 - ID: ${imageId} (만료 또는 존재하지 않음)`);
    return res.status(404).json({ error: '이미지를 찾을 수 없거나 만료되었습니다.' });
  }

  logger.info(`이미지 정보 조회 성공 - ID: ${imageId}`);

  res.json({
    success: true,
    image: {
      id: imageInfo.id,
      originalName: imageInfo.originalName,
      uploadedAt: imageInfo.uploadedAt,
      expiresAt: imageInfo.expiresAt,
      imageUrl: `${req.protocol}://${req.get('host')}/uploads/${imageInfo.filename}`
    }
  });
});

// 이미지 보기 페이지
app.get('/view/:id', (req, res) => {
  const imageId = req.params.id;
  const imageInfo = imageStore.get(imageId);

  if (!imageInfo) {
    logger.view(imageId, false);
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>이미지를 찾을 수 없음</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 500px;
          }
          h1 {
            color: #e74c3c;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ 이미지를 찾을 수 없습니다</h1>
          <p>이미지가 만료되었거나 존재하지 않습니다.</p>
          <p>이미지는 업로드 후 10분간만 유지됩니다.</p>
        </div>
      </body>
      </html>
    `);
  }

  logger.view(imageId, true);
  
  const imageUrl = `/uploads/${imageInfo.filename}`;
  const expiresAt = new Date(imageInfo.expiresAt);
  const now = new Date();
  const remainingMinutes = Math.max(0, Math.floor((expiresAt - now) / 1000 / 60));

  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PhotoTemi-QR - 이미지 보기</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 900px;
          width: 100%;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 2em;
        }
        .info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .timer {
          color: #e74c3c;
          font-weight: bold;
          font-size: 1.1em;
        }
        .image-container {
          text-align: center;
          margin-bottom: 20px;
        }
        .image-container img {
          max-width: 100%;
          height: auto;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        .actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }
        button, a.button {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          text-decoration: none;
          display: inline-block;
          transition: background 0.3s;
        }
        button:hover, a.button:hover {
          background: #5568d3;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
          padding: 10px;
          border-radius: 8px;
          margin-top: 20px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📸 PhotoTemi-QR</h1>
        </div>
        
        <div class="info">
          <div class="info-item">
            <span>📁 파일명:</span>
            <strong>${imageInfo.originalName}</strong>
          </div>
          <div class="info-item">
            <span>⏰ 남은 시간:</span>
            <span class="timer" id="timer">${remainingMinutes}분</span>
          </div>
        </div>

        <div class="image-container">
          <img src="${imageUrl}" alt="${imageInfo.originalName}">
        </div>

        <div class="actions">
          <a href="${imageUrl}" class="button" download>💾 다운로드</a>
          <button onclick="copyUrl()">🔗 URL 복사</button>
          <button onclick="location.reload()">🔄 새로고침</button>
        </div>

        <div class="warning">
          ⚠️ 이 이미지는 업로드 후 10분간만 유효합니다.
        </div>
      </div>

      <script>
        // URL 복사 기능
        function copyUrl() {
          navigator.clipboard.writeText(window.location.href).then(() => {
            alert('URL이 클립보드에 복사되었습니다!');
          }).catch(err => {
            alert('URL 복사 실패: ' + err);
          });
        }

        // 남은 시간 업데이트
        const expiresAt = new Date('${imageInfo.expiresAt}');
        
        function updateTimer() {
          const now = new Date();
          const remaining = expiresAt - now;
          
          if (remaining <= 0) {
            document.getElementById('timer').textContent = '만료됨';
            setTimeout(() => {
              location.reload();
            }, 2000);
            return;
          }
          
          const minutes = Math.floor(remaining / 1000 / 60);
          const seconds = Math.floor((remaining / 1000) % 60);
          document.getElementById('timer').textContent = minutes + '분 ' + seconds + '초';
        }
        
        updateTimer();
        setInterval(updateTimer, 1000);
      </script>
    </body>
    </html>
  `);
});

// 404 에러 핸들러
app.use((req, res) => {
  logger.warning(`404 - 페이지를 찾을 수 없음: ${req.method} ${req.url}`);
  res.status(404).json({ error: '페이지를 찾을 수 없습니다.' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  logger.error('서버 오류 발생:', err.message);
  logger.error('스택 트레이스:', err.stack);
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  logger.success(`PhotoTemi-QR 서버 시작됨`);
  logger.info(`URL: http://localhost:${PORT}`);
  logger.info(`환경: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Node.js 버전: ${process.version}`);
  logger.info(`업로드 디렉토리: ${uploadDir}`);
  logger.info(`최대 파일 크기: 10MB`);
  logger.info(`이미지 만료 시간: 10분`);
  console.log('='.repeat(60) + '\n');
});

module.exports = app;

