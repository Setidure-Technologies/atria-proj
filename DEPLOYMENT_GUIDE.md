# 🚀 ATRIA 360 - Deployment Guide

This guide details how to deploy the full ATRIA 360 platform using Docker.

## 🏗️ Architecture

The platform consists of 6 Docker containers:

1. **atria_postgres** (Port 4904): PostgreSQL 15 database
2. **atria_redis** (Port 4906): Redis for job queues and caching
3. **atria_api** (Port 4902): Node.js/Express Backend API
4. **atria_worker** (No public port): Background worker for emails and jobs
5. **atria_admin** (Port 4903): Admin Portal (React + Nginx)
6. **atria_frontend** (Port 4901): Candidate Application (React + Nginx)
http://localhost:4901/login
*Dev Tools:*
- **atria_pgadmin** (Port 4905): Database management UI
- **atria_mailhog** (Port 4908): Email testing tool (captures emails)

## 📋 Prerequisites

- Docker Engine (v20.10+)
- Docker Compose (v2.0+)
- 4GB+ RAM recommended

## 🚀 Quick Deployment

Run the deployment script:

```bash
./deploy.sh
```

This will:
1. Check for `.env` configuration
2. Stop running containers
3. Build all images (Backend, Admin, Candidate)
4. Start services in detached mode

## ⚙️ Configuration

### Environment Variables (`.env`)

Ensure these are set for production:

```ini
# Database
POSTGRES_USER=atria_admin
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=atria360

# Security
JWT_SECRET=long_random_secure_string_here
BCRYPT_ROUNDS=12

# URLs (Important for CORS and Links)
VITE_API_URL=https://api.yourdomain.com
CORS_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com

# Email (For Production SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_api_key
SMTP_FROM=noreply@yourdomain.com
```

## 🔒 Production Security Checklist

1. **Change Default Passwords**:
   - Update `POSTGRES_PASSWORD` in `.env`
   - Update `PGADMIN_DEFAULT_PASSWORD` in `docker-compose.yml`

2. **Secure Ports**:
   - In a real production server, **do not expose** ports 4904 (DB), 4905 (pgAdmin), 4906 (Redis), or 4908 (Mailhog) to the public internet.
   - Use a firewall (UFW/AWS Security Groups) to block these ports.

3. **Reverse Proxy & SSL**:
   - Set up Nginx or Traefik on the host machine to handle SSL termination.
   - Route traffic:
     - `api.domain.com` -> `localhost:4902`
     - `admin.domain.com` -> `localhost:4903`
     - `app.domain.com` -> `localhost:4901`

## 🔄 Updates & Maintenance

**To update the application:**

1. Pull latest code:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart:
   ```bash
   ./deploy.sh
   ```

**To view logs:**

```bash
docker-compose logs -f atria_api      # Backend logs
docker-compose logs -f atria_worker   # Worker logs
docker-compose logs -f atria_admin    # Admin portal logs
```

**To backup database:**

```bash
docker exec -t atria_postgres pg_dumpall -c -U atria_admin > dump_`date +%d-%m-%Y"_"%H_%M_%S`.sql
```
