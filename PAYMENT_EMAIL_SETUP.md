# 🚀 Payment & Email Service Setup Guide

## Overview

Your CRM now includes:

- **Razorpay Payment Integration** - Subscription plans with payment gateway
- **AWS SES Email Service** - Professional email delivery
- **Welcome Email Templates** - Automated onboarding emails
- **Free Tier Subscription** - Automatic free plan for new users

---

## 📦 Required Dependencies

### Install Razorpay SDK

```bash
cd backend
npm install razorpay
```

### Install AWS SES Dependencies

```bash
npm install @aws-sdk/client-ses nodemailer-ses-transport
```

---

## 🔧 Environment Variables Configuration

### Backend `.env` File

Add these variables to your `backend/.env`:

```env
# ========================================
# RAZORPAY CONFIGURATION
# ========================================
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here

# ========================================
# AWS SES EMAIL CONFIGURATION (Priority)
# ========================================
AWS_SES_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# ========================================
# SMTP FALLBACK (Already Configured)
# ========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=visionakl08@gmail.com
SMTP_PASS=your_app_password

# ========================================
# FRONTEND URL (For Email Links)
# ========================================
FRONTEND_URL=https://your-netlify-app.netlify.app
```

---

## 🎯 Setup Steps

### 1. **Database Migration**

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Create migration for subscription tables
npx prisma migrate dev --name add_subscription_models

# Deploy to production database
npx prisma migrate deploy
```

### 2. **Seed Subscription Plans**

```bash
npm run db:seed:plans
```

This will create 4 subscription plans:

- **Free Plan** - ₹0 (1 user, 100 deals, 500 contacts, 1GB)
- **Basic Plan** - ₹999/month (5 users, 1K deals, 5K contacts, 10GB)
- **Pro Plan** - ₹2,999/month (20 users, unlimited deals/contacts, 100GB)
- **Enterprise Plan** - ₹9,999/month (unlimited everything)

### 3. **Configure Razorpay**

#### Get Razorpay Credentials:

1. Sign up at [https://razorpay.com](https://razorpay.com)
2. Go to **Settings** → **API Keys**
3. Generate **Test Mode** keys first
4. Copy `Key ID` and `Key Secret`
5. Add to Railway environment variables:
   - `RAZORPAY_KEY_ID` = rzp_test_xxxxx
   - `RAZORPAY_KEY_SECRET` = xxxxx

#### Razorpay Dashboard Setup:

- Enable **Payment Methods**: Cards, UPI, Netbanking, Wallets
- Set up **Webhooks** (optional): `https://your-backend.railway.app/api/payments/webhook`
- Configure **Settlement** preferences

### 4. **Configure AWS SES**

#### AWS SES Setup:

1. Login to [AWS Console](https://aws.amazon.com/ses/)
2. Go to **SES** → Select region (e.g., `ap-south-1` for India)
3. **Verify Email Address**:
   - Go to **Verified Identities**
   - Click **Create Identity** → Select **Email Address**
   - Enter: `visionakl08@gmail.com`
   - Verify via email link
4. **Create IAM User for API Access**:
   - Go to **IAM** → **Users** → **Add User**
   - Username: `crm-ses-user`
   - Access type: **Programmatic access**
   - Attach policy: `AmazonSESFullAccess`
   - Save `Access Key ID` and `Secret Access Key`
5. **Request Production Access** (optional):
   - SES starts in Sandbox mode (can only send to verified emails)
   - Go to **Account Dashboard** → **Request Production Access**
   - Fill out form with use case details

#### Add to Railway:

```
AWS_SES_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### 5. **Update Frontend URL**

```
FRONTEND_URL=https://your-netlify-app.netlify.app
```

---

## 🧪 Testing

### Test Registration Flow:

```bash
curl -X POST https://your-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "companyName": "Test Company"
  }'
```

**Expected Behavior:**

1. User created successfully
2. Free subscription auto-created
3. Welcome email sent to user

### Test Payment Flow:

```bash
# Get all plans
curl https://your-backend.railway.app/api/payments/plans

