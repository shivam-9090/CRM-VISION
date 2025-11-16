# 🔧 Deployment Configuration Checklist

**Before deploying to production, update these configuration files with your actual values.**

---

## 📋 **Quick Overview**

| File | Purpose | Priority | Changes Needed |
|------|---------|----------|----------------|
| `.env.production` | Production environment variables | 🔴 CRITICAL | 8 values |
| `infra/nginx/nginx.conf` | Nginx domain configuration | 🔴 CRITICAL | 1 domain |
| `scripts/setup-ssl.sh` | SSL certificate setup | 🟡 MEDIUM | Run with domain |
| `.github/workflows/deploy.yml` | CI/CD deployment | 🟡 MEDIUM | 2 URLs |
| `docker-compose.prod.yml` | Production Docker setup | 🟢 LOW | Review only |

---

## 🔴 **CRITICAL: Environment Variables (.env.production)**

### **Location**: Root directory `E:\CRM_01\.env.production`

**Action**: Create this file from template and update ALL values

```bash
# 1. Copy template
cp .env.production.example .env.production

# 2. Edit the file and replace these values:
```

### **Values to Update:**

#### **1. Database Credentials** (3 values)
```bash
# Generate strong password
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Example: 
POSTGRES_PASSWORD=X8kL9mN2pQ5rS7tU9vW1xY3zA5bC7dE9fG1hJ3kL5mN7pQ9rS1tU3vW5xY7zA9bC

# Update in DATABASE_URL too
DATABASE_URL=postgresql://crm_admin:X8kL9mN2pQ5rS7tU9vW1xY3zA5bC7dE9fG1hJ3kL5mN7pQ9rS1tU3vW5xY7zA9bC@postgres:5432/crm_production?schema=public&connection_limit=10&pool_timeout=20
```

#### **2. JWT Secret** (1 value)
```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Example:
JWT_SECRET=A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7b8C9d0E1f2G3h4I5j6K7l8M9n0O1p2Q3r4S5t6U7v8W9x0Y1z2A3b4C5d6
```

#### **3. Sentry DSN** (1 value - REQUIRED)
```bash
# Sign up at https://sentry.io (free tier available)
# Create new project → Copy DSN

SENTRY_DSN=https://abcd1234efgh5678ijkl9012mnop3456@o123456.ingest.sentry.io/7890123
```

#### **4. Domain Names** (3 values)
```bash
# Your actual production domain
FRONTEND_URL=https://crm.yourcompany.com

# Your API domain (can be subdomain or path)
NEXT_PUBLIC_API_URL=https://api.yourcompany.com/api
# OR use path: https://crm.yourcompany.com/api

# App name (shown in UI)
NEXT_PUBLIC_APP_NAME="Your Company CRM"
```

### **Complete .env.production Template:**

```bash
# Database Configuration
POSTGRES_DB=crm_production
POSTGRES_USER=crm_admin
POSTGRES_PASSWORD=REPLACE_WITH_GENERATED_PASSWORD

# Backend Configuration
DATABASE_URL=postgresql://crm_admin:REPLACE_WITH_SAME_PASSWORD@postgres:5432/crm_production?schema=public&connection_limit=10&pool_timeout=20
REDIS_URL=redis://redis:6379
JWT_SECRET=REPLACE_WITH_GENERATED_JWT_SECRET
JWT_EXPIRES_IN=1d
NODE_ENV=production
PORT=3001

# Sentry Error Monitoring (REQUIRED)
SENTRY_DSN=REPLACE_WITH_YOUR_SENTRY_DSN

# Frontend Configuration
FRONTEND_URL=https://crm.yourcompany.com
NEXT_PUBLIC_API_URL=https://api.yourcompany.com/api
NEXT_PUBLIC_APP_NAME="Your Company CRM"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

---

## 🔴 **CRITICAL: Nginx Domain Configuration**

### **Location**: `E:\CRM_01\infra\nginx\nginx.conf`

**Action**: Replace `your-domain.com` with your actual domain (7 occurrences)

### **Find and Replace:**
```bash
# Find:    your-domain.com
# Replace: crm.yourcompany.com (your actual domain)
```

### **Lines to Update:**

1. **Line 113** - HTTP server name
```nginx
server_name crm.yourcompany.com www.crm.yourcompany.com;
```

2. **Line 133** - HTTPS server name
```nginx
server_name crm.yourcompany.com www.crm.yourcompany.com;
```

3. **Lines 139-141** - SSL certificate paths
```nginx
ssl_certificate /etc/letsencrypt/live/crm.yourcompany.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/crm.yourcompany.com/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/crm.yourcompany.com/chain.pem;
```

4. **Line 179** - Content Security Policy (CSP)
```nginx
add_header Content-Security-Policy "... connect-src 'self' https://api.crm.yourcompany.com wss://api.crm.yourcompany.com;" always;
```

5. **Line 316** - API subdomain (optional direct access)
```nginx
server_name api.crm.yourcompany.com;
```

6. **Lines 318-319** - API SSL certificates
```nginx
ssl_certificate /etc/letsencrypt/live/crm.yourcompany.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/crm.yourcompany.com/privkey.pem;
```

### **Quick Update Script:**
```bash
# Run this to update all occurrences at once
cd E:\CRM_01
$DOMAIN = "crm.yourcompany.com"  # REPLACE THIS

