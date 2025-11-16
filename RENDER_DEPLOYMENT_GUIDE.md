# 🚀 Complete Render.com Deployment Guide

**Step-by-step guide to deploy CRM-VISION backend to Render.com**

---

## 📋 **Prerequisites**

Before starting, ensure you have:
- ✅ GitHub account with your code pushed
- ✅ Render.com account (sign up at https://render.com - free tier available)
- ✅ Strong passwords generated in `.env.production`
- ✅ All code committed to GitHub

---

## 🎯 **Deployment Strategy**

We'll deploy in this order:
1. **PostgreSQL Database** (stores all data)
2. **Redis Cache** (external service - Upstash/Redis Labs) - OPTIONAL
3. **Backend API** (NestJS application)
4. **Frontend** (Next.js - Render/Vercel/Netlify)
5. **Link Frontend URL to Backend** (CRITICAL for CORS!)

**Note**: Redis is optional. Your CRM will work without it, but caching improves performance.

**IMPORTANT**: After deploying your frontend, you MUST update the backend's `FRONTEND_URL` environment variable to enable CORS!

---

## 📦 **STEP 1: Create PostgreSQL Database**

### 1.1 Go to Render Dashboard
- Visit: https://dashboard.render.com
- Click **"New +"** button (top right)
- Select **"PostgreSQL"**

### 1.2 Configure Database
```yaml
Name: crm-postgres
Database: crm_production
User: crm_admin
Region: Oregon (US West) or closest to you
PostgreSQL Version: 15
Instance Type: Starter ($7/month) or Free
```

### 1.3 Click "Create Database"
- Wait 2-3 minutes for provisioning
- **IMPORTANT**: Copy the connection details shown:
  - Internal Database URL (for backend)
  - External Database URL (for local migrations)

### 1.4 Save Connection String
You'll see something like:
```
Internal: postgresql://crm_admin:xxxxx@dpg-xxxxx/crm_production
External: postgresql://crm_admin:xxxxx@oregon-postgres.render.com:5432/crm_production
```

**⚠️ Save both URLs securely!**

---

## 🔴 **STEP 2: Setup Redis Cache (OPTIONAL - Skip if not needed)**

**Important**: Render no longer offers Redis service. You have 3 options:

### **Option A: Skip Redis (Recommended for Free Tier)**
Your CRM will work fine without Redis. Just skip to Step 3.
- Sessions will use JWT tokens (no Redis needed)
- Rate limiting works with in-memory storage
- No caching, but app still functions normally

### **Option B: Use Upstash Redis (Free Tier Available)**

1. **Go to Upstash**: https://upstash.com
2. **Sign up** for free account
3. **Create Database**:
   - Click "Create Database"
   - Name: `crm-redis`
   - Region: Choose closest to your Render region
   - Type: Regional (free tier)
4. **Get Redis URL**:
   - Click on your database
   - Copy **REST URL** or **Redis URL**
   ```
   redis://default:xxxxx@us1-xxxxx.upstash.io:6379
   ```

**Upstash Free Tier:**
- 10,000 commands per day
- Max 256 MB data
- Perfect for small to medium CRMs

### **Option C: Use Redis Labs (Paid)**

1. Go to https://redis.com/try-free/
2. Create free account (30MB free)
3. Create database and get connection URL

---

## 🚀 **STEP 3: Deploy Backend API**

### 3.1 From Dashboard
- Click **"New +"** button
- Select **"Web Service"**

### 3.2 Connect GitHub Repository
- Click **"Connect account"** (if first time)
- Select **"CRM-VISION"** repository
- Click **"Connect"**

### 3.3 Configure Web Service

**Basic Settings:**
```yaml
Name: crm-backend
Region: Oregon (US West) - same as database
Branch: main
Root Directory: backend
Runtime: Node
```

**Build & Start Commands:**
```bash
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm run start:prod
```

**Instance Type:**
```yaml
Plan: Starter ($7/month)
  - 512 MB RAM
  - 0.5 CPU
  - Good for production with moderate traffic

OR

Plan: Free
  - Spins down after 15 min inactivity
  - Good for testing
```

**Advanced Settings:**
```yaml
Health Check Path: /health
Auto-Deploy: Yes (deploys on git push)
```

### 3.4 Add Environment Variables

Click **"Advanced"** → **"Environment Variables"** → **"Add Environment Variable"**

Add these one by one:

#### **Database Configuration**
```bash
# Key: DATABASE_URL
# Value: [Paste Internal Database URL from Step 1.4]
DATABASE_URL=postgresql://crm_admin:xxxxx@dpg-xxxxx/crm_production
```

#### **Redis Configuration** (OPTIONAL - Only if using Upstash/Redis Labs)
```bash
# Key: REDIS_URL
# Value: [Paste Redis URL from Upstash or leave blank]
REDIS_URL=redis://default:xxxxx@us1-xxxxx.upstash.io:6379

# OR skip Redis completely by NOT adding this variable
# App will work without Redis
```

#### **JWT Secret** (from your .env.production)
```bash
# Key: JWT_SECRET
# Value: [Copy from your .env.production file]
JWT_SECRET=A7b9C1d3E5f7G9h1I3j5K7l9M1n3O5p7Q9r1S3t5U7v9W1x3Y5z7A9b1C3d5E7f9G1h3I5j7K9l1M3n5O7p9Q1r3S5t7U9v1W3x5Y7z9A1b3C5d7E9f1G3h5I7j9K1l3M5n7
```

#### **Node Environment**
```bash
# Key: NODE_ENV
# Value: production
NODE_ENV=production
```

#### **Port**
```bash
# Key: PORT
# Value: 3001
PORT=3001
```

#### **Frontend URL** (IMPORTANT - Update after frontend deployed)
```bash
# Key: FRONTEND_URL
# Value: Your frontend URL for CORS configuration
# Localhost for testing: http://localhost:3000
# Render frontend: https://your-frontend-app.onrender.com
# Vercel: https://your-app.vercel.app
# Netlify: https://your-app.netlify.app
FRONTEND_URL=http://localhost:3000

# ⚠️ IMPORTANT: You MUST update this after deploying your frontend!
# This allows your backend to accept requests from your frontend domain.
```

#### **Email Configuration** (Gmail SMTP from your .env.production)
```bash
# Key: SMTP_HOST
# Value: smtp.gmail.com
SMTP_HOST=smtp.gmail.com

# Key: SMTP_PORT
# Value: 587
SMTP_PORT=587

# Key: SMTP_SECURE
# Value: false
SMTP_SECURE=false

# Key: SMTP_USER
# Value: visionakl08@gmail.com
SMTP_USER=visionakl08@gmail.com

# Key: SMTP_PASS
# Value: jrwo hoxm dfjn vuit
SMTP_PASS=jrwo hoxm dfjn vuit

# Key: EMAIL_FROM
# Value: visionakl08@gmail.com
EMAIL_FROM=visionakl08@gmail.com
```

#### **Sentry Error Tracking** (from your .env.production)
```bash
# Key: SENTRY_DSN
# Value: [Copy from your .env.production]
SENTRY_DSN=https://13bb41b2c8d3b2e66fa97e58b2e2c6a7@o4510284183699456.ingest.us.sentry.io/4510288628285440
```

#### **Rate Limiting**
```bash
# Key: RATE_LIMIT_ENABLED
# Value: true
RATE_LIMIT_ENABLED=true

# Key: RATE_LIMIT_WINDOW_MS
# Value: 60000
RATE_LIMIT_WINDOW_MS=60000

# Key: RATE_LIMIT_MAX_REQUESTS
# Value: 100
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.5 Click "Create Web Service"
- Render will start building your backend
- **Build time**: 5-10 minutes (first time)
- Watch the logs for progress

### 3.6 Wait for "Live" Status
You'll see:
```
==> Uploading build...
==> Build successful
==> Starting service...
==> Your service is live 🎉
```

### 3.7 Get Your Backend URL
After deployment, you'll see:
```
https://crm-backend-xxxx.onrender.com
```

**⚠️ SAVE THIS URL!** You'll need it for:
- Frontend configuration
- Testing API endpoints

---

## 🔧 **STEP 4: Run Database Migrations**

### 4.1 Open Shell in Render
- Go to your **crm-backend** service
- Click **"Shell"** tab (left sidebar)
- Click **"Launch Shell"**

### 4.2 Run Migrations
In the shell, execute:
```bash
# Run migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

**Expected output:**
```
✅ Database is up to date!
```

### 4.3 Seed Initial Data (Optional)
```bash
# Add admin user and test data
npm run db:seed
```

**⚠️ Note**: If seed fails because seed.ts is not in production build, you can:
1. Add data manually through API
2. Connect to database directly and run SQL

---

## ✅ **STEP 5: Test Backend Deployment**

### 5.1 Test Health Endpoint
```bash
# Replace with your actual backend URL
curl https://crm-backend-xxxx.onrender.com/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T...",
  "database": "connected",
  "redis": "connected"
}
```

### 5.2 Test API Documentation
Open in browser:
```
https://crm-backend-xxxx.onrender.com/api
```

You should see Swagger API documentation.

### 5.3 Test Login Endpoint
```bash
curl -X POST https://crm-backend-xxxx.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"password123"}'
```

**Expected response:**
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@crm.com",
    ...
  }
}
```

---

## 🎨 **STEP 6: Deploy Frontend to Render (or Vercel/Netlify)**

### **Option A: Deploy Frontend to Render**

#### 6.1 From Render Dashboard
- Click **"New +"** button
- Select **"Static Site"**

#### 6.2 Connect GitHub Repository
- Select **"CRM-VISION"** repository
- Click **"Connect"**

#### 6.3 Configure Static Site

**Basic Settings:**
```yaml
Name: crm-frontend
Region: Oregon (US West) - same region as backend
Branch: main
Root Directory: frontend
```

**Build Settings:**
```bash
Build Command: npm install && npm run build
Publish Directory: out or .next (depending on Next.js config)
```

**Environment Variables:**
Click **"Advanced"** → Add:
```bash
# Key: NEXT_PUBLIC_API_URL
# Value: https://crm-backend-xxxx.onrender.com/api
NEXT_PUBLIC_API_URL=https://crm-backend-xxxx.onrender.com/api

