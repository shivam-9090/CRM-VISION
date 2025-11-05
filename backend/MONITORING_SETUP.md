# Application Monitoring & Logging Setup

## Overview

Comprehensive monitoring and logging system implemented using Sentry for error tracking and Winston for structured logging.

## Features Implemented

### 1. **Sentry Error Tracking**
- ✅ Real-time error monitoring
- ✅ Performance transaction tracing
- ✅ Profiling integration
- ✅ User context tracking
- ✅ Breadcrumb logging for debugging
- ✅ Release tracking for deployments
- ✅ Environment-based sampling (10% prod, 100% dev)

### 2. **Winston Structured Logging**
- ✅ Multi-level logging (error, warn, info, debug, verbose)
- ✅ File-based logging in production (error.log, combined.log)
- ✅ Colored console output in development
- ✅ Automatic log rotation (5MB max, 5 files retained)
- ✅ Contextual logging with metadata

### 3. **Performance Monitoring**
- ✅ HTTP request/response tracking
- ✅ Database query performance monitoring
- ✅ Slow query alerts (>1 second)
- ✅ Slow request alerts (>3 seconds)
- ✅ Request duration tracking

### 4. **Error Tracking Filter**
- ✅ Global exception handling
- ✅ Automatic Sentry reporting for 5xx errors
- ✅ Sensitive data sanitization (headers, body)
- ✅ User context attachment
- ✅ Request context preservation

### 5. **Specialized Logging**
- ✅ HTTP request logging with duration
- ✅ Database query logging with performance
- ✅ Authentication event logging
- ✅ Business event logging (CRUD operations)
- ✅ Security event logging with severity levels

## Setup Instructions

### 1. **Sentry Configuration**

