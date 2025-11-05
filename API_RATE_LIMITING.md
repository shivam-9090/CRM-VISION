# API Rate Limiting Strategy

## Overview

Comprehensive rate limiting implementation to protect API endpoints from abuse and ensure fair usage across all clients.

### ✅ Features Implemented

- ✅ **Redis-Based Storage**: Sliding window algorithm with Redis for accurate rate limiting
- ✅ **Per-Endpoint Limits**: Different rate limits for different types of endpoints
- ✅ **Multi-Tier Throttling**: Short-term burst protection + long-term quotas
- ✅ **In-Memory Fallback**: Automatic fallback to in-memory storage in development
- ✅ **Rate Limit Headers**: Informational headers for transparency
- ✅ **Endpoint-Specific Configuration**: Easy-to-use decorators for custom limits

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Rate Limit Tiers](#rate-limit-tiers)
3. [Current Implementation](#current-implementation)
4. [Redis Storage](#redis-storage)
5. [Custom Rate Limits](#custom-rate-limits)
6. [Monitoring](#monitoring)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Testing Rate Limits

```bash
# Test auth endpoint (5 req/min limit)
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 1
done

# After 5 requests, you'll receive:
# HTTP 429: Too Many Requests
```

### Checking Rate Limit Status

```bash
# All responses include rate limit headers:
curl -I http://localhost:3001/api/companies

# Headers returned:
# X-RateLimit-Limit: 100
# X-RateLimit-Window: 60
# X-RateLimit-Policy: Per-endpoint limits apply
```

---

## Rate Limit Tiers

### Global Throttlers

| Throttler | TTL | Limit | Use Case |
|-----------|-----|-------|----------|
| **default** | 60s | 100 (prod) / 200 (dev) | Standard API endpoints |
| **short** | 10s | 20 | Burst protection |
| **long** | 1hr | 1000 | API quotas |

### Endpoint-Specific Limits

| Endpoint Category | Limit | TTL | Endpoints |
|-------------------|-------|-----|-----------|
| **STRICT** | 3 req/min | 60s | Password reset, forgot password |
| **AUTH** | 5 req/min | 60s | Login, register, register with invite |
| **MODERATE** | 10 req/min | 60s | Token refresh, email verification, 2FA setup |
| **STANDARD** | 100 req/min | 60s | CRUD operations, most API endpoints |
| **GENEROUS** | 200 req/min | 60s | Development environment |
| **READ_ONLY** | 300 req/min | 60s | Analytics, reporting endpoints |
| **PREMIUM** | 500 req/min | 60s | Enterprise/paid users (future) |

---

## Current Implementation

### Auth Endpoints

```typescript
// backend/src/auth/auth.controller.ts

// STRICT: Password reset endpoints
@Post('forgot-password')
@Throttle({ default: { limit: 3, ttl: 60000 } })
async forgotPassword() { ... }

@Post('reset-password')
@Throttle({ default: { limit: 3, ttl: 60000 } })
async resetPassword() { ... }

// AUTH: Login/Register endpoints
@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } })
async login() { ... }

@Post('register')
@Throttle({ default: { limit: 5, ttl: 60000 } })
async register() { ... }

// MODERATE: Token refresh
@Post('refresh')
@Throttle({ default: { limit: 10, ttl: 60000 } })
async refreshToken() { ... }
```

### Using Custom Decorators (NEW)

```typescript
import { RateLimit, RateLimitTiers } from './common/decorators/rate-limit.decorator';

// Apply predefined tier
@Post('forgot-password')
@RateLimit(RateLimitTiers.STRICT)
async forgotPassword() { ... }

// Custom configuration
@Get('analytics')
@RateLimit({ limit: 50, ttl: 60000, description: 'Analytics endpoint' })
async getAnalytics() { ... }
```

---

## Redis Storage

### Architecture

```
┌─────────────────────────────────────────────┐
│         Client Request                      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│     ThrottlerGuard (Global)                 │
│  - Checks rate limit before processing      │
│  - Generates key: endpoint:userId:ip        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│   RedisThrottlerStorage                     │
│  - Sliding window algorithm                 │
│  - Redis sorted sets (ZADD/ZCARD)           │
│  - Automatic cleanup of expired entries     │
│  - Fallback to in-memory if Redis offline   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│         Redis / In-Memory                   │
│  Production: Redis cluster                  │
│  Development: In-memory Map                 │
└─────────────────────────────────────────────┘
```

### Sliding Window Algorithm

The Redis storage uses **sorted sets** for accurate sliding window implementation:

```typescript
// 1. Remove expired entries
ZREMRANGEBYSCORE throttle:key 0 (now - ttl)

// 2. Add current request
ZADD throttle:key now "timestamp-random"

// 3. Count requests in window
ZCARD throttle:key

// 4. Compare with limit
if (totalHits > limit) {
  throw ThrottlerException
}
```

**Benefits:**
- **Accurate**: No boundary issues like fixed windows
- **Fair**: Distributes requests evenly
- **Efficient**: O(log N) complexity for most operations

### In-Memory Fallback

For development or Redis failures:

```typescript
// Automatic fallback
private inMemoryCache = new Map<string, { hits: number; expiresAt: number }>();

// Cleanup every 5 minutes
setInterval(() => this.cleanupInMemoryCache(), 5 * 60 * 1000);
```

**Note**: In-memory storage is not distributed, so each server instance has separate limits.

---

## Custom Rate Limits

### Using Predefined Tiers

```typescript
import { RateLimitTiers } from './common/decorators/rate-limit.decorator';

// Available tiers:
RateLimitTiers.STRICT     // 3 req/min
RateLimitTiers.AUTH       // 5 req/min
RateLimitTiers.MODERATE   // 10 req/min
RateLimitTiers.STANDARD   // 100 req/min
RateLimitTiers.GENEROUS   // 200 req/min
RateLimitTiers.READ_ONLY  // 300 req/min
RateLimitTiers.PREMIUM    // 500 req/min
```

### Creating Custom Limits

```typescript
import { RateLimit } from './common/decorators/rate-limit.decorator';

// Custom limit for specific endpoint
@Get('heavy-operation')
@RateLimit({
  limit: 10,           // 10 requests
  ttl: 300000,         // per 5 minutes (300,000 ms)
  description: 'Heavy operation limit'
})
async heavyOperation() { ... }
```

### Per-User Rate Limiting

The system automatically tracks rate limits per authenticated user:

```typescript
// Key format: throttlerName:user:userId:endpoint
// Example: default:user:123:POST:/api/companies

// Unauthenticated requests use IP:
// Example: default:ip:192.168.1.1:POST:/api/auth/login
```

---

## Monitoring

### Rate Limit Headers

All responses include informational headers:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Window: 60
X-RateLimit-Policy: Per-endpoint limits apply
```

### Logging

Rate limit events are logged automatically:

```bash
# Development: In-memory storage
📝 In-memory throttler storage (development mode)

# Production: Redis storage
🔴 Redis throttler storage initialized

# Rate limit exceeded (logged via Sentry in production)
[ERROR] ThrottlerException: Rate limit exceeded. Try again in 45 seconds.
```

### Metrics to Track

1. **Rate Limit Hits**: How often users hit limits
2. **429 Response Rate**: Percentage of requests rejected
3. **Per-Endpoint Analysis**: Which endpoints are most limited
4. **Per-User Analysis**: Power users hitting limits

**Integration with monitoring (Task #4 - already implemented):**

```typescript
// backend/src/common/global-exception.filter.ts
// All ThrottlerExceptions are automatically sent to Sentry
if (exception instanceof ThrottlerException) {
  this.sentryService.logException(exception, {
    level: 'warning',
    tags: { type: 'rate_limit' },
  });
}
```

---

## Best Practices

### 1. **Set Conservative Limits Initially**

```typescript
// Start strict, relax if needed
@Post('expensive-operation')
@RateLimit({ limit: 5, ttl: 60000 }) // 5/min initially
async expensiveOperation() { ... }

// Monitor usage, adjust if too restrictive
// @RateLimit({ limit: 10, ttl: 60000 }) // Relaxed to 10/min
```

### 2. **Differentiate Read vs Write**

```typescript
// Read endpoints: More generous
@Get('companies')
@RateLimit(RateLimitTiers.READ_ONLY) // 300/min
async listCompanies() { ... }

// Write endpoints: More restrictive
@Post('companies')
@RateLimit(RateLimitTiers.STANDARD) // 100/min
async createCompany() { ... }
```

### 3. **Protect Expensive Operations**

```typescript
// Database-heavy operations
@Post('export/all-data')
@RateLimit({ limit: 3, ttl: 3600000 }) // 3 per hour
async exportAllData() { ... }

// External API calls
@Post('send-bulk-email')
@RateLimit({ limit: 10, ttl: 3600000 }) // 10 per hour
async sendBulkEmail() { ... }
```

### 4. **Skip Rate Limiting for Internal Services**

```typescript
import { SkipThrottle } from '@nestjs/throttler';

// Health check endpoint - no rate limit
@Get('health')
@SkipThrottle()
async health() { ... }

// Internal service-to-service calls
@Get('internal/metrics')
@SkipThrottle()
async internalMetrics() { ... }
```

### 5. **Consider User Tiers**

```typescript
// Future enhancement: Premium users get higher limits
@Get('analytics')
@RateLimitTier('premium') // 500/min for premium, 100/min for standard
async getAnalytics(@Request() req) {
  const userTier = req.user.subscriptionTier; // 'free' | 'premium'
  // Tier-based limits can be implemented in future
}
```

---

## Troubleshooting

### Issue 1: Rate Limit Too Restrictive

**Symptoms:**
- Legitimate users frequently hitting 429 errors
- Frontend applications failing during normal usage

**Solutions:**

```typescript
// Option 1: Increase limit for specific endpoint
@Post('search')
@Throttle({ default: { limit: 200, ttl: 60000 } }) // Increased from 100

// Option 2: Use longer time window
@Post('search')
@Throttle({ default: { limit: 100, ttl: 120000 } }) // 100 per 2 minutes

// Option 3: Skip throttling (use cautiously)
@Post('search')
@SkipThrottle()
```

### Issue 2: Redis Connection Failures

**Symptoms:**
- Logs show: "Redis throttler error, falling back to in-memory"
- Rate limiting works but not consistent across servers

**Solutions:**

```bash
# 1. Check Redis connection
redis-cli -u $REDIS_URL ping
# Expected: PONG

# 2. Verify REDIS_URL environment variable
echo $REDIS_URL
# Expected: redis://localhost:6379 or redis://username:password@host:port

# 3. Check Redis logs
docker logs crm-redis-prod

# 4. Test Redis storage manually
curl http://localhost:3001/api/health
# Check logs for Redis initialization message
```

**Fallback behavior:**
- System automatically uses in-memory storage
- Rate limiting still works, but per-server instance
- Not suitable for multi-server production deployments

### Issue 3: Rate Limit Not Working

**Symptoms:**
- Can make unlimited requests without 429 errors
- No rate limit headers in responses

**Diagnostics:**

```bash
# 1. Check if ThrottlerGuard is enabled
# backend/src/app.module.ts should have:
providers: [
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
]

# 2. Check endpoint configuration
# Verify @Throttle decorator is present

# 3. Test with high request count
for i in {1..150}; do
  curl http://localhost:3001/api/auth/login \
    -X POST -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' &
done
# Should see 429 errors after limit exceeded
```

### Issue 4: Different Limits for Development vs Production

**Expected Behavior:**

```typescript
// app.module.ts
limit: configService.get('NODE_ENV') === 'production' ? 100 : 200

// Development: 200 req/min (for hot-reload)
// Production: 100 req/min (stricter)
```

**Override for testing:**

```bash
# Test production limits in development
NODE_ENV=production npm run start:dev

# Or set in .env
NODE_ENV=production
```

### Issue 5: Burst Traffic Causing 429 Errors

**Problem**: Short bursts exceed 1-minute limit even though average is low

**Solution**: Use multi-tier throttling (already implemented):

```typescript
// app.module.ts throttlers configuration
throttlers: [
  {
    name: 'default',
    ttl: 60000,        // 1 minute
    limit: 100,        // 100 requests
  },
  {
    name: 'short',
    ttl: 10000,        // 10 seconds
    limit: 20,         // 20 requests (burst protection)
  },
  {
    name: 'long',
    ttl: 3600000,      // 1 hour
    limit: 1000,       // 1000 requests total
  },
]
```

This allows:
- Max 20 req/10s (protects against sudden bursts)
- Max 100 req/min (standard limit)
- Max 1000 req/hour (prevents sustained abuse)

---

## Testing Rate Limits

### Manual Testing

```bash
# 1. Test auth endpoint (5 req/min)
./test-rate-limit-auth.sh

# 2. Test standard endpoint (100 req/min)
./test-rate-limit-api.sh

# 3. Test with authentication
TOKEN="your-jwt-token"
for i in {1..150}; do
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3001/api/companies
done
```

### Automated Testing

```typescript
// backend/test/rate-limit.e2e-spec.ts
describe('Rate Limiting (E2E)', () => {
  it('should enforce rate limit on login endpoint', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'wrong' })
      );
    }
    
    const results = await Promise.all(promises);
    const tooManyRequests = results.filter(r => r.status === 429);
    
    expect(tooManyRequests.length).toBeGreaterThan(0);
  });
});
```

---

## Future Enhancements

### 1. **User-Based Tiers**

```typescript
// Implement subscription-based rate limits
@Get('analytics')
async getAnalytics(@Request() req) {
  const user = req.user;
  const limit = user.subscriptionTier === 'premium' ? 500 : 100;
  // Dynamic rate limit based on user tier
}
```

### 2. **Rate Limit Reset API**

```typescript
// Admin endpoint to reset rate limits
@Post('admin/reset-rate-limit')
@Permissions('admin:manage_limits')
async resetRateLimit(@Body() body: { userId: string }) {
  await this.throttlerStorage.reset(`default:user:${body.userId}`);
}
```

### 3. **Rate Limit Dashboard**

- Real-time visualization of rate limit hits
- Per-user/endpoint analytics
- Automatic alerting when limits consistently hit

### 4. **Adaptive Rate Limiting**

- Automatically adjust limits based on server load
- Stricter limits during high traffic
- More generous during low traffic

---

## Summary

### ✅ What's Implemented

1. **Redis-based throttler storage** with sliding window algorithm
2. **Multi-tier throttling** (10s, 1min, 1hour windows)
3. **Per-endpoint configuration** via `@Throttle` decorator
4. **In-memory fallback** for development
5. **Rate limit headers** middleware for transparency
6. **Custom decorators** for easy configuration

### ✅ Security Benefits

- **Brute Force Protection**: Login attempts limited to 5/min
- **DoS Prevention**: Global 100 req/min limit prevents overwhelming server
- **API Abuse Prevention**: Expensive operations heavily rate limited
- **Fair Usage**: All users get equal access to API resources

### 📊 Monitoring Integration

- All rate limit exceptions logged via Sentry (Task #4)
- Winston logging for rate limit events
- Health check endpoint exempt from rate limiting

### 🔧 Configuration

```bash
# Environment variables (.env)
REDIS_URL=redis://localhost:6379  # Optional, falls back to in-memory
NODE_ENV=production               # Controls rate limit strictness
```

### 📖 Related Documentation

- [Monitoring Setup](./MONITORING_SETUP.md) - Sentry integration for rate limit tracking
- [Database Backup Strategy](./DATABASE_BACKUP_STRATEGY.md) - Disaster recovery
- [CI/CD Pipeline](./.github/workflows/README.md) - Automated testing and deployment

---

**Implementation Status**: ✅ **COMPLETE**

**Commit**: `feat: implement comprehensive API rate limiting with Redis storage, multi-tier throttling, and per-endpoint configuration`

**Next Recommended Task**: Task #7 - HTTPS & Security Headers (CRITICAL)