# Key: NODE_ENV
# Value: production
NODE_ENV=production
```

#### 6.4 Deploy Frontend
- Click **"Create Static Site"**
- Wait 5-10 minutes for build
- You'll get a URL like: `https://crm-frontend-xxxx.onrender.com`

---

### **Option B: Deploy Frontend to Vercel (Recommended for Next.js)**

#### 6.1 Go to Vercel
- Visit: https://vercel.com
- Sign in with GitHub

#### 6.2 Import Project
- Click **"New Project"**
- Select **"CRM-VISION"** repository
- Click **"Import"**

#### 6.3 Configure Project
```yaml
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Output Directory: (leave default)
Install Command: npm install
```

#### 6.4 Add Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://crm-backend-xxxx.onrender.com/api
NODE_ENV=production
```

#### 6.5 Deploy
- Click **"Deploy"**
- Wait 2-3 minutes
- You'll get URL: `https://your-app.vercel.app`

---

### **Option C: Deploy Frontend to Netlify**

#### 6.1 Go to Netlify
- Visit: https://netlify.com
- Sign in with GitHub

#### 6.2 New Site from Git
- Click **"Add new site"** → **"Import an existing project"**
- Select **"GitHub"**
- Choose **"CRM-VISION"** repository

#### 6.3 Build Settings
```yaml
Base directory: frontend
Build command: npm run build
Publish directory: out (or .next)
```

