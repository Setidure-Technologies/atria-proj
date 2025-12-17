# Strength 360 - Docker Production Deployment

This document explains how to run Strength 360 in production using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### Method 1: Using the startup script (Recommended)

```bash
./start-docker-prod.sh
```

This script will:
1. Stop any existing containers
2. Build the Docker image
3. Start the application on port 4801
4. Show the container logs

### Method 2: Manual Docker Compose

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Configuration

The application runs on **port 4801** and includes:

- **Frontend**: Served from `/` 
- **Backend API**: Available at `/api/*`
- **Admin Panel**: Available at `/admin.html`
- **Health Check**: Available at `/health` and `/api/health`

## Environment Variables

The production environment is configured in `.env.production`:

- `VITE_API_URL`: API endpoint for frontend (http://localhost:4801)
- `PORT`: Server port (4801)
- `NODE_ENV`: Set to production

## Data Persistence

The following directories are mounted as volumes:
- `./backend/data` - Application data
- `./backend/reports` - Generated reports

## Health Monitoring

The container includes health checks that verify the application is running:
- Endpoint: `http://localhost:4801/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

## Useful Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f strength360

# Stop the application
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Access container shell
docker-compose exec strength360 sh

# View resource usage
docker stats
```

## Troubleshooting

1. **Port 4801 already in use**:
   ```bash
   sudo lsof -ti:4801 | xargs -r kill
   ```

2. **Container won't start**:
   ```bash
   docker-compose logs strength360
   ```

3. **Rebuild from scratch**:
   ```bash
   docker-compose down
   docker system prune -f
   docker-compose up -d --build
   ```

## Production Considerations

- The application runs as a non-root user (`strength360`) for security
- Uses multi-stage builds for optimized image size
- Includes proper signal handling with dumb-init
- Health checks ensure container reliability
- Data directories are persisted outside the container

## Accessing the Application

Once running, access the application at:
- **Main App**: http://localhost:4801/
- **Admin Panel**: http://localhost:4801/admin.html
- **API Health**: http://localhost:4801/api/health
