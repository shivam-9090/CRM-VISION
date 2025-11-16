# 🎨 Environment Variables Cheat Sheet

**Quick reference for all environment variables needed**

---

## 📊 Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         RENDER BACKEND                          │
│                                                                 │
│  Service: crm-backend                                           │
│  URL: https://crm-backend-abc123.onrender.com                   │
│                                                                 │
│  REQUIRED Environment Variables:                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  DATABASE_URL=postgresql://user:pass@host:5432/db               │
│  JWT_SECRET=your-64+-character-secret                           │
│  NODE_ENV=production                                            │
│  PORT=3001                                                      │
│  ⭐ FRONTEND_URL=https://crm-frontend-xyz789.onrender.com      │
│  SMTP_HOST=smtp.gmail.com                                       │
│  SMTP_PORT=587                                                  │
│  SMTP_USER=your-email@gmail.com                                 │
│  SMTP_PASS=your-app-password                                    │
│  EMAIL_FROM=your-email@gmail.com                                │
│  SENTRY_DSN=https://...                                         │
│                                                                 │
│  OPTIONAL:                                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  REDIS_URL=redis://default:pass@host:6379                       │
│  RATE_LIMIT_ENABLED=true                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                             ▲
                             │ API Calls
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                     FRONTEND (DEPLOYED)                         │
│                                                                 │
│  Platform: Render / Vercel / Netlify                            │
│  URL: https://crm-frontend-xyz789.onrender.com                  │
│                                                                 │
│  REQUIRED Environment Variables:                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ⭐ NEXT_PUBLIC_API_URL=https://crm-backend-abc123...com/api   │
│  NODE_ENV=production                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND (LOCAL TESTING)                       │
│                                                                 │
│  Location: Your PC                                              │
│  URL: http://localhost:3000                                     │
│                                                                 │
│  File: frontend/.env.local                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ⭐ NEXT_PUBLIC_API_URL=https://crm-backend-abc123...com/api   │
│                                                                 │
│  Backend FRONTEND_URL must be:                                  │
│  FRONTEND_URL=http://localhost:3000                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Critical Variables Explained

### Backend: `FRONTEND_URL`
**Purpose:** Tells backend which domain(s) to allow CORS requests from

**Formats:**
```bash
# For localhost testing
FRONTEND_URL=http://localhost:3000

# For deployed frontend on Render
FRONTEND_URL=https://crm-frontend-xyz789.onrender.com

# For Vercel
FRONTEND_URL=https://your-app.vercel.app

# For Netlify
FRONTEND_URL=https://your-app.netlify.app
```

**⚠️ Rules:**
- NO trailing slash!
- Must match EXACTLY where your frontend is hosted
- Use `http://` for localhost, `https://` for deployed
- Backend must be redeployed after changing this

---

### Frontend: `NEXT_PUBLIC_API_URL`
**Purpose:** Tells frontend where to send API requests

**Formats:**
```bash
# For deployed backend
NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api

# For local backend (full stack local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**⚠️ Rules:**
- MUST have `NEXT_PUBLIC_` prefix (Next.js requirement)
- MUST include `/api` at the end
- No trailing slash after `/api`
- Frontend must be rebuilt after changing this

---

## 📋 Complete Setup Scenarios

### Scenario 1: Testing Locally (Backend on Render)
**Best for:** Testing backend in production with local frontend

```bash
# BACKEND (Render) Environment
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
(all other backend vars)

# FRONTEND (Local) .env.local
NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api
```

**Commands:**
```powershell
# Start frontend
cd frontend
npm run dev
# Open http://localhost:3000
```

---

### Scenario 2: Full Production (Both Deployed)
**Best for:** Production deployment

```bash
# BACKEND (Render) Environment
FRONTEND_URL=https://crm-frontend-xyz789.onrender.com
DATABASE_URL=postgresql://...
JWT_SECRET=...
(all other backend vars)

