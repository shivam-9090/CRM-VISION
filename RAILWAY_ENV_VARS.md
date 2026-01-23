# 🚀 Railway Environment Variables - Backend

Copy these variables to your Railway backend service:

## ========================================

## REQUIRED - Already Set

## ========================================

DATABASE_URL=<your-railway-postgres-url>
REDIS_URL=<your-railway-redis-url>
REDIS_PASSWORD=<your-redis-password>
JWT_SECRET=lubgFuVrYkwgIV1KfwzznURCaBLaa7PSkEq8I2c+0eD9Pnq7DdJ7W7dwJA7bH4wdPmeUhpSBgk6TIUmcaDgmlA==
SENTRY_DSN=https://21a0de0abfac32a2f78c6dded2c2f136@o4510758846201856.ingest.us.sentry.io/4510758852820992

## ========================================

## NEW - Razorpay Payment Gateway

## ========================================

# Get from: https://dashboard.razorpay.com/app/keys

RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here

## ========================================

## NEW - AWS SES Email Service (Priority)

## ========================================

# Setup: https://aws.amazon.com/ses/

# Region for India: ap-south-1

AWS_SES_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

## ========================================

## SMTP Email (Fallback - Already Set)

## ========================================

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=visionakl08@gmail.com
SMTP_PASS=<your-app-password>

## ========================================

## Frontend URL (for email links)

## ========================================

FRONTEND_URL=https://your-netlify-app.netlify.app

## ========================================

## Other Existing Variables

## ========================================

NODE_ENV=production
PORT=8080
REDIS_HOST=<your-redis-host>
REDIS_PORT=<your-redis-port>

---

## 📝 Setup Steps:

### 1. Add Variables to Railway:

```bash
railway variables set RAZORPAY_KEY_ID="rzp_test_xxxxx"
railway variables set RAZORPAY_KEY_SECRET="xxxxx"
railway variables set AWS_SES_REGION="ap-south-1"
railway variables set AWS_ACCESS_KEY_ID="AKIA..."
railway variables set AWS_SECRET_ACCESS_KEY="..."
railway variables set FRONTEND_URL="https://your-app.netlify.app"
```

### 2. Deploy Migration to Railway:

Railway will automatically detect the schema changes and run migrations on next deploy.

Or manually via Railway CLI:

```bash
railway run npx prisma migrate deploy
```

### 3. Seed Subscription Plans:

```bash
railway run npm run db:seed:plans
```

### 4. Redeploy Backend:

```bash
git add .
git commit -m "Add payment gateway and email service"
git push
```

Railway will automatically deploy with new changes.

---

## ✅ Verification:

After deployment, check:

- Health endpoint: https://crm-vision-production-52a8.up.railway.app/api/health
- Plans endpoint: https://crm-vision-production-52a8.up.railway.app/api/payments/plans
- Railway logs: `railway logs` (look for "Razorpay initialized" and "AWS SES" messages)
