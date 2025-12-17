# ATRIA 360 Platform

<div align="center">
  <img src="peop360_logo_powered.jpeg" width="300" alt="ATRIA 360 - Powered by Peop360" />
  
  **A unified assessment platform for psychometric testing and adaptive learning**
</div>

---

## 🎯 Overview

ATRIA 360 is a comprehensive assessment platform combining:
- **Strength-360**: Psychometric testing system
- **Beyonders-360**: Adaptive assessment platform
- **Centralized Admin Portal**: Complete test management and user administration

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ATRIA 360 Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Candidate  │  │    Admin    │  │   Backend   │        │
│  │  Frontend   │  │   Portal    │  │     API     │        │
│  │  Port 4901  │  │  Port 4903  │  │  Port 4902  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                 │
│  ┌────────────────────────┼──────────────────────────┐     │
│  │                        ▼                          │     │
│  │  ┌──────────────────────────────────────────┐    │     │
│  │  │         PostgreSQL Database              │    │     │
│  │  │            Port 4904                     │    │     │
│  │  └──────────────────────────────────────────┘    │     │
│  │                                                   │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │     │
│  │  │  Redis   │  │  Worker  │  │ Mailhog  │       │     │
│  │  │  (Cache) │  │  (Email) │  │  (Dev)   │       │     │
│  │  │ Port4906 │  │ Port4907 │  │ Port4908 │       │     │
│  │  └──────────┘  └──────────┘  └──────────┘       │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Installation

```bash
# Clone the repository
cd /home/ashok/atria-proj

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Candidate App** | http://localhost:4901 | No login required for test-taking |
| **Admin Portal** | http://localhost:4903 | admin@atria360.com / admin123 |
| **API Server** | http://localhost:4902/api/health | N/A |
| **pgAdmin** | http://localhost:4905 | admin@atria360.com / admin@4905 |
| **Mailhog** | http://localhost:4908 | N/A (DEV email viewer) |

## 📊 Port Mapping

All services run on dedicated ports (4901-4908):

| Port | Service | Description |
|------|---------|-------------|
| 4901 | Candidate Frontend | React app for test takers |
| 4902 | Backend API | Express.js REST API |
| 4903 | Admin Portal | React admin dashboard |
| 4904 | PostgreSQL | Database server |
| 4905 | pgAdmin | Database admin UI |
| 4906 | Redis | Cache & queue |
| 4907 | Worker | Email processing |
| 4908 | Mailhog | DEV email testing |

## 🔐 Default Credentials

**⚠️ CHANGE THESE IN PRODUCTION!**

- **Admin Login**: `admin@atria360.com` / `admin123`
- **Database**: `atria_admin` / `atria_secure_2024`
- **pgAdmin**: `admin@atria360.com` / `admin@4905`

## 📋 Features

### For Administrators
- ✅ **User Management**: Create users (single/bulk CSV import)
- ✅ **Test Management**: Create and configure tests
- ✅ **Test Assignment**: Allot tests to users with automatic email links
- ✅ **Response Monitoring**: Real-time tracking of test submissions
- ✅ **Excel Export**: Download detailed reports
- ✅ **Dashboard Analytics**: Completion rates, domain breakdown

### For Candidates
- ✅ **Secure Test Access**: Token-based test links via email
- ✅ **Progress Tracking**: Auto-save and resume capability
- ✅ **Multi-step Registration**: Comprehensive student info collection
- ✅ **Psychometric Assessment**: 20-minute forced-choice questionnaire
- ✅ **Instant Results**: Talent domain analysis and scoring

### Technical Features
- ✅ **Centralized Storage**: PostgreSQL database (no JSON files)
- ✅ **Role-Based Access**: Admin vs Candidate separation
- ✅ **Email Integration**: Async SMTP with queue management
- ✅ **API-First Design**: RESTful endpoints
- ✅ **Docker Deployment**: One-command deployment
- ✅ **Production Ready**: Health checks, logging, error handling

## 🗄️ Database Schema

The platform uses PostgreSQL with the following core tables:

- **users**: All user accounts (admin + candidates)
- **roles**: System roles (ADMIN, CANDIDATE)
- **user_roles**: Role assignments
- **tests**: Test definitions and configs
- **assignments**: Who gets which test, when
- **responses**: Test responses and scores
- **invitations**: User onboarding tokens
- **email_queue**: Async email processing
- **audit_logs**: Admin action tracking

## 🛠️ Development

### Local Development (without Docker)

```bash
# Terminal 1: Start PostgreSQL (or use Docker)
docker run -d -p 4904:5432 -e POSTGRES_PASSWORD=atria_secure_2024 postgres:15-alpine

