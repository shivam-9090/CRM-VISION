# 🚂 Railway Deployment Guide for CRM Backend

Complete step-by-step guide to deploy your NestJS backend on Railway.

---

## 📋 Prerequisites

- GitHub account with your CRM repository
- Railway account (sign up at https://railway.app)
- Gmail account (for SMTP email service)

---

## 🚀 Step 1: Create Railway Account & Project

1. Go to https://railway.app
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your repositories
4. Click **"New Project"**
5. Select **"Deploy from GitHub repo"**
6. Choose your **CRM-VISION** repository
7. Railway will detect your configuration automatically

---

## 🗄️ Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically:
   - Create a database instance
   - Generate `DATABASE_URL` variable
   - Link it to your backend service

**Important:** Your backend service will automatically receive the `DATABASE_URL` variable.

---

## 🔧 Step 3: Configure Environment Variables

### Go to Backend Service → Variables Tab

Click **"+ New Variable"** and add each of these:

### Required Variables

```bash
# Node Environment
NODE_ENV=production

# Server Port (Railway auto-assigns, but set default)
PORT=3001

# Frontend URL for CORS
FRONTEND_URL=https://your-frontend-url.com
# Update this after you deploy your frontend

# JWT Configuration
JWT_SECRET=<generate-using-command-below>
JWT_EXPIRATION=7d

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<your-gmail-app-password>
```

### Database (Auto-configured)
Railway automatically adds:
- `DATABASE_URL` - Reference from PostgreSQL service

---

## 🔑 Step 4: Generate JWT Secret

Run this command in your terminal:

**Windows PowerShell:**
```powershell
$bytes = New-Object byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

**Or using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and use it as `JWT_SECRET` in Railway.

---

## 📧 Step 5: Setup Gmail SMTP (App Password)

### Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Enable **"2-Step Verification"**
3. Follow the setup wizard

### Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select app: **"Mail"**
3. Select device: **"Other (Custom name)"**
4. Enter: **"CRM Backend"**
5. Click **"Generate"**
6. Copy the 16-character password (remove spaces)
7. Use this as `SMTP_PASS` in Railway

**Your Gmail variables:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=abcdefghijklmnop  # (16-char app password)
```

---

## 🎯 Step 6: Deploy Backend

Railway will automatically deploy when you push to GitHub. To manually deploy:

1. Go to your **Backend Service** in Railway
2. Click **"Deployments"** tab
3. Click **"Deploy"** or push to your GitHub repo
4. Wait 3-5 minutes for build to complete

### Monitor Deployment
- Watch the **Build Logs** in real-time
- Check for any errors during:
  - `npm install`
  - `prisma generate`
  - `npm run build`
  - `prisma migrate deploy`

---

## ✅ Step 7: Verify Deployment

### Get Your Backend URL
1. Go to **Backend Service** → **Settings**
2. Scroll to **"Domains"**
3. You'll see a URL like: `your-app-name.up.railway.app`
4. Click **"Generate Domain"** if not present

### Test Your Backend
Visit these URLs in your browser:

1. **Health Check:**
   ```
   https://your-app-name.up.railway.app/api/health
   ```
   Should return: `{"status": "ok", "database": "connected"}`

2. **API Documentation:**
   ```
   https://your-app-name.up.railway.app/api
   ```
   Should show Swagger API documentation

---

## 🔄 Step 8: Connect Frontend

Update your frontend `.env` to use Railway backend:

```bash
NEXT_PUBLIC_API_URL=https://your-app-name.up.railway.app
```

Update Railway `FRONTEND_URL` variable:
1. Go to Backend Service → Variables
2. Update `FRONTEND_URL` to your frontend URL
3. Redeploy backend

---

## 🐛 Common Issues & Solutions

### ❌ Database Connection Error
**Error:** `connect ECONNREFUSED`

**Solutions:**
- Wait 2-3 minutes for database to initialize
- Check DATABASE_URL is properly linked
- Verify PostgreSQL service is running

### ❌ Build Fails
**Error:** `prisma generate failed`

**Solutions:**
- Check `railway.toml` has `npx prisma generate` in buildCommand
- Verify `prisma` is in dependencies, not devDependencies
- Check build logs for specific error

### ❌ SMTP Error
**Error:** `Invalid login: 535-5.7.8 Username and Password not accepted`

**Solutions:**
- Use Gmail App Password, not regular password
- Remove spaces from 16-char app password
- Verify 2FA is enabled on Gmail account

### ❌ CORS Error
**Error:** `Access to fetch blocked by CORS policy`

**Solutions:**
- Update `FRONTEND_URL` in Railway variables
- Ensure it matches your frontend domain exactly (with https://)
- Redeploy backend after changing

### ❌ Migration Fails
**Error:** `prisma migrate deploy failed`

**Solutions:**
- Check if database is empty/fresh
- May need to reset database in Railway
- Verify migrations folder is committed to GitHub

---

## 📊 Monitoring & Logs

### View Logs
1. Go to **Backend Service**
2. Click **"Deployments"**
3. Click on latest deployment
4. View **"Deploy Logs"** and **"Application Logs"**

### Key Log Indicators
✅ **Successful Deployment:**
```
✓ Prisma migrate deploy completed
✓ Application is running on port 3001
✓ Database connected successfully
```

❌ **Failed Deployment:**
```
✗ Error: Environment variable not found
✗ Prisma migration failed
✗ Build failed
```

---

## 💰 Railway Free Tier

**What you get:**
- $5 credit per month (500 hours of usage)
- Perfect for development/demo
- No credit card required initially

**Usage Tips:**
- Backend: ~$3-4/month
- PostgreSQL: ~$1-2/month
- Total: ~$5/month (within free tier)

**Monitor Usage:**
1. Go to Railway Dashboard
2. Click **"Usage"** tab
3. Track your monthly spend

---

## 🔄 Continuous Deployment

Railway automatically deploys when you push to GitHub:

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin main
   ```
3. Railway detects the push
4. Automatically builds and deploys
5. Wait 3-5 minutes for deployment

---

## 🎛️ Railway Dashboard Overview

### Key Sections:
- **Deployments:** View build history and logs
- **Variables:** Manage environment variables
- **Metrics:** Monitor CPU, memory, network usage
- **Settings:** Configure domains, build settings
- **Logs:** Real-time application logs

---

## 🔐 Security Best Practices

1. **Never commit `.env` files**
   - Already in `.gitignore`
   - Use Railway Variables only

2. **Rotate JWT_SECRET periodically**
   - Generate new secret every 3-6 months
   - Update in Railway Variables

3. **Use strong App Passwords**
   - Gmail App Password is more secure
   - Never use regular Gmail password

4. **Monitor logs regularly**
   - Check for suspicious activity
   - Set up error notifications

---

## 📚 Useful Railway Commands

### Railway CLI (Optional)
Install Railway CLI for terminal access:

```bash
npm install -g @railway/cli
railway login
railway link
railway status
railway logs
railway variables
```

---

## 🆘 Need Help?

1. **Railway Documentation:** https://docs.railway.app
2. **Railway Discord:** https://discord.gg/railway
3. **Check GitHub Issues:** Look for similar deployment problems
4. **Railway Status:** https://status.railway.app

---

## ✅ Deployment Checklist

Before going live, verify:

- [ ] All environment variables are set
- [ ] Database is connected and migrated
- [ ] Health check endpoint returns 200
- [ ] SMTP emails are working (test password reset)
- [ ] CORS is configured with correct frontend URL
- [ ] Swagger docs are accessible
- [ ] No critical errors in logs
- [ ] Frontend can connect to backend
- [ ] Authentication works (login/register)
- [ ] File uploads work (if applicable)

---

## 🎉 Success!

Your backend is now live on Railway! 

**Backend URL:** `https://your-app-name.up.railway.app`

You can now share this URL with your clients for testing.

---

## 📈 Next Steps

1. **Deploy Frontend:** Use Vercel or Netlify
2. **Custom Domain:** Add your own domain in Railway Settings
3. **Monitoring:** Set up Sentry for error tracking
4. **Backups:** Configure database backups
5. **Scale:** Upgrade plan when ready for production

**Happy Deploying! 🚀**
