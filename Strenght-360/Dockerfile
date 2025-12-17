# Multi-stage Docker build for Strength 360 Application

# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install root dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY admin.html ./
COPY .env.production ./

# Build the frontend
RUN npm run build

# Stage 2: Setup backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install --only=production

# Stage 3: Final production image
FROM node:18-alpine AS production

WORKDIR /app

# Install system dependencies if needed
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S strength360 -u 1001

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copy backend files and dependencies from stage 2
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/server.js ./backend/
COPY backend/pdfGenerator.js ./backend/
COPY backend/comprehensivePdfGenerator.js ./backend/
COPY backend/data/ ./backend/data/
COPY backend/reports/ ./backend/reports/

# Change ownership to non-root user
RUN chown -R strength360:nodejs /app
USER strength360

# Expose port
EXPOSE 4801

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4801/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the backend server
CMD ["node", "backend/server.js"]
