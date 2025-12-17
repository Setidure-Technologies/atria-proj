#!/bin/bash

# ATRIA 360 - Quick Start Script
# Installs dependencies and starts everything

set -e

echo "🚀 ATRIA 360 - Quick Start"
echo "=========================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: Please run this from /home/ashok/atria-proj directory"
    exit 1
fi

# Install Backend Dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd Strenght-360/backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Backend dependencies already installed"
fi
cd ../..

# Install Admin Portal Dependencies
echo""
echo -e "${YELLOW}📦 Installing admin portal dependencies...${NC}"
cd Beyonders-360-main
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Admin portal dependencies already installed"
fi
cd ..

# Start Docker Services
echo ""
echo -e "${YELLOW}🐳 Starting Docker services...${NC}"
docker-compose down 2>/dev/null || true
docker-compose up -d

# Wait for services
echo ""
echo -e "${YELLOW}⏳ Waiting for services to be ready (30 seconds)...${NC}"
sleep 30

# Check health
echo ""
echo -e "${YELLOW}🏥 Checking service health...${NC}"
docker-compose ps

# Display access information
echo ""
echo -e "${GREEN}✅ ATRIA 360 Platform is Running!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Platform URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎓 Candidate App:    http://localhost:4901"
echo  "  🔌 API Server:        http://localhost:4902/api/health"
echo "  👨‍💼 Admin Portal:     http://localhost:4903 (or run dev below)"
echo "  🗄️  pgAdmin:          http://localhost:4905"
echo "  📧 Mailhog:           http://localhost:4908"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔑 Default Credentials:"
echo "  Admin: admin@atria360.com / admin123"
echo "  pgAdmin: admin@atria360.com / admin@4905"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 Run Apps in Development Mode:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  👉 Admin Portal:"
echo "     cd Beyonders-360-main && npm run dev"
echo "     # Visit: http://localhost:5173"
echo ""
echo "  👉 Candidate App:"
echo "     cd Strenght-360 && npm run dev"
echo "     # Visit: http://localhost:5174"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Useful Commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  - Test backend:     ./test-backend.sh"
echo "  - View logs:        docker-compose logs -f"
echo "  - Stop platform:    docker-compose down"
echo "  - Restart:          docker-compose restart"
echo ""
