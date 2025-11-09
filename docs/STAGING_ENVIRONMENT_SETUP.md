# 🏗️ Staging Environment Setup Guide

Complete guide to setting up and deploying to the staging environment.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Staging Environment Architecture](#staging-environment-architecture)
- [Step-by-Step Setup](#step-by-step-setup)
- [Render Staging Services](#render-staging-services)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Testing the Staging Environment](#testing-the-staging-environment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The staging environment is a production-like environment for testing changes before deploying to production. It mirrors the production setup but uses separate resources.

**Purpose**:
- Test new features before production
- Validate deployment process
- Run integration tests
- Demo new features to stakeholders

**Key Differences from Production**:
- Separate database with test data
- Test email service (Mailtrap)
- Debug logging enabled
- Lower resource limits
- Separate domain (`staging.your-domain.com`)

---

## ✅ Prerequisites

Before setting up staging, ensure you have:

- [x] GitHub repository with CI/CD workflows
- [x] Render account (free tier works)
- [x] Domain name (for staging subdomain)
- [x] Mailtrap account (free - for test emails)
- [x] Sentry account (optional - for error tracking)

---

## 🏗️ Staging Environment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   STAGING ENVIRONMENT                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  staging.your-domain.com                                │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐                                   │
│  │  Render Web      │                                   │
│  │  Service         │                                   │
│  │  (Frontend)      │                                   │
│  └────────┬─────────┘                                   │
│           │                                              │
│           │  API Calls                                   │
│           ▼                                              │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  Render Web      │──────│  Render          │        │
│  │  Service         │      │  PostgreSQL      │        │
│  │  (Backend)       │      │  (Staging DB)    │        │
│  └────────┬─────────┘      └──────────────────┘        │
│           │                                              │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  Render Redis    │      │  Mailtrap        │        │
│  │  (Cache)         │      │  (Test Emails)   │        │
│  └──────────────────┘      └──────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Step-by-Step Setup

### Step 1: Create Staging Database on Render

1. **Log in to Render Dashboard**: https://dashboard.render.com

2. **Create PostgreSQL Database**:
   - Click **"New +"** → **"PostgreSQL"**
   - Name: `crm-staging-db`
   - Database: `crm_staging`
   - User: `crm_staging_user`
   - Region: Same as production (for consistency)
   - Plan: **Free** or **Starter** ($7/month)
   - Click **"Create Database"**

3. **Save Database Connection String**:
   - Copy **Internal Database URL** (starts with `postgresql://`)
   - Format: `postgresql://user:pass@host:5432/dbname`
   - Save for later configuration

### Step 2: Create Staging Redis Instance

1. **Create Redis Service**:
   - Click **"New +"** → **"Redis"**
   - Name: `crm-staging-redis`
   - Region: Same as database
   - Plan: **Free** ($0/month - 25MB)
   - Click **"Create Redis"**

2. **Save Redis Connection String**:
   - Copy **Internal Redis URL**
   - Format: `redis://host:6379`

### Step 3: Create Staging Backend Service

1. **Create Web Service**:
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Name: `crm-staging-backend`
   - Region: Same as database
   - Branch: `main` (auto-deploy from main)
   - Root Directory: `backend`
   - Runtime: **Docker**
   - Dockerfile Path: `backend/Dockerfile.prod`
   - Plan: **Free** or **Starter** ($7/month)

2. **Configure Environment Variables**:
   ```env
   NODE_ENV=staging
   PORT=3001
   DATABASE_URL=[paste staging database URL]
   REDIS_URL=[paste staging Redis URL]
   JWT_SECRET=[generate with: openssl rand -base64 48]
   JWT_EXPIRES_IN=1h
   FRONTEND_URL=https://crm-staging-frontend.onrender.com
   SENTRY_DSN=[optional - separate staging project]
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=[your Mailtrap username]
   SMTP_PASS=[your Mailtrap password]
   ```

3. **Add Health Check**:
   - Health Check Path: `/health`

4. **Click "Create Web Service"**

5. **Save Service ID**:
   - Copy service ID from URL: `srv-xxxxxxxxxxxxxxxxxxxxx`

### Step 4: Create Staging Frontend Service

1. **Create Web Service**:
   - Click **"New +"** → **"Web Service"**
   - Connect same GitHub repository
   - Name: `crm-staging-frontend`
   - Region: Same as backend
   - Branch: `main`
   - Root Directory: `frontend`
   - Runtime: **Docker**
   - Dockerfile Path: `frontend/Dockerfile`
   - Plan: **Free** or **Starter** ($7/month)

2. **Configure Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://crm-staging-backend.onrender.com/api
   NEXT_PUBLIC_APP_NAME=CRM Vision (Staging)
   NEXT_PUBLIC_APP_VERSION=1.0.0-staging
   ```

3. **Click "Create Web Service"**

4. **Save Service ID**:
   - Copy service ID from URL: `srv-xxxxxxxxxxxxxxxxxxxxx`

### Step 5: Run Database Migrations

1. **Open Render Shell** (Backend Service):
   - Go to staging backend service
   - Click **"Shell"** tab
   - Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Test Data** (optional):
   ```bash
   npx prisma db seed
   ```

### Step 6: Configure Custom Domain (Optional)

1. **Add Custom Domain to Frontend**:
   - Go to staging frontend service
   - Settings → Custom Domains
   - Add: `staging.your-domain.com`

2. **Update DNS**:
   - Add CNAME record:
     - Name: `staging`
     - Value: `crm-staging-frontend.onrender.com`
     - TTL: 3600

3. **Wait for SSL Certificate**:
   - Render will automatically provision Let's Encrypt SSL
   - Takes 5-10 minutes

---

## 🔐 GitHub Secrets Configuration

Add staging service IDs to GitHub repository secrets for CI/CD:

1. **Go to Repository Settings**:
   - Navigate to: `https://github.com/YOUR_USERNAME/CRM-VISION/settings/secrets/actions`

2. **Add Required Secrets**:

   | Secret Name | Value | Description |
   |-------------|-------|-------------|
   | `RENDER_API_KEY` | [Your Render API key] | From Render Account Settings |
   | `RENDER_SERVICE_ID_BACKEND_STAGING` | `srv-xxxxx` | Backend service ID |
   | `RENDER_SERVICE_ID_FRONTEND_STAGING` | `srv-xxxxx` | Frontend service ID |
   | `DATABASE_URL_STAGING` | `postgresql://...` | Staging database URL |
   | `SENTRY_AUTH_TOKEN` | [Optional] | For Sentry release tracking |

3. **Get Render API Key**:
   - Go to: https://dashboard.render.com/account/keys
   - Click **"Create API Key"**
   - Copy and save

---

## 🧪 Testing the Staging Environment

### 1. Verify Services are Running

```bash
# Check backend health
curl https://crm-staging-backend.onrender.com/health

# Expected response:
{
  "status": "ok",
  "database": { "status": "connected" },
  "cache": { "status": "connected" },
  "environment": "staging"
}
```

### 2. Test Frontend

```bash
# Open staging frontend
open https://staging.your-domain.com

# Or with default Render URL:
open https://crm-staging-frontend.onrender.com
```

### 3. Test Authentication

1. Register a new user
2. Login
3. Create test company
4. Add test contacts/deals

### 4. Test Deployment Workflow

```bash
# Trigger staging deployment via GitHub Actions
gh workflow run deploy.yml -f environment=staging

# Or push to main branch (auto-deploys to staging)
git push origin main
```

### 5. Monitor Logs

```bash
# View backend logs in Render Dashboard:
https://dashboard.render.com/web/[backend-service-id]/logs

# View frontend logs:
https://dashboard.render.com/web/[frontend-service-id]/logs
```

---

## 🔧 Troubleshooting

### Issue: "Database connection failed"

**Solution**:
1. Verify `DATABASE_URL` environment variable is correct
2. Check database is running: Render Dashboard → Databases
3. Run migrations: `npx prisma migrate deploy`
4. Check connection pool settings

### Issue: "Redis connection timeout"

**Solution**:
1. Verify `REDIS_URL` is correct (internal URL, not external)
2. Ensure Redis service is running
3. Check region - Redis and backend must be in same region

### Issue: "CORS errors in browser"

**Solution**:
1. Update `FRONTEND_URL` in backend environment variables
2. Include full URL with protocol (`https://staging.your-domain.com`)
3. Restart backend service after changing environment variables

### Issue: "Deployment fails in GitHub Actions"

**Solution**:
1. Verify all GitHub Secrets are set correctly
2. Check service IDs are correct (start with `srv-`)
3. Review workflow logs: GitHub → Actions → Failed workflow
4. Ensure Render API key has correct permissions

### Issue: "SSL certificate not provisioning"

**Solution**:
1. Verify DNS CNAME record is correct
2. Wait 10-15 minutes for propagation
3. Check DNS with: `dig staging.your-domain.com`
4. Remove and re-add custom domain if needed

---

## 📊 Staging Environment Best Practices

### 1. Data Management
- ✅ Use test data, not production data
- ✅ Regularly reset/refresh staging database
- ✅ Keep staging data minimal (faster deployments)

### 2. Configuration
- ✅ Use separate credentials for all services
- ✅ Enable debug logging
- ✅ Use test email service (Mailtrap)
- ✅ Monitor separately from production (separate Sentry project)

### 3. Testing
- ✅ Test all new features in staging before production
- ✅ Run smoke tests after each deployment
- ✅ Verify database migrations
- ✅ Test rollback procedures

### 4. Access Control
- ✅ Share staging URL with team for testing
- ✅ Use password protection if needed (Render settings)
- ✅ Monitor staging for security issues

---

## 🎉 Staging Environment Checklist

- [ ] PostgreSQL database created and running
- [ ] Redis instance created and running
- [ ] Backend service deployed successfully
- [ ] Frontend service deployed successfully
- [ ] Database migrations applied
- [ ] Test data seeded
- [ ] Health check endpoint returning 200
- [ ] GitHub Secrets configured
- [ ] CI/CD workflow tested (staging deployment)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate provisioned
- [ ] Team members can access staging URL
- [ ] Monitoring configured (Sentry/logs)

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [Render Redis Guide](https://render.com/docs/redis)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Mailtrap Setup](https://mailtrap.io/inboxes)

---

**Status**: Ready for staging setup ✅  
**Estimated Time**: 1-2 hours  
**Cost**: $0 (free tier) or $14-21/month (starter tier)

---

**Next Steps**:
1. Follow this guide to create staging services on Render
2. Configure GitHub Secrets
3. Test deployment workflow
4. Deploy first feature to staging
5. Promote to production after validation
