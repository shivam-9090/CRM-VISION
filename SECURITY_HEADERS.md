# Security Headers & HTTPS Configuration

**Status**: ✅ IMPLEMENTED  
**Priority**: CRITICAL  
**Environment**: Production

---

## Overview

This document details the comprehensive security headers and HTTPS enforcement implemented in the CRM system. These security measures protect against common web vulnerabilities and ensure all traffic is encrypted.

## Table of Contents

1. [Security Headers Implemented](#security-headers-implemented)
2. [HTTPS Enforcement](#https-enforcement)
3. [Configuration Details](#configuration-details)
4. [Testing & Validation](#testing--validation)
5. [Deployment Checklist](#deployment-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Security Headers Implemented

### 1. Strict-Transport-Security (HSTS)

**Purpose**: Forces browsers to only use HTTPS connections for 1 year.

**Configuration**:
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Benefits**:
- Prevents protocol downgrade attacks
- Protects against cookie hijacking
- Prevents man-in-the-middle attacks
- Eligible for HSTS preload list

**Implementation**: `backend/src/main.ts` (Helmet configuration)

---

### 2. Content-Security-Policy (CSP)

**Purpose**: Prevents XSS attacks by controlling resource loading.

**Configuration**:
```http
Content-Security-Policy: 
  default-src 'self';
  style-src 'self' 'unsafe-inline';
  script-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self';
  font-src 'self' data:;
  object-src 'none';
  media-src 'self';
  frame-src 'none';
  upgrade-insecure-requests;
```

**Why `unsafe-inline` is allowed**:
- Required for Swagger UI documentation
- Limited to `style-src` and `script-src` only
- API endpoints themselves do NOT use inline scripts/styles

**Production Recommendation**:
- Consider using nonces for inline scripts/styles
- Separate API server from documentation server for stricter CSP

**Implementation**: `backend/src/main.ts` (Helmet CSP directives)

---

### 3. X-Frame-Options

**Purpose**: Prevents clickjacking attacks.

**Configuration**:
```http
X-Frame-Options: DENY
```

**Benefits**:
- Prevents the site from being embedded in iframes
- Protects against clickjacking
- Works in browsers that don't support CSP `frame-ancestors`

**Implementation**: `backend/src/main.ts` (Helmet frameguard)

---

### 4. X-Content-Type-Options

**Purpose**: Prevents MIME type sniffing.

**Configuration**:
```http
X-Content-Type-Options: nosniff
```

**Benefits**:
- Forces browsers to respect `Content-Type` headers
- Prevents executing scripts disguised as other file types
- Mitigates drive-by download attacks

**Implementation**: `backend/src/main.ts` (Helmet noSniff)

---

### 5. Referrer-Policy

**Purpose**: Controls how much referrer information is shared.

**Configuration**:
```http
Referrer-Policy: strict-origin-when-cross-origin
```

**Benefits**:
- Protects user privacy
- Prevents leaking sensitive URLs to third parties
- Sends full URL for same-origin, only origin for cross-origin

**Implementation**: `backend/src/main.ts` (Helmet referrerPolicy)

---

### 6. Permissions-Policy

**Purpose**: Controls browser feature access (formerly Feature-Policy).

**Configuration**:
```http
Permissions-Policy: 
  camera=(),
  microphone=(),
  geolocation=(),
  payment=()
```

**Benefits**:
- Prevents unauthorized access to device features
- Reduces attack surface
- Explicit opt-in required for sensitive features

**Implementation**: `backend/src/main.ts` (Helmet permissionsPolicy)

---

### 7. X-Powered-By Header Removal

**Purpose**: Hide server technology stack.

**Configuration**:
```http
# Header is completely removed
```

**Benefits**:
- Prevents information disclosure
- Makes targeted attacks more difficult
- Security through obscurity (defense in depth)

**Implementation**: `backend/src/main.ts` (Helmet hidePoweredBy)

---

## HTTPS Enforcement

### Force HTTPS Middleware

**File**: `backend/src/common/middlewares/force-https.middleware.ts`

**Behavior**:
1. **Production Only**: Middleware only active when `NODE_ENV=production`
2. **Automatic Redirect**: All HTTP requests → 301 Permanent Redirect to HTTPS
3. **Proxy Support**: Detects HTTPS behind reverse proxies/load balancers

**Detection Logic**:
```typescript
const isHttps = 
  req.secure ||                              // Standard Express
  req.headers['x-forwarded-proto'] === 'https' || // Proxy/Load Balancer
  req.headers['x-forwarded-ssl'] === 'on';        // Some proxies
```

**Redirect Example**:
```
Request:  http://api.example.com/api/users
Response: 301 Permanent Redirect
Location: https://api.example.com/api/users
```

---

### CORS Configuration (Production)

**Production Origins**: Only HTTPS allowed
```typescript
const allowedOrigins = [
  'https://your-frontend-domain.com',
  'https://www.your-frontend-domain.com',
  // NO http:// origins in production
];
```

**Development Origins**: HTTP allowed for local testing
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  /^http:\/\/192\.168\.[0-9]+\.[0-9]+:3000$/,
  // Local network patterns for cross-device testing
];
```

---

## Configuration Details

### Environment Variables

**Required for Production**:
```bash
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
PORT=3001
```

**SSL/TLS Certificate Requirements**:
- Valid SSL certificate from trusted CA (Let's Encrypt, DigiCert, etc.)
- Certificate chain properly configured
- Auto-renewal configured (Let's Encrypt certbot recommended)

---

### Cookie Security (Already Implemented)

All authentication cookies use secure flags:
```typescript
{
  httpOnly: true,    // Prevents JavaScript access
  secure: true,      // HTTPS only (production)
  sameSite: 'strict', // CSRF protection
  maxAge: 604800000  // 7 days
}
```

**Implementation**: `backend/src/auth/auth.service.ts`

---

## Testing & Validation

### 1. Local Testing (Development)

**Test HTTPS Redirect** (will NOT redirect in development):
```bash
# Set NODE_ENV temporarily
$env:NODE_ENV='production'  # PowerShell
export NODE_ENV=production  # Bash

# Start server
npm run start:dev

# Test redirect (should redirect to HTTPS)
curl -I http://localhost:3001/api/health
```

**Expected**: 301 Redirect to `https://localhost:3001/api/health`

---

### 2. Security Headers Validation

**Test Headers with cURL**:
```bash
curl -I https://your-api-domain.com/api/health
```

**Expected Headers**:
```http
HTTP/2 200
strict-transport-security: max-age=31536000; includeSubDomains; preload
content-security-policy: default-src 'self'; ...
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=(), payment=()
```

---

### 3. Online Security Scanners

**Mozilla Observatory**:
```
https://observatory.mozilla.org/analyze/your-api-domain.com
```
**Target Grade**: A+ or A

**SecurityHeaders.com**:
```
https://securityheaders.com/?q=your-api-domain.com
```
**Target Grade**: A

**SSL Labs**:
```
https://www.ssllabs.com/ssltest/analyze.html?d=your-api-domain.com
```
**Target Grade**: A+ (requires proper TLS configuration)

---

### 4. Browser DevTools Testing

**Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Load `https://your-api-domain.com/api/health`
4. Click the request → Headers tab
5. Verify all security headers are present

**Chrome Security Panel**:
1. DevTools → Security tab
2. Should show: "This page is secure (valid HTTPS)"
3. View certificate details

---

## Deployment Checklist

### Pre-Deployment

- [ ] SSL/TLS certificate obtained and installed
- [ ] Certificate auto-renewal configured (Let's Encrypt certbot)
- [ ] `NODE_ENV=production` set in environment
- [ ] `FRONTEND_URL` configured with HTTPS URL
- [ ] Reverse proxy/load balancer configured (if applicable)
  - [ ] Proxy passes `X-Forwarded-Proto` header
  - [ ] Proxy passes `X-Forwarded-SSL` header (optional)

### Post-Deployment

- [ ] Test HTTP → HTTPS redirect works
- [ ] Verify all security headers present (curl/browser)
- [ ] Run Mozilla Observatory scan (Grade A+ or A)
- [ ] Run SecurityHeaders.com scan (Grade A)
- [ ] Run SSL Labs test (Grade A+)
- [ ] Test CORS with production frontend
- [ ] Verify cookies have `Secure` flag
- [ ] Check HSTS preload eligibility

### HSTS Preload Submission (Optional)

**When ready** (after testing for several weeks):
1. Visit https://hstspreload.org/
2. Enter your domain
3. Verify eligibility
4. Submit for preload list inclusion

**Benefits**:
- Browsers will ALWAYS use HTTPS (even first visit)
- Maximum protection against downgrade attacks

**WARNING**: Difficult to remove once added. Test thoroughly first.

---

## Troubleshooting

### Issue: "Mixed Content" Warnings

**Cause**: Frontend loading HTTP resources over HTTPS

**Solution**:
1. Update frontend to use HTTPS URLs for API calls
2. Enable CSP `upgrade-insecure-requests` (already enabled)
3. Check browser console for specific mixed content URLs

---

### Issue: CORS Errors in Production

**Cause**: HTTP frontend trying to access HTTPS API

**Solution**:
1. Update `FRONTEND_URL` to use HTTPS
2. Add frontend HTTPS domain to `allowedOrigins` array
3. Test with `curl -H "Origin: https://your-frontend.com"`

---

### Issue: "NET::ERR_CERT_AUTHORITY_INVALID"

**Cause**: Invalid or self-signed SSL certificate

**Solution**:
1. Use valid certificate from trusted CA
2. For development: Import self-signed cert to browser
3. Production: Use Let's Encrypt or commercial certificate

---

### Issue: Redirect Loop (HTTP → HTTPS → HTTP)

**Cause**: Proxy/load balancer not passing HTTPS headers

**Solution**:
1. Configure proxy to pass `X-Forwarded-Proto: https`
2. Check proxy SSL termination settings
3. Verify `req.secure` detection logic in middleware

**Nginx Example**:
```nginx
location / {
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-SSL on;
    proxy_pass http://backend:3001;
}
```

---

### Issue: Swagger UI Not Loading

**Cause**: CSP blocking inline scripts/styles

**Solution**:
- Already configured: `'unsafe-inline'` allowed for Swagger
- Check browser console for CSP violations
- Consider nonce-based CSP for stricter security

---

## Security Best Practices

### 1. Regular Certificate Renewal

**Let's Encrypt Certbot** (recommended):
```bash
# Install certbot
sudo apt-get install certbot

# Auto-renewal
sudo certbot renew --dry-run

# Add to crontab (renew twice daily)
0 0,12 * * * certbot renew --quiet
```

---

### 2. Security Header Monitoring

**Weekly Checks**:
- Run Mozilla Observatory scan
- Review SecurityHeaders.com results
- Check SSL Labs rating

**Alerts**:
- Set up monitoring for certificate expiration
- Monitor for security header changes/removals

---

### 3. Defense in Depth

**Multiple Layers**:
1. ✅ HTTPS/TLS encryption
2. ✅ Security headers (CSP, HSTS, etc.)
3. ✅ Rate limiting (Task #6)
4. ✅ Input validation & sanitization
5. ✅ JWT authentication
6. ✅ CORS restrictions
7. ✅ Cookie security flags

---

## References

### Documentation

- **Helmet.js**: https://helmetjs.github.io/
- **OWASP Secure Headers**: https://owasp.org/www-project-secure-headers/
- **MDN CSP**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- **HSTS Preload**: https://hstspreload.org/

### Security Scanners

- **Mozilla Observatory**: https://observatory.mozilla.org/
- **SecurityHeaders.com**: https://securityheaders.com/
- **SSL Labs**: https://www.ssllabs.com/ssltest/

---

## Files Modified

1. **backend/src/main.ts**
   - Enhanced Helmet configuration with strict CSP
   - HSTS with 1-year max-age and preload
   - Production HTTPS-only CORS origins
   - Additional startup logs for security status

2. **backend/src/app.module.ts**
   - Registered `ForceHttpsMiddleware` (production only)
   - Applied as first middleware for all routes

3. **backend/src/common/middlewares/force-https.middleware.ts** (NEW)
   - Automatic HTTP → HTTPS redirect in production
   - Proxy/load balancer detection
   - 301 Permanent Redirect

4. **SECURITY_HEADERS.md** (NEW - this file)
   - Comprehensive security documentation
   - Testing procedures
   - Deployment checklist

---

## Next Steps

1. ✅ **Task #7 Complete**: Security headers implemented
2. 🔜 **Task #8**: Input Validation Enhancement
3. 🔜 **Task #9**: Environment Variables Security (HIGH PRIORITY)

---

**Document Version**: 1.0  
**Last Updated**: November 6, 2025  
**Author**: GitHub Copilot  
**Status**: Production Ready
