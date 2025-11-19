# Netlify Frontend Deployment Guide

## Quick Setup (5 minutes)

### 1. Push to GitHub
```bash
git add .
git commit -m "feat: add Netlify configuration for frontend deployment"
git push origin main
```

### 2. Deploy on Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and select `shivam-9090/CRM-VISION`
4. Netlify will auto-detect `netlify.toml` settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

### 3. Set Environment Variables

In Netlify dashboard → Site settings → Environment variables, add:

```bash
# Required
NEXT_PUBLIC_API_URL=https://crm-backend-5f20.onrender.com
NEXT_PUBLIC_WS_URL=wss://crm-backend-5f20.onrender.com

# Will be set automatically by Netlify
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app

# Optional (for monitoring)
SENTRY_DSN=your_sentry_dsn_if_needed
SENTRY_AUTH_TOKEN=your_sentry_token_if_needed
```

### 4. Update Backend CORS

After deployment, update your Render backend environment variable:

```bash
FRONTEND_URL=https://your-site-name.netlify.app
```

## Features Configured

✅ **Automatic builds** from GitHub main branch
✅ **API proxy** to backend (handles CORS)
✅ **Security headers** (CSP, XSS protection, frame guard)
✅ **Static asset caching** (1 year for _next/static)
✅ **Node.js 22** runtime
✅ **Next.js plugin** for optimal deployment

## Custom Domain (Optional)

1. Go to **Domain settings** in Netlify
2. Click **"Add custom domain"**
3. Follow instructions to update DNS records

## Deployment Status

- Each push to `main` triggers automatic deployment
- Preview deployments for pull requests
- Rollback to previous deploys anytime

## Notes

- Frontend builds on Netlify (free tier: 300 build minutes/month)
- Backend stays on Render (already deployed ✅)
- No need to commit `dist` or `.next` folders
- Netlify builds them automatically
