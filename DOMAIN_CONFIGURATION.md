# 🌐 Domain Configuration Guide

**Quick reference for updating domain placeholders before deployment**

---

## 📋 Files That Need Your Domain

### **1. `.env.production` (2 occurrences)**
**Location**: Root directory

```bash
# Line ~31: Frontend URL
FRONTEND_URL="https://your-domain.com"

# Line ~35: API URL  
NEXT_PUBLIC_API_URL="https://api.your-domain.com/api"
```

**Example with actual domain:**
```bash
FRONTEND_URL="https://crm.mycompany.com"
NEXT_PUBLIC_API_URL="https://api.crm.mycompany.com/api"
# OR use single domain with path:
NEXT_PUBLIC_API_URL="https://crm.mycompany.com/api"
```

---

### **2. `infra/nginx/nginx.conf` (7 occurrences)**

**Quick find & replace:**
```bash
# Search for:  your-domain.com
# Replace with: crm.mycompany.com (your actual domain)
```

**Specific locations:**
- Line 113: HTTP server name
- Line 133: HTTPS server name
- Lines 139-141: SSL certificate paths (3 occurrences)
- Line 179: Content Security Policy
- Line 316: API subdomain

**PowerShell command to update all at once:**
```powershell
$DOMAIN = "crm.mycompany.com"  # ⚠️ REPLACE THIS
(Get-Content infra/nginx/nginx.conf) -replace 'your-domain\.com', $DOMAIN | Set-Content infra/nginx/nginx.conf
```

---

### **3. `.github/workflows/deploy.yml` (6 occurrences)**

**Staging URLs (3 places):**
- Line 67: `url: https://staging.your-domain.com`
- Line 104: `curl -f https://staging-backend.your-domain.com/health`
- Line 105: `curl -f https://staging.your-domain.com`

**Production URLs (3 places):**
- Line 138: `url: https://your-domain.com`
- Line 185: `curl -f https://api.your-domain.com/health`
- Line 186: `curl -f https://your-domain.com`

---

## ⚡ Quick Update Script

**Update all files at once:**

```powershell
# Set your domain
$DOMAIN = "crm.mycompany.com"  # ⚠️ REPLACE THIS

# Update .env.production
(Get-Content .env.production) -replace 'your-domain\.com', $DOMAIN | Set-Content .env.production

# Update nginx.conf
(Get-Content infra/nginx/nginx.conf) -replace 'your-domain\.com', $DOMAIN | Set-Content infra/nginx/nginx.conf

# Update deploy.yml
(Get-Content .github/workflows/deploy.yml) -replace 'your-domain\.com', $DOMAIN | Set-Content .github/workflows/deploy.yml

Write-Host "✅ All domain placeholders updated to: $DOMAIN" -ForegroundColor Green
```

---

## 🎯 Domain Options

### **Option 1: Single Domain (Recommended for simplicity)**
```
Frontend: https://crm.mycompany.com
Backend API: https://crm.mycompany.com/api
```
**Pros**: Simple DNS, single SSL certificate  
**Setup**: Point domain to server, nginx handles /api routing

### **Option 2: Subdomain for API**
```
Frontend: https://crm.mycompany.com
Backend API: https://api.crm.mycompany.com
```
**Pros**: Clear separation, easier to scale  
**Setup**: Two DNS A records, nginx on both

### **Option 3: Separate Domains**
```
Frontend: https://mycrm.com
Backend API: https://api-mycrm.com
```
**Pros**: Complete isolation  
**Setup**: Two separate domains, more complex

---

## 📝 DNS Configuration Required

### **For Option 1 (Single Domain):**
```
Type: A
Name: crm.mycompany.com
Value: YOUR_SERVER_IP
TTL: 3600
```

### **For Option 2 (Subdomain API):**
```
Type: A
Name: crm.mycompany.com
Value: YOUR_SERVER_IP
TTL: 3600

Type: A
Name: api.crm.mycompany.com
Value: YOUR_SERVER_IP
TTL: 3600
```

### **Optional: WWW redirect**
```
Type: CNAME
Name: www
Value: crm.mycompany.com
TTL: 3600
```

---

## ✅ Verification Checklist

After updating domains:

- [ ] `.env.production` has correct FRONTEND_URL and NEXT_PUBLIC_API_URL
- [ ] `nginx.conf` updated with actual domain (7 places)
- [ ] `deploy.yml` updated with actual domain (6 places)
- [ ] DNS A records created and propagated
- [ ] Verified DNS: `nslookup crm.mycompany.com`
- [ ] SSL certificates will be generated during deployment (setup-ssl.sh)

---

## 🔐 After Domain Configuration

**Next steps:**
1. ✅ Domain placeholders updated in all files
2. Configure DNS at your domain registrar
3. Wait for DNS propagation (5 minutes - 48 hours)
4. Deploy to production server
5. Run `setup-ssl.sh` to generate SSL certificates
6. Test: `https://crm.mycompany.com`

---

**Need help?** 
- Check DNS: `dig crm.mycompany.com`
- Check SSL: `openssl s_client -connect crm.mycompany.com:443`
- View nginx logs: `docker logs crm-nginx-prod -f`
