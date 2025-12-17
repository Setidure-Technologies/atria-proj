#!/bin/bash

# ATRIA 360 - Production Deployment Script
# Builds and deploys all services using Docker Compose

set -e

echo "🚀 ATRIA 360 - Production Deployment"
echo "===================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✅ .env created. Please update it with production secrets!${NC}"
    else
        echo "Error: .env file missing!"
        exit 1
    fi
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing services...${NC}"
docker compose down

# Build and Start
echo ""
echo -e "${YELLOW}🏗️  Building and starting services...${NC}"
echo "This may take a few minutes..."
docker compose up -d --build

# Wait for health checks
echo ""
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check status
echo ""
echo -e "${YELLOW}🏥 Service Status:${NC}"
docker compose ps

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Access Points:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎓 Candidate App:    http://localhost:4901"
echo "  👨‍💼 Admin Portal:     http://localhost:4903"
echo "  🔌 API Server:       http://localhost:4902"
echo "  🗄️  pgAdmin:         http://localhost:4905"
echo "  📧 Mailhog:          http://localhost:4908"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: In production, ensure ports 4904, 4905, 4906, 4908 are NOT exposed publicly."
echo "   Only expose 4901 (Candidate) and 4903 (Admin) via a reverse proxy (Nginx/Traefik) with SSL."
echo ""