#### 6.4 Environment Variables
- Click **"Site settings"** → **"Environment variables"**
- Add:
```bash
NEXT_PUBLIC_API_URL=https://crm-backend-xxxx.onrender.com/api
NODE_ENV=production
```

#### 6.5 Deploy
- Click **"Deploy site"**
- You'll get URL: `https://your-app.netlify.app`

---

## 🔗 **STEP 7: Link Frontend URL to Backend (CRITICAL!)**

**⚠️ THIS IS REQUIRED FOR CORS TO WORK!**

After deploying your frontend, you MUST update the backend's FRONTEND_URL:

### 7.1 Get Your Frontend URL
Copy one of:
- **Render**: `https://crm-frontend-xxxx.onrender.com`
- **Vercel**: `https://your-app.vercel.app`
- **Netlify**: `https://your-app.netlify.app`

### 7.2 Update Backend Environment Variable
1. Go to **Render Dashboard**
2. Select **crm-backend** service
3. Click **"Environment"** tab
4. Find **FRONTEND_URL** variable
5. Click **"Edit"**
6. Paste your frontend URL (no trailing slash!)
7. Click **"Save Changes"**

**Example:**
```bash
# Before (temporary)
FRONTEND_URL=http://localhost:3000

# After (production)
FRONTEND_URL=https://crm-frontend-xxxx.onrender.com
```

