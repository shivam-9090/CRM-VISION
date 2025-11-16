# 🔗 Frontend & Backend Linking Guide

**Quick guide to connect your frontend and backend on Render (or any platform)**

---

## 📋 Quick Summary

To make your CRM work, you need **TWO URLs**:

1. **Backend URL** → Where your API lives (NestJS)
2. **Frontend URL** → Where your website lives (Next.js)

And you need to **tell each service about the other**!

---

## 🎯 Step-by-Step Process

### 1️⃣ Deploy Backend First
Deploy your backend to Render and get the URL:
```
Example: https://crm-backend-abc123.onrender.com
```

### 2️⃣ Deploy Frontend
Deploy your frontend to Render/Vercel/Netlify with backend URL:

**Environment Variable to Add:**
```bash
NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api
```

After deployment, you'll get a frontend URL:
```
Render:   https://crm-frontend-xyz789.onrender.com
Vercel:   https://your-app.vercel.app
Netlify:  https://your-app.netlify.app
```

### 3️⃣ Update Backend with Frontend URL (CRITICAL!)

Go back to your **backend service** on Render:
1. Open **Environment** tab
2. Find or add `FRONTEND_URL` variable
3. Set it to your frontend URL:
   ```bash
   FRONTEND_URL=https://crm-frontend-xyz789.onrender.com
   ```
4. Save and redeploy

---

## 🔄 Complete Environment Variable Setup

### Backend Environment Variables (Render)

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT Authentication
JWT_SECRET=your-super-long-secret-key-here

# Server Config
NODE_ENV=production
PORT=3001

# ⭐ FRONTEND URL - REQUIRED FOR CORS!
FRONTEND_URL=https://crm-frontend-xyz789.onrender.com

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Monitoring
SENTRY_DSN=your-sentry-dsn-here

# Redis (Optional)
REDIS_URL=redis://default:pass@host:6379

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables (Render/Vercel/Netlify)

```bash
# ⭐ BACKEND API URL - REQUIRED!
NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api

# Environment
NODE_ENV=production
```

---

## 🧪 Testing the Connection

### 1. Test Backend API
Open browser console and run:
```javascript
fetch('https://crm-backend-abc123.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T...",
  "database": "connected"
}
```

### 2. Test Frontend
Visit your frontend URL:
```
https://crm-frontend-xyz789.onrender.com
```

- Should redirect to login page
- Try logging in with seed credentials:
  - Email: `admin@crm.com`
  - Password: `password123`

### 3. Check CORS (MOST COMMON ISSUE!)

Open browser console (F12) and look for errors:

**❌ If you see this:**
```
Access to fetch at 'https://crm-backend-abc123.onrender.com/api/...' 
from origin 'https://crm-frontend-xyz789.onrender.com' has been blocked by CORS policy
```

**✅ Fix:** Update `FRONTEND_URL` in backend environment variables!

**✅ If no CORS errors:**
Your connection is working! 🎉

---

## 🚨 Common Issues & Fixes

### Issue 1: CORS Error
**Problem:** Frontend can't access backend

**Symptoms:**
- CORS errors in browser console
- Network requests fail with status 0
- Login doesn't work

**Solution:**
1. Verify `FRONTEND_URL` in backend is correct (no trailing slash!)
2. Redeploy backend after changing environment variables
3. Clear browser cache and try again

**Correct Format:**
```bash
✅ FRONTEND_URL=https://crm-frontend-xyz789.onrender.com
❌ FRONTEND_URL=https://crm-frontend-xyz789.onrender.com/
```

---

### Issue 2: Frontend Can't Find Backend
**Problem:** API requests return 404 or timeout