# Create order (requires authentication)
curl -X POST https://your-backend.railway.app/api/payments/create-order \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"planId": "plan_id_here"}'
```

---

## 📋 API Endpoints

### Payments API

| Method | Endpoint                         | Description                | Auth Required |
| ------ | -------------------------------- | -------------------------- | ------------- |
| GET    | `/api/payments/plans`            | Get all subscription plans | No            |
| GET    | `/api/payments/plans/:id`        | Get specific plan          | No            |
| POST   | `/api/payments/create-order`     | Create Razorpay order      | Yes           |
| POST   | `/api/payments/verify`           | Verify payment signature   | No            |
| GET    | `/api/payments/subscription`     | Get current subscription   | Yes           |
| DELETE | `/api/payments/subscription/:id` | Cancel subscription        | Yes           |

### Example: Create Payment Order

```typescript
// Request
POST /api/payments/create-order
Authorization: Bearer <token>
{
  "planId": "clxxx...xxx"
}

// Response
{
  "orderId": "order_xxx",
  "amount": 99900,  // In paise
  "currency": "INR",
  "subscriptionId": "sub_xxx",
  "paymentId": "pay_xxx",
  "key": "rzp_test_xxx"
}
```

---

## 🎨 Frontend Integration

### Install Razorpay Checkout

```bash
cd frontend
npm install razorpay
```

### Payment Component Example

```typescript
import { useEffect } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentCheckout({ orderId, amount, onSuccess }: any) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
  }, []);

  const handlePayment = () => {
    const options = {
      key: 'rzp_test_your_key',
      amount: amount,
      currency: 'INR',
      name: 'CRM Vision',
      description: 'Subscription Payment',
      order_id: orderId,
      handler: async function (response: any) {
        // Verify payment
        const result = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        if (result.ok) {
          onSuccess();
        }
      },
      theme: {
        color: '#3b82f6',
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  return (
    <button onClick={handlePayment}>
      Pay Now
    </button>
  );
}
```

---

## 🔍 Monitoring & Troubleshooting

### Check Email Logs:

```bash
# Backend logs
railway logs

# Look for:
# "Email service initialized (production mode - AWS SES: ap-south-1)"
# "Email queued successfully"
```

### Check Payment Logs:

```bash
# Razorpay dashboard
https://dashboard.razorpay.com/app/payments

# Check:
# - Order creation
# - Payment status
# - Webhooks (if configured)
```

### Common Issues:

**Email Not Sending:**

- ✅ Check AWS SES sandbox mode restrictions
- ✅ Verify sender email in SES
- ✅ Check IAM user permissions
- ✅ Review backend logs for errors

**Payment Failing:**

- ✅ Verify Razorpay keys (test vs live mode)
- ✅ Check order amount (must be in paise)
- ✅ Verify signature calculation
- ✅ Check webhook URL configuration

**Free Subscription Not Created:**

- ✅ Run seed script: `npm run db:seed:plans`
- ✅ Check database for SubscriptionPlan with type='FREE'
- ✅ Review registration logs

---

## 🚀 Deployment Checklist

### Railway Backend:

- [ ] Add all environment variables
- [ ] Run migration: `npx prisma migrate deploy`
- [ ] Seed plans: `npm run db:seed:plans`
- [ ] Test registration endpoint
- [ ] Verify email sending
- [ ] Test payment creation

### Netlify Frontend:

- [ ] Update `NEXT_PUBLIC_API_URL`
- [ ] Add Razorpay checkout script
- [ ] Test payment flow end-to-end
- [ ] Verify email links work

---

## 📧 Email Templates

Welcome email is automatically sent on registration with:

- User name and company name
- Dashboard access link
- Feature highlights
- Support information

Location: `backend/src/email/templates/welcome.template.ts`

---

## 💰 Subscription Plans Summary

| Plan       | Price     | Users     | Deals     | Contacts  | Storage   |
| ---------- | --------- | --------- | --------- | --------- | --------- |
| Free       | ₹0        | 1         | 100       | 500       | 1GB       |
| Basic      | ₹999/mo   | 5         | 1,000     | 5,000     | 10GB      |
| Pro        | ₹2,999/mo | 20        | Unlimited | Unlimited | 100GB     |
| Enterprise | ₹9,999/mo | Unlimited | Unlimited | Unlimited | Unlimited |

---

## 🎉 Done!

Your CRM now has:
✅ Payment gateway integration
✅ Subscription management
✅ AWS SES email delivery
✅ Welcome email automation
✅ Free tier for new users

Questions? Check Railway logs or Razorpay dashboard for debugging!
