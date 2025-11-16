# 🚀 Free Deployment Guide - Render.com

Deploy your CRM system to Render.com **100% FREE** in just 5 minutes!

## ✅ What You Get (Free Forever)

- ✅ Backend API (Node.js)
- ✅ Frontend (Next.js)
- ✅ PostgreSQL Database (1 GB)
- ✅ Redis Cache (256 MB)
- ✅ Free SSL Certificate
- ✅ Auto-deploy from GitHub

**Note:** Free tier services sleep after 15 minutes of inactivity (wakes up in ~30 seconds on first request)

---

## 🎯 Quick Deployment (5 Minutes)

### Step 1: Push to GitHub ✅
Your code is already on GitHub at: `https://github.com/shivam-9090/CRM-VISION`

### Step 2: Sign Up on Render.com
1. Go to: **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account**
4. Authorize Render to access your repositories

### Step 3: Deploy with Blueprint
1. Click **"New"** → **"Blueprint"**
2. Connect to: **`shivam-9090/CRM-VISION`**
3. Render will automatically detect `render.yaml`
4. Click **"Apply"**

### Step 4: Wait for Deployment (5-10 minutes)
Render will create:
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ Backend service
- ✅ Frontend service

### Step 5: Configure URLs
After deployment completes:

1. **Get the URLs:**
   - Backend: `https://crm-backend.onrender.com`
   - Frontend: `https://crm-frontend.onrender.com`

2. **Update Environment Variables:**

   **For Backend Service:**
   - Go to Backend service → Environment
   - Add: `FRONTEND_URL` = `https://crm-frontend.onrender.com`
   - Save and redeploy

   **For Frontend Service:**
   - Go to Frontend service → Environment
   - Add: `NEXT_PUBLIC_API_URL` = `https://crm-backend.onrender.com/api`
   - Save and redeploy

### Step 6: Run Database Migrations
1. Go to Backend service → Shell
2. Run:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Step 7: Access Your CRM! 🎉
Visit: `https://crm-frontend.onrender.com`

**Default login:**
- Email: `admin@example.com`
- Password: (check your seed file)

---

## 🔧 Managing Your Deployment

### View Logs
- Go to each service → **Logs** tab
- Real-time logs for debugging

### Manual Deploy
- Go to service → **Manual Deploy** → **Deploy latest commit**

### Environment Variables
- Go to service → **Environment**
- Add/edit variables
- Click **Save Changes** (auto-redeploys)

### Database Access
- Go to PostgreSQL service → **Info**
- Copy connection string
- Use with tools like pgAdmin or DBeaver

---

## 🐛 Troubleshooting

### Service Won't Start?
1. Check logs in the service dashboard
2. Verify all environment variables are set
3. Make sure DATABASE_URL is correct

### Database Connection Error?
- Wait 2-3 minutes after database creation
- Check if migrations ran successfully
- Verify DATABASE_URL format

### Frontend Can't Connect to Backend?
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend service is running

### Service Sleeping Too Much?
**Free tier limitations:**
- Services sleep after 15 min inactivity
- First request takes ~30 sec to wake up
- Consider upgrading to Starter plan ($7/month) for always-on

---

## 📊 Free Tier Limits

| Resource | Free Tier Limit |
|----------|----------------|
| Web Service | 750 hours/month |
| PostgreSQL | 1 GB storage |
| Redis | 256 MB memory |
| Build minutes | Unlimited |
| Bandwidth | 100 GB/month |

---

## 🚀 Upgrade Options (Optional)

### Starter Plan ($7/month per service)
- ✅ No sleep time
- ✅ Better performance
- ✅ More resources

### When to Upgrade?
- Production use with real customers
- Need 24/7 availability
- Higher traffic expected

---

## 🔐 Security Best Practices

1. **Change Default Passwords**
   - Update admin password after first login
   - Use strong database passwords

2. **Environment Variables**
   - Never commit `.env` files to git
   - Use Render's environment variables

3. **JWT Secret**
   - Render auto-generates this
   - Don't share or expose

4. **CORS Configuration**
   - Update `FRONTEND_URL` and `CORS_ORIGIN`
   - Restrict to your domain only

---

## 📚 Useful Links

- Render Dashboard: https://dashboard.render.com
- Render Docs: https://render.com/docs
- Your GitHub Repo: https://github.com/shivam-9090/CRM-VISION

---

## 🆘 Need Help?

**Common Commands:**

```bash
# View service logs
# Go to: Dashboard → Your Service → Logs

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Generate Prisma client
npx prisma generate

# Check database
npx prisma studio
```

---

## 🎉 Success Checklist

- ✅ All 4 services are deployed (backend, frontend, postgres, redis)
- ✅ Backend health check passes
- ✅ Frontend loads without errors
- ✅ Database migrations completed
- ✅ Can login to the CRM
- ✅ CORS configured correctly

**Congratulations! Your CRM is now live! 🚀**

---

## 💡 Tips

1. **Monitor Usage:** Check Render dashboard for resource usage
2. **Auto-Deploy:** Every push to `main` branch auto-deploys
3. **Preview Branches:** Create pull requests for preview deployments
4. **Custom Domain:** Add your own domain in service settings (free!)
5. **Backups:** Use Render's database backup feature

**Your CRM is production-ready!** 🎯