# FRONTEND (Render/Vercel/Netlify) Environment
NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api
NODE_ENV=production
```

**Deploy:**
1. Deploy backend first → Get URL
2. Deploy frontend with backend URL → Get URL
3. Update backend FRONTEND_URL with frontend URL
4. Redeploy backend

---

### Scenario 3: Full Local Development
**Best for:** Local development and testing

```bash
# BACKEND (Local) .env
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/crm_db
JWT_SECRET=local-dev-secret-32-chars-min
(other vars as needed)

# FRONTEND (Local) .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Commands:**
```powershell
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🚦 Environment Files Quick Guide

### Backend Files
```
backend/
├── .env                    # Local development (gitignored)
├── .env.example            # Template (committed)
└── .env.production         # Production secrets (gitignored)
                           # On Render: Set via dashboard
```

### Frontend Files
```
frontend/
├── .env.local              # Local development (gitignored)
├── .env.production         # Production build (gitignored)
└── .env.example            # Template (committed)
                           # On Render/Vercel: Set via dashboard
```

---

## ✅ Verification Commands

### Test Backend is Running
```bash
curl https://crm-backend-abc123.onrender.com/api/health
```

### Test CORS Configuration
```bash
curl -I -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  https://crm-backend-abc123.onrender.com/api/health
```

Look for:
```
Access-Control-Allow-Origin: http://localhost:3000
```

### Test Login Endpoint
```bash
curl -X POST https://crm-backend-abc123.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"password123"}'
```

---

## 🎯 Common Mistakes to Avoid

### ❌ Wrong Frontend Variable Name
```bash
# ❌ WRONG - Missing NEXT_PUBLIC_ prefix
API_URL=https://crm-backend-abc123.onrender.com/api

# ✅ CORRECT
NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api
```

### ❌ Trailing Slash
```bash
# ❌ WRONG
FRONTEND_URL=https://crm-frontend-xyz789.onrender.com/
NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api/

# ✅ CORRECT
FRONTEND_URL=https://crm-frontend-xyz789.onrender.com
NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api
```

### ❌ Missing /api Suffix
```bash
# ❌ WRONG
NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com

# ✅ CORRECT
NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api
```

### ❌ Wrong Protocol
```bash
# ❌ WRONG - Using http:// for deployed service
FRONTEND_URL=http://crm-frontend-xyz789.onrender.com

# ✅ CORRECT - Use https:// for deployed
FRONTEND_URL=https://crm-frontend-xyz789.onrender.com

# ✅ CORRECT - Use http:// for localhost
FRONTEND_URL=http://localhost:3000
```

### ❌ Not Redeploying After Changes
```bash
# After changing environment variables, you MUST:
1. Save changes on platform (Render/Vercel/Netlify)
2. Redeploy the service (usually automatic)
3. Wait 2-3 minutes for deployment
4. Clear browser cache
5. Test again
```

---

## 🔧 Troubleshooting Matrix

| Symptom | Cause | Fix |
|---------|-------|-----|
| CORS error | Backend FRONTEND_URL wrong | Update and redeploy backend |
| Can't login | Backend not running | Check Render dashboard |
| 404 errors | Missing `/api` in frontend URL | Add `/api` to NEXT_PUBLIC_API_URL |
| Changes not working | Cache or not redeployed | Clear cache, redeploy service |
| Works locally not production | Different environment variables | Check production env vars |

---

## 📞 Quick Help

**CORS Error?**
→ Check backend `FRONTEND_URL` matches where frontend is hosted

**404 on API calls?**
→ Check frontend `NEXT_PUBLIC_API_URL` includes `/api`

**Changes not taking effect?**
→ Redeploy service and clear browser cache

**Still stuck?**
→ Check deployment logs in Render dashboard
→ Check browser console for errors
→ Test backend independently with curl

---

**Last Updated:** November 16, 2025  
**Pro Tip:** Bookmark this page for quick reference! 🔖
