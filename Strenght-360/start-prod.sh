#!/usr/bin/env bash
set -e

PROJECT_ROOT="/home/ashok/Downloads/Strenght-360"

echo "🚀 Starting Strength 360 in PRODUCTION mode..."

cd "$PROJECT_ROOT"

echo "📦 Installing root dependencies..."
npm install

echo "🏗  Building frontend with .env.production (VITE_API_URL=https://test.peop360.com)..."
npm run build

echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "🧹 Killing any existing server on port 5100..."
lsof -ti:5100 | xargs -r kill

echo "🔧 Starting backend on port 5100..."
PORT=5100 NODE_ENV=production node server.js
