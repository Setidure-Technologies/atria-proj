# ATRIA 360 Production Deployment Guide

## Prerequisites

- Ubuntu server with Nginx installed
- Domain: peop360.com pointing to your server
- Docker and Docker Compose running
- Ports 80, 443, 4901, 4902, 4903 open

## Step 1: Install and Configure Nginx

### 1.1 Install Nginx (if not already installed)
```bash
sudo apt update
sudo apt install nginx -y
```

### 1.2 Copy Nginx Configuration
```bash
sudo cp /home/ashok/atria-proj/nginx.conf.example /etc/nginx/sites-available/atria.peop360.com
```

### 1.3 Create Symbolic Link
```bash
sudo ln -s /etc/nginx/sites-available/atria.peop360.com /etc/nginx/sites-enabled/
```

### 1.4 Remove Default Nginx Config (if necessary)
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 1.5 Test Nginx Configuration
```bash
sudo nginx -t
```

### 1.6 Reload Nginx
```bash
sudo systemctl reload nginx
```

## Step 2 DNS Configuration on GoDaddy

1. Log in to your GoDaddy account
2. Go to **My Products** → **DNS** for peop360.com
3. Add/Edit the following DNS records:

### A Record for Main Domain
- **Type**: A
- **Name**: atria (or @ for root domain)
- **Value**: Your server's IP address (e.g., 123.45.67.89)
- **TTL**: 600 seconds (10 minutes)

### CNAME Record for www (optional)
- **Type**: CNAME
- **Name**: www.atria
- **Value**: atria.peop360.com
- **TTL**: 1 Hour

### Expected DNS Setup
```
atria.peop360.com.      A       123.45.67.89
www.atria.peop360.com.  CNAME   atria.peop360.com
```

4. **Wait for DNS Propagation** (5-30 minutes)
   - Check propagation: `nslookup atria.peop360.com`
   - Or use: https://www.whatsmydns.net/

## Step 3: Test the Deployment

### 3.1 Test Landing Page
```bash
curl http://atria.peop360.com/
```

### 3.2 Test from Browser
Visit: http://atria.peop360.com
- You should see the ATRIA 360 landing page
- Click "Candidate Portal" → Should redirect to /candidate
- Click "Admin Portal" → Should redirect to /admin

## Step 4: Install SSL Certificate (Let's Encrypt)

### 4.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 4.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d atria.peop360.com -d www.atria.peop360.com
```

Follow the prompts:
- Enter email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (Recommended: Yes)

### 4.3 Test Auto-Renewal
```bash
sudo certbot renew --dry-run
```

### 4.4 Enable SSL in Nginx Config
After SSL is installed, edit `/etc/nginx/sites-available/atria.peop360.com`:
- Comment out the HTTP redirect section
- Uncomment the HTTPS server block
- Reload nginx: `sudo systemctl reload nginx`

## Step 5: Update Docker Containers for Production

### 5.1 Update API URL in Frontend
Rebuild frontend containers with production URL:
```bash
cd /home/ashok/atria-proj

# Stop existing containers
docker stop atria_frontend atria_admin

# Remove containers
docker rm atria_frontend atria_admin

# Rebuild with production URL
docker build --no-cache \
  --build-arg VITE_API_URL=https://atria.peop360.com/api \
  -t atria_frontend:latest \
  -f Strenght-360/Dockerfile Strenght-360/

docker build --no-cache \
  --build-arg VITE_API_URL=https://atria.peop360.com/api \
  -t atria_admin:latest \
  -f Beyonders-360-main/Dockerfile.admin Beyonders-360-main/

# Start containers
docker run -d --name atria_frontend \
  --network atria-proj_atria_network \
  -p 4901:4901 \
  -e PORT=4901 \
  -e DATABASE_URL=postgres://atria_admin:atria_secure_2024@atria_postgres:5432/atria360 \
  -e JWT_SECRET=atria_jwt_secret_key_2024 \
  -e CORS_ORIGINS=https://atria.peop360.com \
  -e REDIS_URL=redis://atria_redis:6379 \
  atria_frontend:latest

docker run -d --name atria_admin \
  --network atria-proj_atria_network \
  -p 4903:80 \
  -e VITE_API_URL=https://atria.peop360.com/api \
  atria_admin:latest
```

## Step 6: Verification Checklist

- [ ] DNS resolves to server IP
- [ ] Landing page loads at https://atria.peop360.com
- [ ] Candidate portal accessible at https://atria.peop360.com/candidate
- [ ] Admin portal accessible at https://atria.peop360.com/admin
- [ ] API calls work through /api endpoint
- [ ] SSL certificate is valid (green lock in browser)
- [ ] HTTP redirects to HTTPS
- [ ] All Docker containers are running

## Troubleshooting

### DNS Not Resolving
```bash
# Check DNS propagation
nslookup atria.peop360.com
dig atria.peop360.com

# Wait 10-30 minutes for propagation
```

### Nginx 502 Bad Gateway
```bash
# Check if Docker containers are running
docker ps | grep atria

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart containers if needed
docker restart atria_frontend atria_admin atria_api
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew manually if needed
sudo certbot renew

# Check nginx SSL config
sudo nginx -t
```

### Port Conflicts
```bash
# Check what's using ports
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Stop conflicting services
sudo systemctl stop apache2  # if Apache is running
```

## Monitoring

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### Check Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Check Docker Logs
```bash
docker logs -f atria_frontend
docker logs -f atria_admin
docker logs -f atria_api
```

## Maintenance

### SSL Certificate Renewal
Certbot auto-renews certificates. Check cron job:
```bash
sudo systemctl status certbot.timer
```

### Update Application
```bash
cd /home/ashok/atria-proj
git pull
# Rebuild and restart containers as needed
```

### Backup Database
```bash
docker exec atria_postgres pg_dump -U atria_admin atria360 > backup_$(date +%Y%m%d).sql
```

## Security Recommendations

1. **Firewall**: Enable UFW and allow only necessary ports
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **SSH**: Disable password authentication, use SSH keys only

3. **Database**: Ensure PostgreSQL is not exposed publicly

4. **Updates**: Keep system and packages updated
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## Support

For issues or questions:
- Check logs: `/var/log/nginx/` and Docker logs
- Review this guide for troubleshooting steps
- Contact: Setidure Technologies
