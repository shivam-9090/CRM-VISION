# 🚀 PRODUCTION DEPLOYMENT GUIDE

**Last Updated**: October 25, 2025  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Security (CRITICAL)
- [ ] Created `.env.production` with strong secrets (NOT committed to Git)
- [ ] Generated POSTGRES_PASSWORD: `openssl rand -base64 32`
- [ ] Generated JWT_SECRET: `openssl rand -base64 64`
- [ ] Updated DATABASE_URL with production password
- [ ] Verified `.env.production` is in `.gitignore`
- [ ] Changed default ports if needed (security through obscurity)
- [ ] Configured firewall rules (allow only 80, 443)

### ✅ Configuration
- [ ] Updated `FRONTEND_URL` to production domain
- [ ] Updated `NEXT_PUBLIC_API_URL` to production API domain
- [ ] Reviewed resource limits in `docker-compose.prod.yml`
- [ ] SSL certificates obtained (Let's Encrypt recommended)
- [ ] DNS records configured (A records for domain)

### ✅ Testing
- [ ] All 70 tests passing locally: `npm test`
- [ ] Database migrations reviewed: `npx prisma migrate status`
- [ ] Environment validation working: `npm run start:dev`
- [ ] Health endpoint accessible: `/api/health`

---

## 🔧 INITIAL SETUP

### Step 1: Clone & Configure

```bash
# Clone repository
git clone https://github.com/your-org/crm-vision.git
cd crm-vision

# Create production environment file
cp .env.production.example .env.production

# Generate strong secrets
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 64)"

# Edit .env.production with generated values
nano .env.production
```

### Step 2: Update Environment Variables

Edit `.env.production`:

```env
# Database - Use generated password
POSTGRES_PASSWORD=YOUR_GENERATED_PASSWORD_HERE
DATABASE_URL=postgresql://crm_admin:YOUR_GENERATED_PASSWORD_HERE@postgres:5432/crm_production

# JWT - Use generated secret
JWT_SECRET=YOUR_GENERATED_JWT_SECRET_HERE

# Domains - Update to your actual domains
FRONTEND_URL=https://crm.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Step 3: Verify Configuration

```bash
# Check that .env.production exists
ls -la .env.production

# Verify it's NOT tracked by Git
git status | grep .env.production  # Should return nothing

# Test Docker Compose config
docker-compose -f docker-compose.prod.yml config
```

---

## 🐳 DEPLOYMENT COMMANDS

### First-Time Deployment

```bash
# 1. Build production images
docker-compose -f docker-compose.prod.yml build --no-cache

# 2. Start database and redis first
docker-compose -f docker-compose.prod.yml up -d postgres redis

# 3. Wait for database to be healthy
docker-compose -f docker-compose.prod.yml ps

# 4. Run database migrations
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# 5. Start all services
docker-compose -f docker-compose.prod.yml up -d

# 6. Verify all containers are running
docker-compose -f docker-compose.prod.yml ps
```

### Verify Deployment

```bash
# Check health endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000

# Check logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Check resource usage
docker stats
```

---

## 🔄 UPDATES & MAINTENANCE

### Deploy Code Updates

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild images
docker-compose -f docker-compose.prod.yml build

# 3. Run migrations (if any)
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# 4. Restart services (zero-downtime rolling update)
docker-compose -f docker-compose.prod.yml up -d --force-recreate --no-deps backend
docker-compose -f docker-compose.prod.yml up -d --force-recreate --no-deps frontend
```

### Database Backup

```bash
# Backup PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U crm_admin crm_production > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U crm_admin crm_production < backup_20251025.sql
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f postgres

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

---

## 🔍 MONITORING

### Health Checks

```bash
# Backend API health
curl http://localhost:3001/api/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-10-25T...",
#   "uptime": 12345,
#   "database": {
#     "status": "connected",
#     "responseTime": "5ms"
#   },
#   "memory": {...},
#   "environment": "production"
# }

# Frontend health
curl http://localhost:3000

# Docker health status
docker-compose -f docker-compose.prod.yml ps
```

### Resource Monitoring

```bash
# Real-time stats
docker stats

# Container resource limits
docker inspect crm-backend-prod | grep -A 20 "Memory"

# Disk usage
docker system df
docker volume ls
```

---

## 🚨 TROUBLESHOOTING

### Backend Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Common issues:
# 1. Database not ready
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# 2. Missing migrations
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate status

# 3. Environment variables
docker-compose -f docker-compose.prod.yml exec backend env | grep DATABASE_URL
```

### Database Connection Issues

```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U crm_admin -d crm_production -c "SELECT 1;"

# Check DATABASE_URL format
# Should be: postgresql://crm_admin:PASSWORD@postgres:5432/crm_production

# Restart PostgreSQL
docker-compose -f docker-compose.prod.yml restart postgres
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Increase limits in docker-compose.prod.yml:
# deploy:
#   resources:
#     limits:
#       memory: 2G  # Increase this
```

### Health Check Failing

```bash
# Manual health check
docker-compose -f docker-compose.prod.yml exec backend wget -O- http://localhost:3001/api/health

# Check if port is listening
docker-compose -f docker-compose.prod.yml exec backend netstat -tulpn | grep 3001

# Disable health check temporarily (for debugging)
# Comment out healthcheck in docker-compose.prod.yml
```

---

## 🛡️ SECURITY HARDENING

### 1. Firewall Configuration

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH (be careful!)
sudo ufw enable

# Block database ports from external access
sudo ufw deny 5432/tcp
sudo ufw deny 6379/tcp
```

### 2. SSL/TLS Setup (Recommended)

```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d api.yourdomain.com

# Update nginx or add reverse proxy
# See nginx configuration in DOCKER_PRODUCTION_REVIEW.md
```

### 3. Regular Updates

```bash
# Update base images monthly
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 PERFORMANCE OPTIMIZATION

### Database Optimization

```sql
-- Inside PostgreSQL container
docker-compose -f docker-compose.prod.yml exec postgres psql -U crm_admin crm_production

-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

-- Analyze tables
ANALYZE;

-- Vacuum
VACUUM ANALYZE;
```

### Resource Tuning

Edit `docker-compose.prod.yml` resource limits based on usage:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'      # Increase if CPU usage consistently high
        memory: 2G     # Increase if OOM errors
      reservations:
        cpus: '1'      # Guaranteed CPU
        memory: 1G     # Guaranteed memory
```

---

## 🔄 ROLLBACK PROCEDURE

### Quick Rollback

```bash
# 1. Stop current version
docker-compose -f docker-compose.prod.yml down

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Rebuild and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify
curl http://localhost:3001/api/health
```

### Database Rollback

```bash
# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U crm_admin crm_production < backup_previous.sql

# OR run migration rollback
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate resolve --rolled-back <migration_name>
```

---

## 📈 SCALING

### Horizontal Scaling (Multiple Instances)

```bash
# Scale backend to 3 instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Note: Requires load balancer (nginx) in front
# See DOCKER_PRODUCTION_REVIEW.md for nginx config
```

### Database Scaling

```yaml
# Add read replicas (advanced)
# Update docker-compose.prod.yml with replica configuration
# Use pg_basebackup for replication setup
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Automated Tests

```bash
# Run health checks every 5 minutes
*/5 * * * * curl -f http://localhost:3001/api/health || mail -s "Backend Down" admin@example.com

# Database backup daily at 2 AM
0 2 * * * docker-compose -f /path/to/docker-compose.prod.yml exec postgres pg_dump -U crm_admin crm_production > /backups/backup_$(date +\%Y\%m\%d).sql
```

### Manual Verification

- [ ] Health endpoint returns 200 OK
- [ ] Frontend loads successfully
- [ ] Can login with test account
- [ ] Database queries working
- [ ] All Docker containers healthy
- [ ] No errors in logs
- [ ] SSL certificate valid (if using HTTPS)
- [ ] Firewall rules active

---

## 📞 SUPPORT

### Documentation
- **Architecture**: See `backend/README.md`
- **API Docs**: See `docs/API.md`
- **Docker Review**: See `DOCKER_PRODUCTION_REVIEW.md`

### Quick Commands Reference

```bash
# Start production
docker-compose -f docker-compose.prod.yml up -d

# Stop production
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Restart service
docker-compose -f docker-compose.prod.yml restart backend

# Database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U crm_admin crm_production > backup.sql

# Run migrations
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Check health
curl http://localhost:3001/api/health
```

---

**Production Deployment Complete!** 🎉

For issues or questions, check logs first, then consult documentation.
