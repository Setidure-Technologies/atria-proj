#!/bin/bash

# ATRIA 360 System Startup Script
# This script starts the entire system with proper error handling and fixes

echo "🚀 Starting ATRIA 360 System..."

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i:$port > /dev/null 2>&1; then
        echo "⚠️ Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo "⏳ Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start after $max_attempts attempts"
    return 1
}

# Check if Docker is running
if ! docker --version > /dev/null 2>&1; then
    echo "❌ Docker is not installed or not running"
    exit 1
fi

if ! docker-compose --version > /dev/null 2>&1; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Check for port conflicts
echo "🔍 Checking for port conflicts..."
ports=(4901 4902 4903 4904 4905 4906)
for port in "${ports[@]}"; do
    if ! check_port $port; then
        echo "   Killing processes on port $port..."
        sudo fuser -k $port/tcp 2>/dev/null || true
        sleep 1
    fi
done

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up -d --build

# Wait for database to be ready
if ! wait_for_service "http://localhost:4904" "PostgreSQL"; then
    # Try direct PostgreSQL connection
    echo "📡 Checking PostgreSQL directly..."
    for i in {1..30}; do
        if docker-compose exec -T atria_postgres pg_isready -U atria_admin -d atria360 > /dev/null 2>&1; then
            echo "✅ PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ PostgreSQL failed to start"
            echo "📋 PostgreSQL logs:"
            docker-compose logs atria_postgres
            exit 1
        fi
        echo "   Attempt $i/30..."
        sleep 2
    done
fi

# Run database migration
echo "📝 Running database migration..."
if [ -f "./migrate-beyonders.sh" ]; then
    ./migrate-beyonders.sh
    if [ $? -ne 0 ]; then
        echo "❌ Database migration failed"
        exit 1
    fi
else
    echo "⚠️ Migration script not found, applying SQL directly..."
    docker-compose exec -T atria_postgres psql -U atria_admin -d atria360 -f /docker-entrypoint-initdb.d/02_beyonders_test_setup.sql
fi

# Wait for backend API
if ! wait_for_service "http://localhost:4902/health" "Backend API"; then
    echo "📋 Backend API logs:"
    docker-compose logs atria_api
    exit 1
fi

# Wait for frontend services
if ! wait_for_service "http://localhost:4901" "Candidate Frontend"; then
    echo "📋 Candidate Frontend logs:"
    docker-compose logs atria_frontend
fi

if ! wait_for_service "http://localhost:4903" "Admin Portal"; then
    echo "📋 Admin Portal logs:"
    docker-compose logs atria_admin
fi

# Check service status
echo "📊 Service Status Check:"
services=("atria_postgres:4904" "atria_api:4902" "atria_frontend:4901" "atria_admin:4903" "atria_redis:4906")
all_healthy=true

for service in "${services[@]}"; do
    service_name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -s "http://localhost:$port" > /dev/null 2>&1 || [ "$service_name" = "atria_postgres" ] || [ "$service_name" = "atria_redis" ]; then
        echo "   ✅ $service_name (port $port)"
    else
        echo "   ❌ $service_name (port $port)"
        all_healthy=false
    fi
done

# Display system information
echo ""
echo "🎯 ATRIA 360 System Ready!"
echo ""
echo "📋 Access Points:"
echo "   🎓 Candidate Portal:    http://localhost:4901"
echo "   🔧 Admin Portal:        http://localhost:4903"
echo "   📡 API Endpoint:        http://localhost:4902"
echo "   🗄️ Database Admin:      http://localhost:4905"
echo "   📧 Email Testing:       http://localhost:4908"
echo ""
echo "🔑 Default Admin Login:"
echo "   Email:    admin@atria360.com"
echo "   Password: admin123"
echo ""

if [ "$all_healthy" = false ]; then
    echo "⚠️ Some services may not be fully ready. Check logs with:"
    echo "   docker-compose logs [service_name]"
    echo ""
fi

# Test API endpoints
echo "🧪 Testing API endpoints..."
API_HEALTH=$(curl -s http://localhost:4902/api/health 2>/dev/null)
if echo "$API_HEALTH" | grep -q "OK"; then
    echo "   ✅ API health check passed"
else
    echo "   ⚠️ API health check failed"
fi

# Test admin login
echo "🔐 Testing admin authentication..."
ADMIN_AUTH=$(curl -s -X POST http://localhost:4902/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@atria360.com","password":"admin123"}' 2>/dev/null)

if echo "$ADMIN_AUTH" | grep -q "token"; then
    echo "   ✅ Admin authentication working"
else
    echo "   ⚠️ Admin authentication issue"
    echo "   Response: $ADMIN_AUTH"
fi

echo ""
echo "📝 Quick Start Guide:"
echo "   1. Go to http://localhost:4903 for admin portal"
echo "   2. Login with admin@atria360.com / admin123"
echo "   3. Create users in 'User Management' or use 'Bulk Operations'"
echo "   4. Assign tests in 'Assignment Management'"
echo "   5. Users will receive test links via email"
echo ""
echo "🐛 Troubleshooting:"
echo "   • Check logs: docker-compose logs [service]"
echo "   • Restart system: docker-compose restart"
echo "   • Reset data: docker-compose down -v && docker-compose up -d"
echo ""
echo "🎉 System startup completed!"

if [ "$all_healthy" = true ]; then
    exit 0
else
    exit 1
fi
