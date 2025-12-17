#!/bin/bash

# ATRIA 360 Platform Startup Script
# This script helps you start the platform quickly

set -e

echo "🚀 ATRIA 360 Platform Startup"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env file created${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
fi

# Stop any running containers
echo ""
echo "🛑 Stopping any running containers..."
docker-compose down 2>/dev/null || true

# Pull latest images
echo ""
echo "📥 Pulling latest images..."
docker-compose pull

# Build services
echo ""
echo "🔨 Building services..."
docker-compose build

# Start services
echo ""
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "🔍 Checking service status..."
docker-compose ps

# Display access information
echo ""
echo -e "${GREEN}✅ ATRIA 360 Platform is now running!${NC}"
echo ""
echo "📍 Access Points:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎓 Candidate App:    http://localhost:4901"
echo "  👨‍💼 Admin Portal:     http://localhost:4903"
echo "  🔌 API Server:        http://localhost:4902/api/health"
echo "  🗄️  pgAdmin:          http://localhost:4905"
echo "  📧 Mailhog (DEV):     http://localhost:4908"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔑 Default Credentials:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Admin: admin@atria360.com / admin123"
echo "  pgAdmin: admin@atria360.com / admin@4905"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Useful Commands:"
echo "  - View logs:        docker-compose logs -f"
echo "  - Stop platform:    docker-compose down"
echo "  - Restart:          docker-compose restart"
echo "  - View status:      docker-compose ps"
echo ""
echo -e "${YELLOW}⚠️  Remember to change default passwords in production!${NC}"
echo ""