(Get-Content infra/nginx/nginx.conf) -replace 'your-domain\.com', $DOMAIN | Set-Content infra/nginx/nginx.conf
```

---

## 🟡 **MEDIUM: SSL Certificate Setup**

### **Location**: `E:\CRM_01\scripts\setup-ssl.sh`

**Action**: Run this script AFTER deploying to production server

### **Command:**
```bash
# On production server (Linux)
sudo ./scripts/setup-ssl.sh crm.yourcompany.com admin@yourcompany.com
```

### **Prerequisites:**
- ✅ Domain DNS configured (A record pointing to server IP)
- ✅ Ports 80 and 443 accessible
- ✅ Docker and docker-compose installed
- ✅ Nginx service running

### **What it does:**
1. Requests SSL certificate from Let's Encrypt
2. Configures auto-renewal (every 7 days at 3 AM)
3. Updates nginx with certificates
4. Verifies HTTPS is working

---

## 🟡 **MEDIUM: GitHub Actions Deployment URLs**

### **Location**: `E:\CRM_01\.github\workflows\deploy.yml`

**Action**: Update health check URLs (6 occurrences)

### **Staging Environment (Lines 66, 104-105):**
```yaml
# Line 66
url: https://staging.crm.yourcompany.com

# Lines 104-105
curl -f https://staging-api.crm.yourcompany.com/health || exit 1
curl -f https://staging.crm.yourcompany.com || exit 1
```

### **Production Environment (Lines 124, 170-171):**
```yaml
# Line 124
url: https://crm.yourcompany.com

# Lines 170-171
curl -f https://api.crm.yourcompany.com/health || exit 1
curl -f https://crm.yourcompany.com || exit 1
```

---

## 🟢 **LOW: Review Docker Compose (No changes needed)**

### **Location**: `E:\CRM_01\docker-compose.prod.yml`

**Action**: Review only - uses environment variables from `.env.production`

### **What to verify:**
```yaml
services:
  backend:
    env_file:
      - .env.production  # ✅ Correct
  frontend:
    env_file:
      - .env.production  # ✅ Correct
