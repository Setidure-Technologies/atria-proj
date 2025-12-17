#!/bin/bash
set -e

echo "🔄 ATRIA 360 Complete System Reset"
echo "=================================="
echo ""

# Step 1: Stop and remove all containers
echo "1️⃣  Stopping all containers..."
docker compose down -v

# Step 2: Remove old reports
echo "2️⃣  Cleaning reports directory..."
rm -rf ./reports/*
mkdir -p ./reports

# Step 3: Rebuild all containers
echo "3️⃣  Rebuilding all containers from scratch..."
docker compose build --no-cache

# Step 4: Start services
echo "4️⃣  Starting services..."
docker compose up -d

# Step 5: Wait for database to be ready
echo "5️⃣  Waiting for database to initialize..."
sleep 10

# Step 6: Check if database is ready
echo "6️⃣  Verifying database connection..."
until docker exec atria_postgres pg_isready -U atria_admin -d atria360; do
  echo "   Waiting for database..."
  sleep 2
done

echo ""
echo "✅ System reset complete!"
echo ""
echo "🔗 Access URLs:"
echo "   - Candidate Portal: http://localhost:4901"
echo "   - Admin Portal:     http://localhost:4903"
echo "   - API Health:       http://localhost:4902/api/health"
echo ""
echo "👤 Default Credentials:"
echo "   Admin: admin@atria360.com / Admin@123"
echo "   Candidate: candidate@test.com / Test@123"
echo ""
echo "📊 Next Steps:"
echo "   1. Login to admin portal"
echo "   2. Assign test to candidate"
echo "   3. Login as candidate and take test"
echo ""