**Symptoms:**
- Network errors in console
- "Failed to fetch" errors
- Blank dashboard

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL` includes `/api` suffix
2. Make sure backend is actually running (check Render dashboard)
3. Test backend health endpoint directly

**Correct Format:**
```bash
✅ NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api
❌ NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com
```

---

### Issue 3: Environment Variables Not Working
**Problem:** Changes to environment variables don't take effect

**Solution:**
1. **Always redeploy** after changing environment variables
2. Render usually auto-deploys, but check deployment logs
3. For frontend on Vercel/Netlify, trigger manual redeploy
4. Clear browser cache and hard refresh (Ctrl+F5)

---

### Issue 4: Works Locally But Not in Production
**Problem:** Everything works on localhost but fails after deployment

**Common Causes:**
1. Missing `NEXT_PUBLIC_` prefix on frontend env vars
2. Using `http://` instead of `https://` in production
3. Backend `FRONTEND_URL` still set to `localhost`
4. Database not accessible from deployed backend

**Solution:**
1. Check ALL environment variables on both services
2. Ensure production URLs use HTTPS
3. Test each service independently before testing together

---

## 📊 Visual Connection Flow

```
┌─────────────────────────────────────────────────────┐
│  USER'S BROWSER                                     │
│  https://crm-frontend-xyz789.onrender.com           │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ (1) User visits frontend
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  FRONTEND (Next.js)                                 │
│  Deployed on: Render/Vercel/Netlify                 │
│                                                      │
│  Environment Variables:                             │
│  NEXT_PUBLIC_API_URL=https://crm-backend-.../api    │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ (2) Frontend makes API calls
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  BACKEND (NestJS)                                   │
│  https://crm-backend-abc123.onrender.com            │
│                                                      │
│  Environment Variables:                             │
│  FRONTEND_URL=https://crm-frontend-xyz789...        │
│  DATABASE_URL=postgresql://...                      │
│                                                      │
│  ✅ CORS Check: Is request from FRONTEND_URL?       │
│     Yes → Allow request                             │
│     No  → Block request (CORS error)                │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ (3) Backend queries database
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  DATABASE (PostgreSQL)                              │
│  Render managed database                            │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

Before marking as "done", verify:

- [ ] Backend is deployed and shows "Live" status
- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend is deployed and accessible
- [ ] Frontend environment variable `NEXT_PUBLIC_API_URL` is set correctly
- [ ] Backend environment variable `FRONTEND_URL` is set to actual frontend URL
- [ ] Backend has been redeployed after setting `FRONTEND_URL`
- [ ] No CORS errors in browser console
- [ ] Can login successfully from deployed frontend
- [ ] Can see dashboard data after login
- [ ] API calls complete successfully (check Network tab)

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Frontend loads without errors
2. ✅ Login page appears
3. ✅ Login with `admin@crm.com` / `password123` works
4. ✅ Dashboard shows data (companies, deals, contacts)
5. ✅ No CORS errors in console
6. ✅ Network tab shows successful API calls (status 200)

---

## 🔧 Quick Debug Commands

### Check Backend Status
```bash
curl https://crm-backend-abc123.onrender.com/api/health
```

### Check CORS Headers
```bash
curl -I -X OPTIONS \
  -H "Origin: https://crm-frontend-xyz789.onrender.com" \
  https://crm-backend-abc123.onrender.com/api/health
```

Should return:
```
Access-Control-Allow-Origin: https://crm-frontend-xyz789.onrender.com
Access-Control-Allow-Credentials: true
```

### Test Login from CLI
```bash
curl -X POST https://crm-backend-abc123.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"password123"}'
```

---

## 📞 Need Help?

**Common Resources:**
- Render Docs: https://render.com/docs
- Render Support: https://render.com/support
- Check deployment logs in Render dashboard
- Use browser DevTools Network tab to debug API calls

**Debugging Checklist:**
1. Check backend logs for errors
2. Check frontend console for CORS errors
3. Verify all environment variables are set correctly
4. Ensure both services are deployed and "Live"
5. Test backend API independently (using curl or Postman)
6. Clear browser cache and try incognito mode

---

**Last Updated:** November 16, 2025  
**Version:** 1.0.0
