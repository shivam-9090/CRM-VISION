# Railway Environment Variables Setup

Complete guide for all environment variables needed for your CRM backend on Railway.

## 🔑 Required Environment Variables

### Database & Cache

```bash
# PostgreSQL Database
DATABASE_URL=postgresql://user:password@host:port/database
# This is automatically provided by Railway when you add PostgreSQL
# Reference it as: ${{Postgres.DATABASE_URL}}

# Redis Cache (Optional but recommended)
REDIS_URL=redis://user:password@host:port
# Automatically provided by Railway when you add Redis
# Reference it as: ${{Redis.REDIS_URL}}
```

### Application Settings

```bash
# Node Environment
NODE_ENV=production

# Server Port
PORT=3001
# Railway automatically assigns a PORT, but you can set default

# Frontend URL (CORS)
FRONTEND_URL=https://vision-crm.netlify.app
# Update this to your actual frontend domain
```

### Authentication & Security

```bash
# JWT Secret (CRITICAL - Generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here
# Generate with: openssl rand -base64 32
# Example: QVk3N2RmZ2hqa2x6eGN2Ym5tLHFwb2l1eXQ=

# JWT Token Expiration
JWT_EXPIRATION=7d
# Options: 15m, 1h, 1d, 7d, 30d
```

### Email (SMTP) Configuration

```bash
# SMTP Server Host
SMTP_HOST=smtp.gmail.com
# For Gmail: smtp.gmail.com
# For Outlook: smtp-mail.outlook.com
# For SendGrid: smtp.sendgrid.net

# SMTP Port
SMTP_PORT=587
# TLS: 587 | SSL: 465

# SMTP Authentication
SMTP_USER=your-email@gmail.com
# Your email address

SMTP_PASS=your-app-password
# For Gmail: Use App Password (not regular password)
# Settings → Security → 2FA → App Passwords
```

### Optional - Error Tracking

```bash
# Sentry DSN (Optional - for error monitoring)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
# Sign up at: https://sentry.io (free tier available)
```

---

## 📝 How to Set Variables in Railway

### Method 1: Railway Dashboard (Recommended)

1. Go to your Railway project: <https://railway.app/dashboard>
2. Click on your **Backend Service**
3. Go to **Variables** tab
4. Click **"+ New Variable"**
5. Add each variable one by one:
   - **Variable Name**: `NODE_ENV`
   - **Value**: `production`
6. Click **"Add"**
7. Repeat for all variables

### Method 2: Reference Other Services

For `DATABASE_URL` and `REDIS_URL`:

1. Click **"+ New Variable"**
2. Select **"Add Reference"**
3. Choose:
   - Service: `Postgres` or `Redis`
   - Variable: `DATABASE_URL` or `REDIS_URL`
4. Railway will automatically keep them in sync

### Method 3: Bulk Add (Raw Editor)

1. Go to **Variables** tab
2. Click **"RAW Editor"** (top right)
3. Paste all variables:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=your-generated-secret
JWT_EXPIRATION=7d
FRONTEND_URL=https://vision-crm.netlify.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

4. Click **"Update Variables"**

---

## 🔒 Generate JWT Secret

Run this command on your local terminal:

```bash
# Windows PowerShell
$bytes = New-Object byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and use it as `JWT_SECRET`.

---

## 📧 Gmail SMTP Setup (Most Common)

### Step 1: Enable 2-Factor Authentication

1. Go to: <https://myaccount.google.com/security>
2. Enable **2-Step Verification**

### Step 2: Create App Password

1. Go to: <https://myaccount.google.com/apppasswords>
2. App name: `CRM Backend`
3. Click **"Generate"**
4. Copy the 16-character password
5. Use this as `SMTP_PASS`

### Environment Variables

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # (remove spaces)
```

---

## 🔍 Verify Your Configuration

After setting all variables, check:

1. **Backend Logs**: Railway Dashboard → Service → Deployments → View Logs
2. **Health Check**: Visit `https://your-backend-url.railway.app/api/health`
3. **Database Connection**: Check logs for `Database connected successfully`

---

## ⚠️ Common Errors

### Error: `JWT_SECRET is not defined`

**Solution:** Add `JWT_SECRET` variable in Railway dashboard.

### Error: `connect ECONNREFUSED` (Database)

**Solutions:**

- Wait 2-3 minutes for database to initialize
- Verify `DATABASE_URL` is correctly referenced
- Check database service is running

### Error: SMTP Authentication Failed

**Solutions:**

- For Gmail: Use App Password, not regular password
- Enable "Less secure app access" (not recommended) OR use App Password
- Check `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` are correct

### Error: CORS Policy Blocked

**Solution:** Update `FRONTEND_URL` to match your exact frontend domain (including https://).

---

## 📋 Complete Variable Checklist

Copy this template and fill in your values:

```bash
# ✅ Required - Auto-generated by Railway
DATABASE_URL=${{Postgres.DATABASE_URL}}

# ✅ Required - Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-url.com

# ✅ Required - Authentication
JWT_SECRET=your-generated-secret-here
JWT_EXPIRATION=7d

# ✅ Required - Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 🔷 Optional - Redis
REDIS_URL=${{Redis.REDIS_URL}}

# 🔷 Optional - Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# ============================================
# 🎯 GOOGLE CALENDAR INTEGRATION (REQUIRED)
# ============================================
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-railway-app.up.railway.app/api/calendar/google/callback
APP_URL=https://your-railway-app.up.railway.app
ENCRYPTION_KEY=your-64-character-hex-encryption-key-here

# 📌 IMPORTANT FOR GOOGLE CALENDAR:
# 1. Add this redirect URI to Google Cloud Console:
#    https://your-railway-app.up.railway.app/api/calendar/google/callback
# 2. Enable Google Calendar API in your Google Cloud project
# 3. Verify your Railway domain for webhook notifications
```

---

## 🚀 Quick Setup Commands

After setting variables, Railway will auto-deploy. To manually trigger:

1. Go to your service
2. Click **"Redeploy"**
3. Wait 2-5 minutes
4. Check logs for any errors

---

## 💡 Pro Tips

1. **Never commit `.env` files** - They're in `.gitignore` for security
2. **Use Railway References** - For DATABASE_URL and REDIS_URL instead of hardcoding
3. **Rotate JWT_SECRET** - Change periodically for security
4. **Monitor Logs** - Check Railway logs after each deployment
5. **Test Email** - Send a test password reset email to verify SMTP works

---

## 📚 Additional Resources

- Railway Environment Variables: <https://docs.railway.app/deploy/variables>
- Gmail App Passwords: <https://support.google.com/accounts/answer/185833>
- JWT Best Practices: <https://jwt.io/introduction>

**All set! Your environment is configured for production deployment.** ✅
