# ATRIA 360 - Production Credentials & URLs

## ⚠️ IMPORTANT: FOR DEVELOPMENT/TESTING ONLY

**Default Password:** `Admin@123`

## Production URLs

### Candidate Portal
**URL:** https://candidate.atria.peop360.com  
**API:** https://candidate.atria.peop360.com/api

| Email | Password |
|-------|----------|
| candidate2@test.com | Admin@123 |
| aashitssharma@gmail.com | Admin@123 |

### Admin Portal
**URL:** https://admin.atria.peop360.com  
**API:** https://admin.atria.peop360.com/api

| Email | Password |
|-------|----------|
| admin@atria360.com | Admin@123 |

### API Server
**URL:** https://api.atria.peop360.com

## Local Development URLs

### Candidate Portal
**URL:** http://localhost:4901  
**API:** http://localhost:4902/api

### Admin Portal
**URL:** http://localhost:4903  
**API:** http://localhost:4902/api

## Container Ports
- Candidate Frontend: 4901
- Backend API: 4902
- Admin Frontend: 4903
- PostgreSQL: 4904
- pgAdmin: 4905
- Redis: 4906
- Worker: 4907
- Mailhog: 4908

## Production Deployment Checklist

Before going live:
- [ ] Change all default passwords
- [ ] Update JWT secret in `.env`
- [ ] Configure real SMTP service
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Review security headers

## Last Updated
**Date:** 2025-12-18  
**Updated By:** System Administrator