```

---

## 📝 **Staging Environment Setup (Optional but Recommended)**

### **Location**: `E:\CRM_01\.env.staging.example`

**Action**: Create `.env.staging` for testing before production

### **Command:**
```bash
cp .env.staging.example .env.staging
# Then edit .env.staging with staging-specific values
```

### **Key differences from production:**
- Use **test email service** (Mailtrap.io)
- Use **debug logging** enabled
- Use **separate database** with test data
- Use **staging subdomain** (staging.crm.yourcompany.com)

---

## ✅ **Pre-Deployment Checklist**

Run through this checklist before deploying:

### **1. Environment Variables**
- [ ] Created `.env.production` from template
- [ ] Generated strong `POSTGRES_PASSWORD` (32+ chars)
- [ ] Generated strong `JWT_SECRET` (64+ chars)
- [ ] Updated `DATABASE_URL` with correct password
- [ ] Set up Sentry account and copied DSN
- [ ] Updated `FRONTEND_URL` with actual domain
- [ ] Updated `NEXT_PUBLIC_API_URL` with actual API URL
- [ ] Verified `.env.production` is in `.gitignore`

### **2. Nginx Configuration**
- [ ] Replaced all `your-domain.com` in `nginx.conf`
- [ ] Updated SSL certificate paths with actual domain
- [ ] Updated Content Security Policy with actual API domain
- [ ] Saved nginx.conf changes

### **3. DNS Configuration**
- [ ] Created A record: `crm.yourcompany.com` → Server IP
- [ ] Created A record: `api.crm.yourcompany.com` → Server IP (if using subdomain)
- [ ] Created CNAME: `www.crm.yourcompany.com` → `crm.yourcompany.com`
- [ ] Verified DNS propagation: `dig crm.yourcompany.com`

### **4. Server Prerequisites**
- [ ] Docker installed (version 20+)
- [ ] Docker Compose installed (version 2+)
- [ ] Ports 80 and 443 open in firewall
- [ ] Git installed (for deployment)
- [ ] Sufficient disk space (20GB+ recommended)

### **5. GitHub Secrets (for CI/CD)**
- [ ] `RENDER_API_KEY` added to GitHub Secrets
- [ ] `RENDER_SERVICE_ID_BACKEND` added
- [ ] `RENDER_SERVICE_ID_FRONTEND` added
- [ ] `DATABASE_URL` added (production)
- [ ] Repository access configured

### **6. Third-Party Services**
- [ ] Sentry project created and DSN obtained
- [ ] Email SMTP configured (SendGrid/AWS SES/Gmail)
- [ ] Domain SSL certificate authority approved
- [ ] Monitoring service set up (optional)

---

## 🚀 **Deployment Commands**

### **1. Build and Deploy Production:**
```bash
# On production server
cd /path/to/CRM_01

# Pull latest code
git pull origin main

# Create .env.production (if not exists)
cp .env.production.example .env.production
# Edit .env.production with actual values

# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker exec crm-backend-prod npx prisma migrate deploy

# Seed initial data (optional)
docker exec crm-backend-prod npx prisma db seed

# Set up SSL certificates
sudo ./scripts/setup-ssl.sh crm.yourcompany.com admin@yourcompany.com

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### **2. Health Check:**
```bash
# Backend health
curl https://api.crm.yourcompany.com/health

# Frontend health
curl https://crm.yourcompany.com

# Check SSL certificate
openssl s_client -connect crm.yourcompany.com:443 -servername crm.yourcompany.com
```

### **3. Troubleshooting:**
```bash
# View backend logs
docker logs crm-backend-prod -f

# View frontend logs
docker logs crm-frontend-prod -f

# View nginx logs
docker logs crm-nginx-prod -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Check nginx config
docker exec crm-nginx-prod nginx -t
```

---

## 📚 **Additional Documentation**

- **Staging Setup**: `docs/STAGING_ENVIRONMENT_SETUP.md`
- **Monitoring Dashboard**: `docs/MONITORING_DASHBOARD_SETUP.md`
- **Database Backups**: `DATABASE_BACKUP_STRATEGY.md`
- **Security Headers**: `SECURITY_HEADERS.md`
- **Deployment Audit**: `DEPLOYMENT_READINESS_AUDIT.md`

---

## 🔒 **Security Reminders**

1. ⚠️ **NEVER commit `.env.production` to Git**
2. ⚠️ **Use strong passwords** (32+ characters)
3. ⚠️ **Enable Sentry** for production error tracking
4. ⚠️ **Set up database backups** immediately after deployment
5. ⚠️ **Enable 2FA** for admin accounts
6. ⚠️ **Review security headers** in nginx.conf
7. ⚠️ **Monitor logs** regularly for suspicious activity

---

## ✅ **Post-Deployment**

After successful deployment:

1. **Test all features** in production environment
2. **Set up monitoring dashboard** (Grafana/DataDog)
3. **Configure automated backups** (daily at 2 AM)
4. **Set up alerts** for critical errors
5. **Document any production-specific configurations**
6. **Train team** on production access and procedures

---

**Last Updated**: November 9, 2025  
**Version**: 1.0.0  
**Next Review**: After first production deployment
