# 🚀 Payment & Email Service Setup Guide

## Overview

Your CRM now includes:

- **Razorpay Payment Integration** - Subscription plans with payment gateway
- **EmailJS Service** - Simple SMTP-based email delivery (no AWS needed!)
- **Welcome Email Templates** - Automated onboarding emails
- **Free Tier Subscription** - Automatic free plan for new users

---

## 📦 What's Already Installed

✅ Razorpay SDK installed
✅ EmailJS service configured (uses Nodemailer + Gmail SMTP)
✅ Welcome email templates created
✅ Database models ready (Subscription, Payment, Plans)

---

## 🔧 Environment Variables Setup

### Add to Railway Backend Environment:

```env
# ========================================
# RAZORPAY CONFIGURATION
# ========================================
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here

# ========================================
# SMTP EMAIL CONFIGURATION (Gmail)
# ========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=visionakl08@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM=noreply@crm-vision.com

# ========================================
# FRONTEND URL (For Email Links)
# ========================================
FRONTEND_URL=https://your-netlify-app.netlify.app
```

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Get Gmail App Password

```
1. Go to: https://myaccount.google.com/security
2. Enable 2-Step Verification (if not done)
3. Go to: https://myaccount.google.com/apppasswords
4. Select: Mail + Windows Computer
5. Copy the 16-character password
```

### Step 2: Get Razorpay Keys

```
1. Go to: https://dashboard.razorpay.com
2. Settings → API Keys
3. Copy Key ID and Key Secret (Test Mode)
```

### Step 3: Add to Railway

```
1. Go to Railway.app
2. Click Backend service
3. Go to Variables tab
4. Add all 6 environment variables above
5. Done! Railway redeploys automatically
```

---

## 🧪 Test Email Flow

Once deployed:

```bash
curl -X POST https://your-railway-backend.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "companyName": "Test Company"
  }'
```

**You should get:**

1. ✅ User created
2. ✅ Free subscription created
3. ✅ Welcome email sent to test@example.com

---

## 💰 Subscription Plans

| Plan       | Price     | Users     | Deals     | Contacts  | Storage   |
| ---------- | --------- | --------- | --------- | --------- | --------- |
| Free       | ₹0        | 1         | 100       | 500       | 1GB       |
| Basic      | ₹999/mo   | 5         | 1,000     | 5,000     | 10GB      |
| Pro        | ₹2,999/mo | 20        | Unlimited | Unlimited | 100GB     |
| Enterprise | ₹9,999/mo | Unlimited | Unlimited | Unlimited | Unlimited |

---

## 📧 Email Service

**EmailJS Service** sends emails using:

- **Provider:** Gmail SMTP (simple, no setup needed)
- **Location:** `backend/src/email/emailjs.service.ts`
- **Features:**
  - Welcome emails on registration
  - Password reset emails
  - Email verification
  - All automatic, no manual sending needed

### Email Templates:

- Welcome: `backend/src/email/templates/welcome.template.ts`
- Professional HTML + Plain text versions
- Includes dashboard link and feature list

---

## 🎯 API Endpoints

### Payments API

| Method | Endpoint                         | Description                | Auth |
| ------ | -------------------------------- | -------------------------- | ---- |
| GET    | `/api/payments/plans`            | Get all subscription plans | No   |
| GET    | `/api/payments/plans/:id`        | Get specific plan          | No   |
| POST   | `/api/payments/create-order`     | Create Razorpay order      | Yes  |
| POST   | `/api/payments/verify`           | Verify payment signature   | No   |
| GET    | `/api/payments/subscription`     | Get current subscription   | Yes  |
| DELETE | `/api/payments/subscription/:id` | Cancel subscription        | Yes  |

### Example: Create Payment Order

```bash
curl -X POST https://your-railway-backend.app/api/payments/create-order \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"planId": "plan_id_here"}'
```

Response:

```json
{
  "orderId": "order_xxx",
  "amount": 99900,
  "currency": "INR",
  "subscriptionId": "sub_xxx",
  "paymentId": "pay_xxx",
  "key": "rzp_test_xxx"
}
```

---

## 🚀 Frontend Integration

### Display Plans

```typescript
const plans = await fetch("/api/payments/plans").then((r) => r.json());
// Shows 4 plans with pricing
```

### Create Payment Order

```typescript
const response = await fetch("/api/payments/create-order", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ planId: selectedPlanId }),
});

const { orderId, amount, key } = await response.json();
```

### Open Razorpay Checkout

```typescript
const razorpay = new window.Razorpay({
  key: key,
  amount: amount,
  order_id: orderId,
  handler: function (response) {
    // Verify payment on backend
    verifyPayment(response);
  },
});
razorpay.open();
```

---

## ✅ Deployment Checklist

- [ ] Add all 6 environment variables to Railway
- [ ] Push code to GitHub
- [ ] Railway auto-deploys
- [ ] Create database migration (automatic on deploy)
- [ ] Seed subscription plans (run: `npm run db:seed:plans`)
- [ ] Test registration → should receive welcome email
- [ ] Test payment flow

---

## 📞 Troubleshooting

**Email not sending?**

- Check SMTP credentials in Railway variables
- Verify Gmail app password (16 chars)
- Check Railway logs for errors

**Payment not creating?**

- Verify Razorpay keys are correct
- Check order amount (in paise, not rupees)
- Review Razorpay dashboard for logs

**Free subscription not created?**

- Run: `npm run db:seed:plans` on Railway
- Check database for SubscriptionPlan records

---

## 🎉 Done!

Your CRM now has:
✅ Payment processing (Razorpay)
✅ Email service (Gmail SMTP)
✅ Welcome emails on registration
✅ Subscription management
✅ 4 subscription plans (Free, Basic, Pro, Enterprise)

**No AWS account needed!** Just Gmail + Razorpay.
