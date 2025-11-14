# Node.js 공식 이미지 사용 (LTS 버전)
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치 (프로덕션 환경)
RUN npm ci --only=production

# 애플리케이션 소스 복사
COPY . .

# uploads 디렉토리 생성 및 권한 설정
RUN mkdir -p uploads && chmod 755 uploads

# 포트 노출
EXPOSE 3000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 애플리케이션 실행
CMD ["npm", "start"]

