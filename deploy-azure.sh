#!/bin/bash

# Azure VM 배포 스크립트
echo "🚀 Starting Azure VM deployment..."

# 환경 확인
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# 기존 컨테이너 중지
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Docker 이미지 빌드
echo "📦 Building Docker image..."
docker build -t wb-frontend:latest .

# 컨테이너 실행
echo "🔄 Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# 상태 확인
echo "📋 Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment completed!"
echo "🌐 Application should be available at: http://$(curl -s ifconfig.me):80"