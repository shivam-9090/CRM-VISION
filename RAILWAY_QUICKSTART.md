# 🎯 Railway Quick Start

## ✅ Your Railway Setup is Complete!

All configuration files are ready for deployment:
- ✅ `railway.toml` - Railway configuration
- ✅ `backend/.env.example` - Environment variables template
- ✅ `RAILWAY_SETUP_GUIDE.md` - Detailed deployment guide
- ✅ `railway-deploy.ps1` - Helper script for setup

---

## 🚀 Quick Deploy Steps

### 1️⃣ Create Railway Account
Go to https://railway.app and sign in with GitHub

### 2️⃣ Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your `CRM-VISION` repository
- Railway will auto-detect configuration

### 3️⃣ Add PostgreSQL Database
- Click "+ New" in project
- Select "Database" → "PostgreSQL"
- Railway auto-links it to your backend

### 4️⃣ Set Environment Variables
Go to Backend Service → Variables and add:

```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-url.com
JWT_SECRET=x//dcY25FSy10XvlSEOBgpIofZwJv96RuYOtQHRIW/0=
JWT_EXPIRATION=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

**Note:** Your generated JWT secret is: `x//dcY25FSy10XvlSEOBgpIofZwJv96RuYOtQHRIW/0=`

### 5️⃣ Setup Gmail SMTP
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to https://myaccount.google.com/apppasswords
4. Generate new app password
5. Copy and use as `SMTP_PASS`

### 6️⃣ Deploy!
- Railway auto-deploys on push to GitHub
- Or click "Deploy" in Railway dashboard
- Wait 3-5 minutes for build

### 7️⃣ Get Your Backend URL
- Go to Service → Settings → Domains
- Click "Generate Domain"
- You'll get: `https://your-app.up.railway.app`

### 8️⃣ Test Your Backend
Visit: `https://your-app.up.railway.app/api/health`

Should return: `{"status": "ok"}`

---

## 🛠️ Helper Script

Run the interactive setup script:

```powershell
.\railway-deploy.ps1
```

This script helps you:
- Generate JWT secrets
- View required variables
- Test database connections
- Generate Railway CLI commands

---

## 📚 Need More Help?

Read the complete guide:
- `RAILWAY_SETUP_GUIDE.md` - Step-by-step instructions
- `RAILWAY_ENV.md` - Environment variables details

---

## 💰 Free Tier

Railway provides $5/month free credit:
- Backend: ~$3-4/month
- PostgreSQL: ~$1-2/month
- **Total:** Within free tier! 🎉

---

## 🆘 Common Issues

**Build fails?**
- Check railway.toml configuration
- Verify all dependencies are in package.json

**Database connection error?**
- Wait 2-3 minutes for DB to initialize
- Check DATABASE_URL is linked

**SMTP error?**
- Use Gmail App Password, not regular password
- Verify 2FA is enabled

**CORS error?**
- Update FRONTEND_URL in Railway variables
- Ensure it matches your frontend domain

---

## ✅ Deployment Checklist

- [ ] Railway account created
- [ ] PostgreSQL database added
- [ ] All environment variables set
- [ ] Gmail app password generated
- [ ] Backend deployed successfully
- [ ] Health check returns 200
- [ ] Frontend URL updated in variables

---

## 🎉 You're Ready!

Your backend is configured and ready to deploy on Railway!

**Next Steps:**
1. Push your code to GitHub
2. Railway will auto-deploy
3. Share the URL with your clients

**Happy Deploying! 🚀**