### 7.3 Redeploy Backend (if needed)
- Render usually auto-redeploys on environment changes
- If not, click **"Manual Deploy"** → **"Deploy latest commit"**
- Wait 2-3 minutes for redeploy

### 7.4 Test CORS
Open browser console and try:
```javascript
fetch('https://crm-backend-xxxx.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

**Expected**: No CORS errors, response received.

---

## 📊 **STEP 8: Monitor Deployment**

### 8.1 View Logs
- Click **"Logs"** tab in Render dashboard
- Real-time logs of your application
- Look for errors or warnings

### 8.2 Check Metrics
- Click **"Metrics"** tab
- View CPU, Memory, Response time
- Set up alerts if needed

### 8.3 View Events
- Click **"Events"** tab
- See deployment history
- Track build/deploy times

---

## 🔐 **STEP 9: Security Checklist**

After deployment, verify:

- [ ] Database is private (not publicly accessible)
- [ ] Redis is internal-only
- [ ] Environment variables are set (not hardcoded)
- [ ] Health check endpoint is working
- [ ] CORS is configured (only allow your frontend domain)
- [ ] Rate limiting is enabled
- [ ] Sentry error tracking is working
- [ ] HTTPS is enforced (Render does this automatically)
- [ ] JWT secret is strong (128+ characters)
- [ ] Database password is strong

---

## 🚨 **Common Issues & Solutions**

### Issue 1: Build Fails - "Prisma Client not generated"
**Solution:**
```bash
# Update Build Command to:
npm install && npx prisma generate && npm run build
```

### Issue 2: Service Won't Start - Port Mismatch
**Solution:**
- Render uses `PORT` environment variable automatically
- Make sure your code reads from `process.env.PORT`
- Set PORT=3001 in environment variables

### Issue 3: Database Connection Fails
**Solution:**
- Verify DATABASE_URL is the **Internal** URL (not External)
- Check database is in same region as backend
- Ensure database is "Available" status

### Issue 4: Redis Connection Fails
**Solution:**
- Redis is OPTIONAL - app works without it
- If using Upstash: Verify URL format includes username and password
- If not needed: Remove REDIS_URL environment variable completely

### Issue 5: Health Check Failing
**Solution:**
- Verify Health Check Path is `/health` (not `/api/health`)
- Check logs to see actual error
- Ensure service is binding to correct port

### Issue 6: Migrations Not Applied
**Solution:**
```bash
# Connect to Shell and run:
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

