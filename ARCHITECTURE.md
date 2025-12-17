# ATRIA 360 Platform Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ATRIA 360 PLATFORM                          │
│                    Unified Assessment System                        │
└─────────────────────────────────────────────────────────────────────┘

                              EXTERNAL USERS
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            ┌───────────────┐             ┌─────────────────┐
            │  CANDIDATES   │             │  ADMINISTRATORS │
            │ (Test Takers) │             │  (Test Managers)│
            └───────┬───────┘             └────────┬────────┘
                    │                               │
                    │                               │
        ┌───────────┴───────────┐       ┌──────────┴──────────┐
        │   Browser Access      │       │   Browser Access    │
        │   Any Device          │       │   Desktop/Tablet    │
        └───────────┬───────────┘       └──────────┬──────────┘
                    │                               │
                    │                               │
                    ▼                               ▼
        ┌───────────────────────┐       ┌──────────────────────┐
        │  CANDIDATE FRONTEND   │       │   ADMIN PORTAL       │
        │  React + Vite         │       │   React + Vite       │
        │  Port: 4901           │       │   Port: 4903         │
        │  ✓ Test Taking UI     │       │   ✓ User Management  │
        │  ✓ Progress Tracking  │       │   ✓ Test Creation    │
        │  ✓ Results Display    │       │   ✓ Assignment       │
        │  ✓ Student Info Form  │       │   ✓ Analytics        │
        └───────────┬───────────┘       └──────────┬───────────┘
                    │                               │
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    │ REST API Calls
                                    │ (CORS Enabled)
                                    ▼
                    ┌───────────────────────────────┐
                    │      BACKEND API SERVER       │
                    │      Express.js + Node        │
                    │      Port: 4902               │
                    │                               │
                    │  Routes:                      │
                    │  • /api/auth/*     (Login)    │
                    │  • /api/admin/*    (Admin)    │
                    │  • /api/tests/*    (Tests)    │
                    │  • /api/responses/* (Results) │
                    │                               │
                    │  Middleware:                  │
                    │  • JWT Authentication         │
                    │  • Role-based Access Control  │
                    │  • Request Validation         │
                    └───────────┬───────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
    ┌──────────────────┐ ┌──────────────┐ ┌────────────────┐
    │   PostgreSQL DB  │ │    Redis     │ │  Email Queue   │
    │   Port: 4904     │ │  Port: 4906  │ │  (Table in PG) │
    │                  │ │              │ │                │
    │  Tables:         │ │  Purpose:    │ │  Worker polls  │
    │  • users         │ │  • Cache     │ │  every 5s for  │
    │  • roles         │ │  • Sessions  │ │  pending emails│
    │  • tests         │ │  • Queue     │ │                │
    │  • assignments   │ │    messages  │ │                │
    │  • responses     │ │              │ │                │
    │  • invitations   │ │              │ │                │
    │  • email_queue   │ │              │ │                │
    │  • audit_logs    │ │              │ │                │
    └──────────────────┘ └──────────────┘ └───────┬────────┘
                                                   │
                                                   │ Pub/Sub
                                                   ▼
                                        ┌──────────────────────┐
                                        │   WORKER SERVICE     │
                                        │   Node.js Process    │
                                        │   Port: 4907         │
                                        │                      │
                                        │  • Email Processing  │
                                        │  • Template Render   │
                                        │  • SMTP Sending      │
                                        │  • Retry Logic       │
                                        └──────────┬───────────┘
                                                   │
                                                   ▼
                                        ┌──────────────────────┐
                                        │     SMTP SERVICE     │
                                        │                      │
                                        │  DEV:  Mailhog       │
                                        │        Port: 4908    │
                                        │                      │
                                        │  PROD: Gmail/SendGrid│
                                        │        Port: 587     │
                                        └──────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        SUPPORT SERVICES                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  pgAdmin (Port 4905)          Mailhog UI (Port 4908)               │
│  • Database Admin UI           • Email Testing in DEV              │
│  • Query Builder               • View sent emails                  │
│  • Schema Viewer               • No real SMTP needed               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. User Registration Flow (Admin-Initiated)

```
Admin creates user → Insert into 'users' → Insert into 'invitations'
                              ↓
                    Generate invite token
                              ↓
                    Insert into 'email_queue'
                              ↓
                    Redis pub/sub notify
                              ↓
                    Worker picks up email
                              ↓
                    Send via SMTP
                              ↓
                    Candidate receives email
                              ↓
                    Click link → Verify token → Set password → Login
```

### 2. Test Assignment Flow

```
Admin selects test + users → Create 'assignments' records
                                      ↓
                            Generate access tokens
                                      ↓
                            Insert into 'email_queue'
                                      ↓
                            Worker sends emails
                                      ↓
                            Candidate receives email with link
                                      ↓
                            Click link → Verify token → Show test
                                      ↓
                            Take test → Submit responses
                                      ↓
                            Save to 'responses' table
                                      ↓
                            Update 'assignments' status
                                      ↓
                            Show results
```

### 3. Authentication Flow

```
Candidate → Enter credentials → POST /api/auth/login
                                        ↓
                            Verify against 'users' table
                                        ↓
                            Check password hash (bcrypt)
                                        ↓
                            Generate JWT token
                                        ↓
                            Return token + user info
                                        ↓
                            Frontend stores token
                                        ↓
                            Include token in all API requests
                                        ↓
                            Backend verifies token
                                        ↓
                            Allow/Deny based on role
```

## Security Layers

```
┌─────────────────────────────────────────────┐
│  1. Network Layer (Docker Network)          │
│     • Isolated container network            │
│     • Only exposed ports accessible         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  2. Transport Layer (HTTPS in production)   │
│     • SSL/TLS encryption                    │
│     • Reverse proxy (Nginx/Traefik)         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  3. Application Layer (JWT + RBAC)          │
│     • Token-based authentication            │
│     • Role-based authorization              │
│     • Request validation                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  4. Data Layer (Database Security)          │
│     • Parameterized queries (SQL injection) │
│     • Password hashing (bcrypt)             │
│     • Row-level security (postgres)         │
└─────────────────────────────────────────────┘
```

## Port Allocation Strategy

```
4901  Candidate Frontend    ──┐
                              │  User-facing
4903  Admin Portal          ──┘
                              
4902  Backend API           ──┐
                              │  Core services
4904  PostgreSQL            ──┤
4906  Redis                 ──┤
4907  Worker                ──┘

4905  pgAdmin               ──┐
                              │  Support/Dev tools
4908  Mailhog               ──┘

4909  Reserved (Analytics)  ──┐
                              │  Future use
4910  Reserved (Files)      ──┘
```

## Technology Stack

```
┌──────────────────────────────────────────┐
│            FRONTEND LAYER                │
├──────────────────────────────────────────┤
│  React 18                                │
│  TypeScript                              │
│  Vite (Build Tool)                       │
│  Tailwind CSS                            │
│  Lucide Icons                            │
│  Axios (HTTP Client)                     │
└──────────────────────────────────────────┘
              ↓ REST API
┌──────────────────────────────────────────┐
│            BACKEND LAYER                 │
├──────────────────────────────────────────┤
│  Node.js 18                              │
│  Express.js                              │
│  JWT (jsonwebtoken)                      │
│  Bcrypt (password hashing)               │
│  Node-Postgres (pg)                      │
│  IORedis                                 │
│  Nodemailer                              │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│            DATA LAYER                    │
├──────────────────────────────────────────┤
│  PostgreSQL 15                           │
│  Redis 7                                 │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│         INFRASTRUCTURE                   │
├──────────────────────────────────────────┤
│  Docker                                  │
│  Docker Compose                          │
│  Nginx (frontend serving)                │
└──────────────────────────────────────────┘
```

## Deployment Strategy

```
Development:
    ./start-atria.sh
    All services on localhost:4901-4908
    Mailhog for email testing
    pgAdmin for database management

Production:
    Docker Compose on VPS/Cloud
    Reverse proxy (Nginx/Traefik) with SSL
    Real SMTP (Gmail/SendGrid/AWS SES)
    Database backups (pg_dump scheduled)
    Monitoring (optional: Grafana/Prometheus)
    Logging (Docker logs → CloudWatch/ELK)
```