#### Create Sentry Project
1. Visit [https://sentry.io](https://sentry.io)
2. Create account or sign in
3. Create new project:
   - Platform: **Node.js**
   - Alert frequency: **On every new issue**
4. Copy the DSN (Data Source Name)

#### Configure Environment Variables

**Development (.env):**
```bash
SENTRY_DSN=""  # Leave empty to disable in development
SENTRY_ENABLE_DEV=false  # Set to 'true' to enable in dev
SENTRY_RELEASE="crm-backend@1.0.0"
HOSTNAME="dev-server"
```

**Production (Environment Variables):**
```bash
SENTRY_DSN="https://your-key@o123456.ingest.sentry.io/789012"
SENTRY_RELEASE="crm-backend@1.0.0"
HOSTNAME="prod-server-01"
NODE_ENV="production"
```

### 2. **Log File Management**

#### Log Directory Structure
```
backend/
├── logs/
│   ├── error.log        # Error-level logs only
│   ├── error.log.1      # Rotated error logs
│   ├── combined.log     # All logs
│   └── combined.log.1   # Rotated combined logs
```

#### Create Logs Directory
```bash
mkdir -p backend/logs
chmod 755 backend/logs
```

#### Log Rotation
- **Max file size**: 5 MB
- **Max files retained**: 5
- **Automatic rotation**: Enabled
- **Total storage**: ~50 MB (5 files × 2 types × 5 MB)

### 3. **GitHub Actions Integration**

The CI/CD pipeline already includes Sentry integration:

**In `.github/workflows/deploy.yml`:**
```yaml
- name: Track deployment in Sentry
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
    SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
  run: |
    # Notify Sentry of deployment
    curl -X POST https://sentry.io/api/0/organizations/$SENTRY_ORG/releases/ \
      -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"version": "${{ github.sha }}", "projects": ["'$SENTRY_PROJECT'"]}'
```

**Required GitHub Secrets:**
```bash
SENTRY_DSN                  # Your Sentry DSN
SENTRY_AUTH_TOKEN           # Sentry API token
SENTRY_ORG                  # Your Sentry organization slug
SENTRY_PROJECT              # Your Sentry project name
```

### 4. **Testing Monitoring Setup**

#### Test Error Tracking
```bash
# Test endpoint that throws an error
curl http://localhost:3001/api/test-error

# Check Sentry dashboard for error report
# Check logs/error.log for error entry
```

#### Test Performance Monitoring
```bash
# Make API requests and check logs
curl http://localhost:3001/api/health

# Check console for performance logs:
# [HTTP] GET /api/health 200 45ms
```

#### Test Slow Query Detection
```bash
# Intentionally slow query (for testing):
# Add SLEEP(2) to a query and execute
# Check Sentry for "Slow database query detected" message
```

## Usage Examples

### 1. **Using Logger Service**

```typescript
import { LoggerService } from './common/logger.service';

@Injectable()
export class YourService {
  constructor(private readonly logger: LoggerService) {}

  async someMethod() {
    // Basic logging
    this.logger.log('Operation started', 'YourService');
    this.logger.warn('Potential issue detected', 'YourService');
    this.logger.error('Critical error occurred', trace, 'YourService');

    // HTTP request logging (automatic via interceptor)
    // No manual logging needed

    // Database query logging
    const startTime = Date.now();
    const result = await this.prisma.user.findMany();
    const duration = Date.now() - startTime;
    this.logger.logQuery('SELECT * FROM users', duration, true);

    // Authentication logging
    this.logger.logAuth('User login', userId, true, { ip: '192.168.1.1' });

    // Business event logging
    this.logger.logBusinessEvent(
      'Deal Created',
      'Deal',
      dealId,
      userId,
      'CREATE',
    );

    // Security event logging
    this.logger.logSecurity(
      'Suspicious login attempt',
      'high',
      { ip: '1.2.3.4', attempts: 5 },
    );
  }
}
```

### 2. **Using Sentry Service Directly**

```typescript
import { SentryService } from './common/sentry.service';

@Injectable()
export class YourService {
  constructor(private readonly sentry: SentryService) {}

  async riskyOperation() {
    try {
      // Set user context
      this.sentry.setUser({
        id: user.id,
        email: user.email,
        companyId: user.companyId,
      });

      // Add breadcrumb
      this.sentry.addBreadcrumb({
        category: 'operation',
        message: 'Starting risky operation',
        level: 'info',
      });

      // Your operation
      await this.performOperation();

      // Clear user context on logout
      this.sentry.clearUser();
    } catch (error) {
      // Capture exception with context
      this.sentry.captureException(error, 'RiskyOperation', {
        operation: 'performOperation',
        userId: user.id,
      });
      throw error;
    }
  }
}
```

### 3. **Automatic Performance Tracking**

Performance tracking is **automatic** via the `PerformanceInterceptor`:

- ✅ Every HTTP request is tracked
- ✅ Duration calculated automatically
- ✅ Status code logged
- ✅ User ID attached if authenticated
- ✅ Slow requests (>3s) trigger Sentry alerts

**No manual code required!**

### 4. **Automatic Error Tracking**

Error tracking is **automatic** via the `ErrorTrackingFilter`:

- ✅ All exceptions caught globally
- ✅ 5xx errors sent to Sentry
- ✅ Sensitive data sanitized
- ✅ User context attached
- ✅ Request details logged

**No manual code required!**

## Monitoring Dashboard

### Sentry Dashboard Views

1. **Issues**
   - Real-time error stream
   - Error frequency trends
   - Stack traces with context
   - Affected user count

2. **Performance**
   - Transaction duration trends
   - Slow transaction detection
   - Database query performance
   - API endpoint performance

3. **Releases**
   - Deployment tracking
   - Error rate by release
   - Regression detection
   - Rollback recommendations

4. **Alerts**
   - Spike detection
   - Error threshold alerts
   - Performance degradation alerts
   - Custom alert rules

### Log Analysis

**Query logs for errors:**
```bash
# Last 100 errors
tail -100 logs/error.log

# Errors from specific service
grep "YourService" logs/error.log

# Errors with stack traces
grep -A 10 "Error:" logs/error.log
```

**Query logs for performance:**
```bash
# Slow requests (>1000ms)
grep "duration.*[0-9]\{4,\}ms" logs/combined.log

# Requests by endpoint
grep "GET /api/deals" logs/combined.log

# Authentication events
grep "Auth:" logs/combined.log
```

## Alert Configuration

### Sentry Alerts

1. **High Error Rate Alert**
   - Trigger: >10 errors per minute
   - Action: Slack notification + Email
   - Owner: Backend team

2. **New Error Type Alert**
   - Trigger: First occurrence of new error
   - Action: Slack notification
   - Owner: On-call engineer

3. **Performance Degradation Alert**
   - Trigger: P95 duration >3 seconds
   - Action: Email notification
   - Owner: DevOps team

### Configuration in Sentry:
1. Go to **Settings > Alerts**
2. Create **New Alert Rule**
3. Select conditions and actions
4. Set notification channels

## Production Deployment

### Pre-deployment Checklist

- [ ] Sentry DSN configured in production environment
- [ ] `SENTRY_RELEASE` matches deployment version
- [ ] Logs directory created with proper permissions
- [ ] Log rotation configured
- [ ] Sentry alerts configured
- [ ] Team notified about monitoring dashboard access

### Environment Variables (Production)

```bash
# Critical
SENTRY_DSN="https://your-key@o123456.ingest.sentry.io/789012"
SENTRY_RELEASE="crm-backend@1.0.0"
NODE_ENV="production"

# Optional
SENTRY_ENABLE_DEV=false
HOSTNAME="prod-server-01"
```

### Verify Monitoring After Deployment

```bash
# 1. Check Sentry connection
curl http://your-domain.com/api/test-error
# → Should appear in Sentry dashboard within 60 seconds

# 2. Check log files
ssh your-server
tail -f /path/to/backend/logs/combined.log
# → Should show request logs

# 3. Verify performance tracking
# Make API requests and check Sentry Performance tab
# → Should show transaction data
```

## Troubleshooting

### Issue: Errors not appearing in Sentry

**Solution:**
1. Check `SENTRY_DSN` is set correctly
2. Verify `NODE_ENV=production` (or `SENTRY_ENABLE_DEV=true` for dev)
3. Check network connectivity to Sentry
4. Look for Sentry initialization message in logs: `🔍 Sentry monitoring initialized`

### Issue: Log files not created

**Solution:**
1. Check `logs/` directory exists and has write permissions
2. Verify `NODE_ENV=production` (file logging only in production)
3. Check disk space: `df -h`

### Issue: Performance data not showing

**Solution:**
1. Verify `tracesSampleRate` is > 0 in `sentry.service.ts`
2. Check Sentry plan supports Performance Monitoring
3. Wait 5-10 minutes for data aggregation

### Issue: Slow query alerts not triggering

**Solution:**
1. Verify query duration >1000ms (1 second threshold)
2. Check Sentry message filters aren't blocking warnings
3. Ensure `logQuery()` is called after database operations

## Best Practices

1. **Use appropriate log levels:**
   - `error`: System errors, exceptions
   - `warn`: Potential issues, degraded performance
   - `info`: Important business events
   - `debug`: Detailed debugging information
   - `verbose`: Extremely detailed information

2. **Always include context:**
   ```typescript
   this.logger.log('User created', 'UserService'); // ✅ Good
   this.logger.log('User created'); // ❌ No context
   ```

3. **Sanitize sensitive data:**
   - Never log passwords, tokens, API keys
   - Use `[REDACTED]` for sensitive fields
   - ErrorTrackingFilter handles this automatically

4. **Set user context for better debugging:**
   ```typescript
   this.sentry.setUser({ id, email, companyId });
   ```

5. **Use breadcrumbs for debugging:**
   ```typescript
   this.sentry.addBreadcrumb({
     category: 'operation',
     message: 'Processing payment',
     level: 'info',
     data: { amount: 100, currency: 'USD' },
   });
   ```

6. **Monitor performance in critical paths:**
   ```typescript
   const start = Date.now();
   await criticalOperation();
   this.logger.logQuery('CRITICAL_OP', Date.now() - start, true);
   ```

## Maintenance

### Weekly Tasks
- [ ] Review Sentry error trends
- [ ] Check for new error types
- [ ] Analyze slow query reports
- [ ] Review log file sizes

### Monthly Tasks
- [ ] Review and update alert thresholds
- [ ] Archive old log files
- [ ] Update Sentry integration if new features available
- [ ] Team training on monitoring dashboard

### Quarterly Tasks
- [ ] Comprehensive performance review
- [ ] Optimization based on monitoring data
- [ ] Update monitoring documentation
- [ ] Disaster recovery drill using logs

---

## Support

For issues or questions:
1. Check this documentation
2. Review Sentry documentation: https://docs.sentry.io
3. Review Winston documentation: https://github.com/winstonjs/winston
4. Contact DevOps team

**Monitoring is critical for production stability - ensure proper setup before deployment!** ✅