## 💰 **Cost Breakdown**

### Free Tier (Good for testing)
```
PostgreSQL: Free (expires after 90 days)
Upstash Redis: Free (10k commands/day) - OPTIONAL
Web Service: Free (spins down after 15 min)
Total: $0/month
```

### Starter Tier (Production ready)
```
PostgreSQL Starter: $7/month
Upstash Redis: Free or $10/month (pro plan) - OPTIONAL
Web Service Starter: $7/month
Total: $14-17/month (with optional Redis)
```

### Professional Tier (High traffic)
```
PostgreSQL Pro: $20/month
Redis Labs Pro: $15-25/month - OPTIONAL
Web Service Pro: $25/month
Total: $45-70/month
```

**Note**: Redis is optional. Save money by skipping it if you don't need caching.

---

## 🔄 **Auto-Deployment Setup**

Render automatically deploys when you push to GitHub!

### How it works:
1. You push code to GitHub: `git push origin main`
2. Render detects the change
3. Runs build command automatically
4. Deploys new version (zero downtime)
5. Health check ensures service is ready

### Disable auto-deploy (if needed):
- Go to service settings
- Turn off "Auto-Deploy"
- Deploy manually using "Manual Deploy" button

---

## 📱 **STEP 10: Custom Domain Setup (Optional)**

### 10.1 Add Custom Domain
- Go to service settings
- Click **"Custom Domains"**
- Add your domain: `api.yourcompany.com`

### 10.2 Configure DNS
Add CNAME record:
```
Type: CNAME
Name: api
Value: crm-backend-xxxx.onrender.com
TTL: 3600
```

### 10.3 SSL Certificate
- Render automatically provisions SSL certificate
- Wait 1-2 hours for DNS propagation
- HTTPS will be enabled automatically

---

## ✅ **Final Deployment Checklist**

### Backend Setup
- [ ] PostgreSQL database created and running
- [ ] Redis cache set up (Upstash) - OPTIONAL, can skip
- [ ] Backend service deployed successfully
- [ ] All environment variables configured (DATABASE_URL, JWT_SECRET, etc.)
- [ ] Database migrations applied
- [ ] Health check passing (Status: Live)
- [ ] API documentation accessible
- [ ] Test login working
- [ ] Sentry error tracking active
- [ ] Logs showing no errors

### Frontend Setup
- [ ] Frontend deployed to Render/Vercel/Netlify
- [ ] Frontend URL obtained (e.g., https://crm-frontend-xxxx.onrender.com)
- [ ] Frontend environment variables configured (NEXT_PUBLIC_API_URL)
- [ ] Frontend can access backend API

### CORS Configuration (CRITICAL!)
- [ ] **Backend FRONTEND_URL updated with actual frontend URL**
- [ ] Backend redeployed after FRONTEND_URL update
- [ ] CORS working (no errors in browser console)
- [ ] Frontend can successfully login and fetch data

### Security & Monitoring
- [ ] CORS configured for frontend domain only
- [ ] Monitoring/alerts set up
- [ ] Database is private (not publicly accessible)
- [ ] HTTPS enabled (automatic on Render)
- [ ] Rate limiting enabled
- [ ] Strong passwords and JWT secrets

---

## 🎉 **Success!**

Your backend is now live at:
```
https://crm-backend-xxxx.onrender.com
```

**Next Steps:**
1. Deploy frontend to Vercel/Netlify/Render
2. Update CORS settings with frontend domain
3. Update FRONTEND_URL environment variable
4. Set up custom domain (optional)
5. Configure database backups
6. Set up monitoring alerts
7. Test all features end-to-end

---

## 📞 **Need Help?**

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Support**: https://render.com/support
- **Community**: https://community.render.com

---

**Created**: November 10, 2025  
**Last Updated**: November 10, 2025  
**Version**: 1.0.0
