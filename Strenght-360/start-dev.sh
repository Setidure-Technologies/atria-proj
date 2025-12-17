#!/bin/bash

# Strength 360 - Unified Server Startup Script

echo "🚀 Starting Strength 360 Application..."

# Check if frontend is built
if [ ! -d "dist" ]; then
    echo "📦 Building frontend for production..."
    npm run build
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Start unified server
echo "🔧 Starting unified server on port 5100..."
cd backend && PORT=5100 npm start &
SERVER_PID=$!
cd ..

echo ""
echo "✅ Application started successfully on unified server!"
echo ""
echo "📊 Application: ${VITE_API_URL}/"
echo "� Admin Panel: ${VITE_API_URL}/admin.html"
echo "� API Health: ${VITE_API_URL}/api/health"
echo ""
echo "Press Ctrl+C to stop the server..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping server..."
    kill $SERVER_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup INT

# Wait for process
wait
