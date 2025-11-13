const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 (public 폴더)
app.use(express.static(path.join(__dirname, 'public')));

// 기본 라우트
app.get('/', (req, res) => {
  res.send('PhotoTemi-QR 서버가 실행 중입니다!');
});

// API 라우트 예시
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '서버가 정상적으로 작동 중입니다.',
    timestamp: new Date().toISOString()
  });
});

// 404 에러 핸들러
app.use((req, res) => {
  res.status(404).json({ error: '페이지를 찾을 수 없습니다.' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

module.exports = app;

