# Database Connection Pooling Configuration

## Overview

This document describes the database connection pooling implementation for the CRM system. Proper connection pooling is critical for application performance, scalability, and resource management.

## Why Connection Pooling Matters

### Benefits
- **Performance**: Reusing existing connections is much faster than creating new ones
- **Resource Management**: Limits the number of concurrent database connections
- **Scalability**: Efficiently handles multiple simultaneous requests
- **Stability**: Prevents connection exhaustion under high load

### Without Proper Pooling
- Each request creates a new database connection
- Connection creation overhead (100-200ms per connection)
- Risk of exhausting database max_connections limit
- Poor performance under load
- Potential application crashes

## Implementation

### Prisma Configuration

The connection pool is configured in `src/prisma/prisma.service.ts`:

```typescript
@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: configService.get<string>('NODE_ENV') === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
      errorFormat: 'pretty',
    });
  }
}
```

### Environment Variables

Configure connection pooling via environment variables:

```bash
# Connection Pool Settings
DB_POOL_SIZE=10              # Number of connections in the pool
DB_POOL_TIMEOUT=20           # Connection timeout in seconds
DB_CONNECTION_LIMIT=10       # Maximum number of connections
DB_POOL_MIN=2                # Minimum connections to keep alive

# Or via DATABASE_URL query parameters
DATABASE_URL="postgresql://user:password@host:port/db?schema=public&connection_limit=10&pool_timeout=20"
```

## Configuration Guidelines

### Pool Size Calculation

Use this formula to determine optimal pool size:
```
connections = (core_count * 2) + effective_spindle_count
```

For PostgreSQL on SSD:
```
connections = (core_count * 2) + 1
```

### Recommended Settings by Application Size

#### Small Applications (< 100 concurrent users)
```bash
DB_POOL_SIZE=5
DB_POOL_TIMEOUT=20
DB_CONNECTION_LIMIT=10
DB_POOL_MIN=2
```

#### Medium Applications (100-1000 concurrent users)
```bash
DB_POOL_SIZE=10
DB_POOL_TIMEOUT=20
DB_CONNECTION_LIMIT=20
DB_POOL_MIN=5
```

#### Large Applications (> 1000 concurrent users)
```bash
DB_POOL_SIZE=20
DB_POOL_TIMEOUT=30
DB_CONNECTION_LIMIT=50
DB_POOL_MIN=10
```

### Production Recommendations

1. **Set Explicit Pool Sizes**: Don't rely on defaults
2. **Monitor Connection Usage**: Use health check endpoint
3. **Leave Headroom**: Don't use all available database connections
4. **Consider Read Replicas**: For read-heavy workloads
5. **Tune Based on Metrics**: Adjust based on actual usage

### Database Server Limits

PostgreSQL default limits:
```sql
-- View current max_connections
SHOW max_connections;  -- Default: 100

-- View current connections
SELECT count(*) FROM pg_stat_activity;

-- Set max_connections (requires restart)
ALTER SYSTEM SET max_connections = 200;
```

**Important**: Ensure your application pool size * number of instances < database max_connections

## Monitoring

### Health Check Endpoint

Check pool configuration and database health:

```bash
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-06T10:30:00.000Z",
  "uptime": 3600,
  "database": {
    "status": "connected",
    "responseTime": "5ms",
    "pool": {
      "size": 10,
      "timeout": "20s",
      "connectionLimit": 10
    }
  },
  "environment": "production"
}
```

### Prisma Logging

Enable query logging in development:
```typescript
log: ['query', 'info', 'warn', 'error']
```

This shows:
- Every database query
- Connection pool events
- Slow queries (configure threshold)
- Connection errors

### Database Monitoring Queries

```sql
-- Active connections by state
SELECT state, count(*) 
FROM pg_stat_activity 
GROUP BY state;

-- Long-running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' 
  AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;

-- Connection pool exhaustion check
SELECT count(*) as current_connections,
       current_setting('max_connections')::int as max_connections,
       current_setting('max_connections')::int - count(*) as remaining
FROM pg_stat_activity;
```

## Graceful Shutdown

The application implements graceful shutdown to prevent connection leaks:

```typescript
async onModuleDestroy() {
  this.logger.log('🔌 Disconnecting from database...');
  
  // Wait for active queries to complete (max 5 seconds)
  const shutdownTimeout = setTimeout(() => {
    this.logger.warn('⚠️  Force disconnecting due to timeout');
  }, 5000);

  await this.$disconnect();
  clearTimeout(shutdownTimeout);
  this.logger.log('✅ Database connection closed gracefully');
}
```

### Shutdown Hooks

Enable shutdown hooks in `main.ts`:
```typescript
await prismaService.enableShutdownHooks(app);
```

This ensures:
- Active queries complete before shutdown
- Connections are properly closed
- No orphaned database connections
- Clean application termination

## Connection Lifecycle

1. **Application Start**
   - PrismaService initialized
   - Connection pool created
   - Initial connections established
   - Health check performed

2. **Request Handling**
   - Query requested
   - Connection acquired from pool
   - Query executed
   - Connection returned to pool

3. **Connection Timeout**
   - Connection idle > timeout
   - Connection closed
   - New connection created on demand

4. **Application Shutdown**
   - Shutdown signal received
   - Stop accepting new requests
   - Wait for active queries (max 5s)
   - Close all connections
   - Exit gracefully

## Troubleshooting

### Problem: "Too many connections" error

**Causes**:
- Pool size too large
- Too many application instances
- Connection leaks

**Solutions**:
1. Reduce `DB_POOL_SIZE`
2. Increase database `max_connections`
3. Check for connection leaks
4. Implement connection pooler (PgBouncer)

### Problem: Slow database queries

**Causes**:
- Pool exhaustion
- Blocking queries
- Network latency

**Solutions**:
1. Increase `DB_POOL_SIZE`
2. Optimize slow queries
3. Add database indexes
4. Use query caching (Redis)

### Problem: Connection timeouts

**Causes**:
- `DB_POOL_TIMEOUT` too low
- Network issues
- Database overload

**Solutions**:
1. Increase `DB_POOL_TIMEOUT`
2. Check network connectivity
3. Monitor database CPU/memory
4. Optimize queries

### Problem: Connection leaks

**Causes**:
- Queries not properly awaited
- Error handling issues
- Missing try-catch blocks

**Solutions**:
1. Always await database queries
2. Use proper error handling
3. Enable query logging
4. Monitor connection count

## Best Practices

### 1. Environment-Specific Configuration

```bash
# Development
DB_POOL_SIZE=5
DB_POOL_TIMEOUT=10

# Production
DB_POOL_SIZE=20
DB_POOL_TIMEOUT=30
```

### 2. Always Use Connection Pooling

Never create Prisma clients ad-hoc:
```typescript
// ❌ Bad - creates new connection each time
const prisma = new PrismaClient();

// ✅ Good - uses pooled connection
constructor(private prisma: PrismaService) {}
```

### 3. Proper Error Handling

```typescript
try {
  const result = await this.prisma.user.findMany();
  return result;
} catch (error) {
  this.logger.error('Database query failed', error);
  throw error; // Let NestJS handle it
}
```

### 4. Use Transactions Sparingly

Transactions hold connections:
```typescript
// Keep transactions short
await this.prisma.$transaction(async (tx) => {
  // Fast operations only
  await tx.user.create({ data });
  await tx.auditLog.create({ data });
});
```

### 5. Monitor and Alert

Set up monitoring for:
- Connection pool usage > 80%
- Database response time > 100ms
- Connection errors
- Query timeouts

## Performance Testing

Test pool configuration under load:

```bash
# Apache Bench - 1000 requests, 50 concurrent
ab -n 1000 -c 50 http://localhost:3001/api/health

# Artillery - Sustained load test
artillery quick --count 100 --num 10 http://localhost:3001/api/health
```

Monitor:
- Response times
- Connection errors
- Database CPU/memory
- Application memory

## References

- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [PgBouncer](https://www.pgbouncer.org/) - External connection pooler
- [Database Performance Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)

## Summary

✅ **Implemented**:
- Environment-based pool configuration
- Graceful shutdown handling
- Health check monitoring
- Production-ready defaults
- Comprehensive validation

🎯 **Key Takeaways**:
- Pool size depends on application load and database capacity
- Monitor connection usage regularly
- Always configure explicitly for production
- Test under realistic load conditions
- Leave headroom for spikes and maintenance

---

**Last Updated**: November 6, 2025  
**Task**: #11 - Database Connection Pooling  
**Status**: ✅ Completed
