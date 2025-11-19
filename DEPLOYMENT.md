# 🚀 Deployment Guide - Railway.app

Deploy your CRM system to Railway.app with **always-on** backend in minutes!

## ✅ What You Get

- ✅ Backend API (Node.js) - **Always On, No Sleep**
- ✅ Frontend (Next.js) - Deploy on Netlify/Vercel
- ✅ PostgreSQL Database (Managed)
- ✅ Redis Cache (Optional)
- ✅ Free SSL Certificate
- ✅ Auto-deploy from GitHub
- ✅ ~$5-7/month for low traffic usage

**Note:** Railway charges based on actual usage (CPU/RAM/Network), not fixed monthly fees. Small apps typically cost $5-7/month.

---

## 🎯 Quick Deployment (10 Minutes)

### Step 1: Push to GitHub ✅

Your code is already on GitHub at: `https://github.com/shivam-9090/CRM-VISION`

### Step 2: Sign Up on Railway.app

1. Go to: <https://railway.app>
2. Click **"Login"** or **"Start a New Project"**
3. Sign in with your **GitHub account**
4. Authorize Railway to access your repositories

### Step 3: Create PostgreSQL Database

1. Click **"New Project"**
2. Select **"Provision PostgreSQL"**
3. Database will be created automatically
4. Copy the `DATABASE_URL` from Variables tab (we'll use this later)

### Step 4: Deploy Backend Service

1. In the same project, click **"+ New"** → **"GitHub Repo"**
2. Connect to: **`shivam-9090/CRM-VISION`**
3. Railway will detect Node.js and `railway.toml`
4. Click **"Add Variables"** and set:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (reference the PostgreSQL database variable)
   - `JWT_SECRET` = (generate random: `openssl rand -base64 32`)
   - `JWT_EXPIRATION` = `7d`
   - `FRONTEND_URL` = `https://vision-crm.netlify.app` (or your frontend URL)
   - `PORT` = `3001`
   - `SMTP_HOST` = (your SMTP server, e.g., `smtp.gmail.com`)
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = (your email)
   - `SMTP_PASS` = (your email password or app password)
5. Click **"Deploy"**

### Step 5: Get Backend URL

After deployment completes (3-5 minutes):

1. Go to your backend service → **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://crm-backend-production.up.railway.app`)
4. Update `FRONTEND_URL` if deploying frontend to Railway too

### Step 6: Run Database Migrations

1. Go to Backend service → **Deployments** → Click latest deployment
2. Click **"View Logs"**
3. Migrations should run automatically via `start:migrate:prod` script
4. If needed, open terminal and run:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Step 7: Deploy Frontend (Netlify - Free)

1. Go to: <https://netlify.com>
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub: **`shivam-9090/CRM-VISION`**
4. Configure build:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/.next`
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.railway.app/api`
6. Click **"Deploy"**

### Step 8: Access Your CRM! 🎉

Visit your Netlify URL (e.g., `https://vision-crm.netlify.app`)

**Default login:**

- Email: `admin@example.com`
- Password: (check your seed file)

---

## 🔧 Managing Your Deployment

### View Logs

- Go to service → **Deployments** → Click on deployment → **View Logs**
- Real-time logs for debugging

### Manual Deploy

- Railway auto-deploys on every push to `main` branch
- Or click **"Redeploy"** in the deployment view

### Environment Variables

- Go to service → **Variables** tab
- Add/edit variables
- Changes apply on next deployment

### Database Access

- Go to PostgreSQL service → **Connect** tab
- Copy connection string
- Use with tools like pgAdmin, DBeaver, or Prisma Studio

---

## 🐛 Troubleshooting

### Service Won't Start?

1. Check logs in the deployment view
2. Verify all environment variables are set
3. Make sure `DATABASE_URL` is correct
4. Check that migrations ran successfully

### Database Connection Error?

- Wait 2-3 minutes after database creation
- Verify `DATABASE_URL` is correctly referenced
- Check database is in same Railway project

### Frontend Can't Connect to Backend?

- Verify `NEXT_PUBLIC_API_URL` is set correctly in Netlify
- Check CORS settings in backend (`FRONTEND_URL`)
- Ensure backend service is running

### Railway Usage Costs Too High?

- Check Metrics tab for CPU/RAM/Network usage
- Consider optimizing database queries
- Add Redis caching to reduce DB calls
- Monitor background jobs (Bull queues)

---

## 📊 Railway Pricing

Railway charges based on actual usage:

| Resource | Cost |
|----------|------|
| CPU | ~$0.000463/min |
| RAM | ~$0.000231/GB/min |
| Disk | ~$0.25/GB/month |
| Network Egress | ~$0.10/GB |

**Typical small CRM costs: $5-10/month**

### Free Trial

- $5 free credit on signup
- Good for ~1 month of testing
- No credit card required initially

---

## 🚀 Optional: Add Redis Cache

To reduce database load and costs:

1. In your Railway project, click **"+ New"** → **"Database"** → **"Add Redis"**
2. Copy the `REDIS_URL` from Variables
3. Add to backend service variables: `REDIS_URL` = (reference Redis variable)
4. Redeploy backend

---

## 🔐 Security Best Practices

1. **Change Default Passwords**
   - Update admin password after first login
   - Use strong database passwords (Railway auto-generates)

2. **Environment Variables**
   - Never commit `.env` files to git
   - Use Railway's Variables feature

3. **JWT Secret**
   - Generate strong secret: `openssl rand -base64 32`
   - Store in Railway Variables

4. **CORS Configuration**
   - Update `FRONTEND_URL` to match your actual frontend domain
   - Restrict to your domain only

5. **Rate Limiting**
   - Backend already has throttling configured
   - Monitor for unusual traffic patterns

---

## 📚 Useful Links

- Railway Dashboard: <https://railway.app/dashboard>
- Railway Docs: <https://docs.railway.app>
- Your GitHub Repo: <https://github.com/shivam-9090/CRM-VISION>
- Netlify Dashboard: <https://app.netlify.com>

---

## 🆘 Need Help?

**Common Commands:**

```bash
# View service logs
# Go to: Railway Dashboard → Your Service → Deployments → View Logs

# Run migrations manually (if needed)
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Generate Prisma client
npx prisma generate

# Check database (local)
npx prisma studio
```

---

## 🎉 Success Checklist

- ✅ PostgreSQL database created on Railway
- ✅ Backend service deployed and running
- ✅ Frontend deployed on Netlify
- ✅ All environment variables configured
- ✅ Backend health check passes (`/api/health`)
- ✅ Database migrations completed
- ✅ Can login to the CRM
- ✅ CORS configured correctly

**Congratulations! Your CRM is now live on Railway! 🚀**

---

## 💡 Tips

1. **Monitor Usage:** Check Railway Metrics tab regularly
2. **Auto-Deploy:** Every push to `main` branch auto-deploys
3. **Preview Deployments:** Railway creates preview for each PR
4. **Custom Domain:** Add your own domain in Settings (free!)
5. **Backups:** Use Railway's database backup feature or Prisma migrations
6. **Cost Optimization:**
   - Use connection pooling (Prisma already does this)
   - Add Redis for caching
   - Optimize N+1 queries
   - Monitor slow queries

**Your CRM is production-ready and always-on!** 🎯