# Terminal 2: Backend API
cd Strenght-360/backend
npm install
export DATABASE_URL="postgresql://atria_admin:atria_secure_2024@localhost:4904/atria360"
npm start

# Terminal 3: Candidate Frontend
cd Strenght-360
npm install
export VITE_API_URL="http://localhost:4902"
npm run dev

# Terminal 4: Admin Portal
cd Beyonders-360-main
npm install
export VITE_API_URL="http://localhost:4902"
npm run dev
```

### Project Structure

```
atria-proj/
├── docker-compose.yml          # Main orchestration file
├── init-scripts/
│   └── 01_init_schema.sql     # Database initialization
├── Strenght-360/               # Psychometric test app
│   ├── backend/
│   │   ├── server.js          # Express API
│   │   ├── worker.js          # Email worker
│   │   └── Dockerfile
│   ├── src/                   # React frontend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── Beyonders-360-main/         # Admin portal
│   ├── App.jsx
│   ├── Dockerfile.admin
│   └── nginx.conf
├── StudentInfo.tsx             # Student registration form spec
└── peop360_logo_powered.jpeg   # Platform logo
```

## 📧 Email System

The platform includes a robust email system:

### Email Templates
- **Test Assignment**: Sent when admin allots a test
- **User Invitation**: Sent when admin creates a new user

### Email Flow
1. Admin action triggers email insertion into `email_queue` table
2. Worker service polls queue every 5 seconds
3. Redis pub/sub notifies worker for immediate processing
4. Emails sent via configured SMTP (Mailhog in DEV, real SMTP in production)
5. Failed emails retry up to 3 times

### Configuration
```bash
# Production SMTP (e.g., Gmail, SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@atria360.com
```

## 🔒 Security

### Implemented
- ✅ Password hashing (bcrypt)
- ✅ JWT token-based test access
- ✅ Role-based access control
- ✅ Secure token generation for assignments
- ✅ CORS configuration
- ✅ SQL injection prevention (parameterized queries)
- ✅ Audit logging

### Recommended for Production
- 🔐 Enable HTTPS (reverse proxy with Let's Encrypt)
- 🔐 Change all default passwords
- 🔐 Use environment variables for secrets
- 🔐 Implement rate limiting
- 🔐 Set up regular database backups
- 🔐 Monitor audit logs
- 🔐 Enable firewall rules

## 📊 Monitoring

### Health Checks
- API: `http://localhost:4902/health`
- Database: Built-in pg_isready check
- Redis: Built-in ping check

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f atria_api
docker-compose logs -f atria_worker

# View database logs
docker-compose logs -f atria_postgres
```

## 🔄 Backup & Restore

### Database Backup
```bash
# Backup
docker exec atria_postgres pg_dump -U atria_admin atria360 > backup.sql

# Restore
cat backup.sql | docker exec -i atria_postgres psql -U atria_admin -d atria360
```

## 🎨 Branding

The platform uses the **Peop360** logo (`peop360_logo_powered.jpeg`) consistently across:
- Email templates
- Frontend headers
- Admin portal
- PDF reports

## 🚧 Future Enhancements (Ports 4909-4910 Reserved)

- Analytics Dashboard (Port 4909)
- File Storage Service (Port 4910)
- Real-time WebSocket notifications
- Advanced reporting engine
- Multi-language support

## 📝 License

Proprietary - ATRIA 360 Platform

## 🤝 Support

For issues or questions, contact the development team.

---

**Built with ❤️ by the ATRIA team | Powered by Peop360**
