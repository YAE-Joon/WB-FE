#!/bin/bash

# 배포 스크립트
echo "🚀 Starting deployment..."

# Docker 이미지 빌드
echo "📦 Building Docker image..."
docker build -t wb-frontend .

# 기존 컨테이너 중지 및 제거
echo "🛑 Stopping existing containers..."
docker-compose down

# 새 컨테이너 시작
echo "🔄 Starting new containers..."
docker-compose up -d

# 로그 출력
echo "📋 Container logs:"
docker-compose logs -f