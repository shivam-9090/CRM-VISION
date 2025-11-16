# 🚀 AWS Elastic Beanstalk Deployment Guide

This guide will help you deploy your CRM system to AWS in ~30 minutes.

## 📋 Prerequisites

Before you start, you need:
- ✅ AWS Account (Free tier available)
- ✅ Credit/Debit card (for AWS verification - won't be charged on free tier)
- ✅ Windows PowerShell (already installed)

## 🎯 Step-by-Step Deployment

### Step 1: Run Setup Script (5 minutes)

Open PowerShell as Administrator and run:

```powershell
cd e:\CRM_01
.\scripts\setup-aws.ps1
```

This will:
- Install AWS CLI
- Install EB CLI
- Configure your AWS credentials

**When prompted for credentials:**
1. Go to: https://console.aws.amazon.com/iam/home#/security_credentials
2. Click "Create access key"
3. Copy the Access Key ID and Secret Access Key
4. Paste them when prompted

### Step 2: Configure Environment Variables (2 minutes)

```powershell
# Copy the example file
Copy-Item .env.aws.example .env.aws

# Edit the file and replace:
notepad .env.aws
```

**Replace these values:**
- `YOUR_PASSWORD` → Strong password for database
- `GENERATE_STRONG_PASSWORD_HERE` → Same password
- `GENERATE_RANDOM_STRING_HERE_MIN_32_CHARS` → Random 32+ character string
- `YOUR_EB_ENVIRONMENT_URL` → You'll get this after deployment (step 4)

**Generate secure secrets:**
```powershell
# Generate JWT Secret (run in PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generate DB Password
-join ((48..57) + (65..90) + (97..122) + (33, 35, 36, 37, 38, 42) | Get-Random -Count 20 | ForEach-Object {[char]$_})
```

### Step 3: Update Dockerrun.aws.json (1 minute)

The deployment script will handle this automatically, but verify:

```powershell
# Check the file
notepad Dockerrun.aws.json
```

Make sure sensitive values are replaced with your generated secrets.

### Step 4: Deploy to AWS (20 minutes)

```powershell
# Run the deployment script
.\scripts\deploy-aws.ps1
```

This will:
1. ✅ Create ECR repositories for Docker images
2. ✅ Build and push your backend and frontend images
3. ✅ Create Elastic Beanstalk application
4. ✅ Create production environment
5. ✅ Deploy your application

**Wait for deployment to complete...**

### Step 5: Get Your Application URL

After deployment, you'll see:
```
Your application is available at:
CNAME: crm-vision-prod.us-east-1.elasticbeanstalk.com
```

**Now update environment variables:**
```powershell
# Set the frontend URL
eb setenv FRONTEND_URL=http://crm-vision-prod.us-east-1.elasticbeanstalk.com

# Set the backend API URL
eb setenv NEXT_PUBLIC_API_URL=http://crm-vision-prod.us-east-1.elasticbeanstalk.com:3001/api

# Restart the application
eb deploy
```

### Step 6: Test Your Application

```powershell
# Open in browser
eb open
```

Or visit: `http://your-environment-url.elasticbeanstalk.com`

## 🔧 Post-Deployment Configuration

### Set Up Custom Domain (Optional)

1. Go to Route 53 in AWS Console
2. Create hosted zone for your domain
3. Add CNAME record pointing to your EB environment
4. Update CORS settings:
```powershell
eb setenv CORS_ORIGIN=https://yourdomain.com
```

### Enable HTTPS (Recommended)

1. Go to EC2 → Load Balancers
2. Select your EB load balancer
3. Add HTTPS listener
4. Add SSL certificate from ACM (AWS Certificate Manager)

### Set Up Database Backups

```powershell
# Create backup script
eb ssh
sudo crontab -e

# Add daily backup at 2 AM:
0 2 * * * docker exec $(docker ps -qf "name=postgres") pg_dump -U postgres crm_db > /backup/crm_$(date +\%Y\%m\%d).sql
```

## 📊 Useful Commands

```powershell
# View application logs
eb logs

# SSH into instance
eb ssh

# Check environment status
eb status

# Update environment variables
eb setenv KEY=VALUE

# Deploy updates
eb deploy

# Terminate environment (WARNING: Deletes everything)
eb terminate crm-vision-prod
```

## 💰 Cost Estimation

**AWS Free Tier (First 12 months):**
- ✅ EC2 t3.medium: 750 hours/month FREE
- ✅ RDS (if you add it): 750 hours/month FREE
- ✅ EBS storage: 30 GB FREE
- ✅ Data transfer: 15 GB/month FREE

**After Free Tier:**
- ~$30-50/month for t3.medium instance
- ~$15-25/month for RDS (if added)

**Tip:** Use t3.micro for development to stay in free tier longer!

## 🐛 Troubleshooting

### Deployment Failed?

```powershell
# Check logs
eb logs --all

# View events
eb events --follow
```

### Can't connect to database?

```powershell
# SSH and check containers
eb ssh
docker ps
docker logs <container_id>
```

### Out of memory?

Upgrade instance type:
```powershell
eb scale --instance-type t3.large
```

## 🔐 Security Best Practices

1. ✅ Never commit `.env.aws` to git
2. ✅ Use IAM roles instead of access keys where possible
3. ✅ Enable CloudWatch logging
4. ✅ Set up CloudWatch alarms for monitoring
5. ✅ Regularly update Docker images
6. ✅ Use AWS Secrets Manager for sensitive data

## 📚 Additional Resources

- [AWS Elastic Beanstalk Docs](https://docs.aws.amazon.com/elasticbeanstalk/)
- [EB CLI Reference](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html)
- [Docker Multi-Container](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_docker_v2config.html)

## 🆘 Need Help?

If you encounter issues:
1. Check deployment logs: `eb logs`
2. Check AWS Console: https://console.aws.amazon.com/elasticbeanstalk
3. Review CloudWatch logs
4. Check Security Groups and IAM permissions

---

**Congratulations! 🎉 Your CRM is now running on AWS!**
