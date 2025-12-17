#!/usr/bin/env bash
set -e

echo "🐳 Starting Strength 360 with Docker on port 4801..."

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose down 2>/dev/null || true

# Build and start the application
echo "🏗  Building Docker image..."
docker compose build

echo "🚀 Starting application on port 4801..."
docker compose up -d

echo "✅ Strength 360 is now running in Docker!"
echo "📊 Application: http://localhost:4801/"
echo "👤 Admin Panel: http://localhost:4801/admin.html"
echo "🔧 API Health: http://localhost:4801/api/health"

# Show logs
echo "📋 Container logs (press Ctrl+C to stop viewing logs, container will keep running):"
docker compose logs -f
