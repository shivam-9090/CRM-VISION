# 🚀 Quick Start - Localhost Testing

**Testing your deployed backend from local frontend**

---

## 📋 Scenario

You want to:
- ✅ Backend deployed on **Render** (e.g., `https://crm-backend-abc123.onrender.com`)
- ✅ Frontend running **locally** on your PC (`http://localhost:3000`)
- ✅ Local frontend connects to deployed backend

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Get Your Backend URL from Render

After deploying backend to Render, copy the URL:
```
Example: https://crm-backend-abc123.onrender.com
```

### Step 2: Update Local Frontend Environment

Edit `frontend/.env.local` (create if doesn't exist):

```bash
# Point to your deployed backend
NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api
```

### Step 3: Update Backend CORS Settings

On **Render Dashboard** → Your Backend Service → **Environment**:

Add or update:
```bash
FRONTEND_URL=http://localhost:3000
```

**Important:** 
- No trailing slash!
- Must be `http://` (not `https://`) for localhost
- Save and redeploy backend

---

## 🧪 Test the Connection

### 1. Start Local Frontend
```powershell
cd frontend
npm run dev
```

Frontend should open at `http://localhost:3000`

### 2. Open Browser Console (F12)

### 3. Test Backend Connection
Visit `http://localhost:3000` and try to login:
- Email: `admin@crm.com`
- Password: `password123`

### 4. Check for Errors
In browser console, you should see:
- ✅ No CORS errors
- ✅ API calls to `https://crm-backend-abc123.onrender.com/api/...`
- ✅ Status 200 responses

---

## 🔧 If You Get CORS Errors

### Error Message:
```
Access to fetch at 'https://crm-backend-abc123.onrender.com/api/auth/login' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

### Fix:
1. Go to Render Dashboard
2. Open your backend service
3. Go to **Environment** tab
4. Find `FRONTEND_URL` variable
5. Make sure it says: `http://localhost:3000`
6. Save changes
7. Redeploy backend (usually automatic)
8. Wait 2-3 minutes
9. Hard refresh browser (Ctrl+Shift+R)

---

## 📱 Multiple Developers / Devices

If you want to access from different devices on your network:

### Backend Environment Variable:
Instead of just localhost, you can allow multiple origins by setting up backend code to accept network IPs.

Your backend is already configured for this! It automatically allows:
- `http://localhost:3000`
- `http://192.168.x.x:3000` (local network)
- `http://10.x.x.x:3000` (corporate network)
- `http://172.x.x.x:3000` (Docker network)

Just make sure `FRONTEND_URL` is set to `http://localhost:3000` or your specific IP.

### Frontend on Another Device:

1. Find your PC's IP address:
```powershell
ipconfig
# Look for IPv4 Address, e.g., 192.168.1.100
```

2. Update frontend `.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api
```

3. Access from other device:
```
http://192.168.1.100:3000
```

---

## 🎯 Common Scenarios

### Scenario 1: Testing Locally Before Frontend Deployment
```bash
Backend: Deployed on Render
Frontend: Running locally (npm run dev)

Backend FRONTEND_URL=http://localhost:3000
Frontend NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api
```

### Scenario 2: Both Deployed
```bash
Backend: Deployed on Render
Frontend: Deployed on Render/Vercel

Backend FRONTEND_URL=https://crm-frontend-xyz789.onrender.com
Frontend NEXT_PUBLIC_API_URL=https://crm-backend-abc123.onrender.com/api
```

### Scenario 3: Local Development (Both Services)
```bash
Backend: Running locally (npm run start:dev)
Frontend: Running locally (npm run dev)

Backend FRONTEND_URL=http://localhost:3000
Frontend NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## ✅ Verification Checklist

- [ ] Backend deployed and "Live" on Render
- [ ] Backend URL copied (e.g., `https://crm-backend-abc123.onrender.com`)
- [ ] Frontend `.env.local` created with `NEXT_PUBLIC_API_URL`
- [ ] Backend `FRONTEND_URL` set to `http://localhost:3000`
- [ ] Backend redeployed after environment variable change
- [ ] Frontend running locally (`npm run dev`)
- [ ] Can access `http://localhost:3000` in browser
- [ ] No CORS errors in console
- [ ] Login works successfully

---

## 🚨 Troubleshooting

### Frontend Can't Connect
**Check:**
1. Is backend "Live" on Render? (Check dashboard)
2. Is `NEXT_PUBLIC_API_URL` correct in `.env.local`?
3. Did you restart frontend after changing `.env.local`?

**Fix:** 
```powershell
# Stop frontend (Ctrl+C)
# Restart
npm run dev
```

### CORS Errors
**Check:**
1. Is `FRONTEND_URL` set to `http://localhost:3000` on backend?
2. Did backend redeploy after changing environment variable?

**Fix:**
- Trigger manual deploy on Render
- Wait 2-3 minutes
- Clear browser cache (Ctrl+Shift+Delete)

### Environment Variables Not Working
**Remember:**
- Frontend: Prefix with `NEXT_PUBLIC_` for browser access
- Backend: No prefix needed
- Always restart/redeploy after changes
- `.env.local` is for local development only (not committed)

---

## 📝 File Structure

```
CRM_01/
├── backend/
│   ├── .env.production (on Render, via dashboard)
│   └── .env (for local development)
├── frontend/
│   ├── .env.local (create this for localhost testing)
│   └── .env.production (for deployed frontend)
```

---

## 🎉 You're Done!

Once you see the dashboard with data and no console errors, you're successfully connected! 🎊

**Next Steps:**
- Deploy frontend to Render/Vercel
- Update backend `FRONTEND_URL` to deployed frontend URL
- Test production setup

---

**Last Updated:** November 16, 2025
