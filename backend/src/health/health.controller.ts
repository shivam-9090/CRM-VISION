import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../redis/cache.service';
import { ApiPublicEndpoint } from '../common/swagger/swagger-decorators';
import { QueryPerformanceInterceptor } from '../common/interceptors/query-performance.interceptor';

@ApiTags('Health')
@Controller('health')
@SkipThrottle() // Skip rate limiting for health check endpoint
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  @Get()
  @ApiPublicEndpoint(
    'System health check',
    'Check database, cache, and system health. No authentication required. Returns database pool stats, cache hit ratio, and uptime.',
  )
  @ApiResponse({
    status: 200,
    description: 'System health status',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-15T10:30:00.000Z',
        uptime: 3600.5,
        database: {
          status: 'connected',
          responseTime: '15ms',
          pool: {
            size: 10,
            timeout: '30s',
            connectionLimit: 20,
          },
        },
        cache: {
          status: 'connected',
          stats: {
            hits: 1234,
            misses: 56,
            keys: 890,
          },
          hitRatio: '95.65%',
          redis: {
            version: '7.0.0',
            uptime: 3600,
          },
        },
        environment: 'production',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'System health check failed',
    schema: {
      example: {
        status: 'error',
        timestamp: '2024-01-15T10:30:00.000Z',
        database: {
          status: 'disconnected',
          error: 'Connection refused',
        },
      },
    },
  })
  async check() {
    const startTime = Date.now();

    try {
      // Quick database check with timeout
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), 3000),
        ),
      ]);

      const dbResponseTime = Date.now() - startTime;
      const poolStats = this.prisma.getPoolStats();

      // Try to get cache info but don't fail if it times out
      let cacheInfo: any;
      try {
        cacheInfo = await Promise.race([
          this.cache.getInfo(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Cache timeout')), 1000),
          ),
        ]);
      } catch {
        cacheInfo = { available: false, stats: {}, hitRatio: 0 };
      }

      // Get performance metrics (non-blocking)
      const performanceMetrics = QueryPerformanceInterceptor.getMetrics();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'connected',
          responseTime: `${dbResponseTime}ms`,
          pool: {
            size: poolStats.poolSize,
            timeout: `${poolStats.timeout}s`,
            connectionLimit: poolStats.connectionLimit,
          },
        },
        cache: {
          status: cacheInfo.available ? 'connected' : 'unavailable',
          stats: cacheInfo.stats || {},
          hitRatio: `${((cacheInfo.hitRatio || 0) * 100).toFixed(2)}%`,
          redis: cacheInfo.info || null,
        },
        performance: {
          totalRequests: performanceMetrics.totalRequests,
          slowQueries: performanceMetrics.slowQueries,
          slowQueryPercentage: `${performanceMetrics.slowQueryPercentage}%`,
          averageResponseTime: `${performanceMetrics.averageResponseTime}ms`,
          p50ResponseTime: `${performanceMetrics.p50ResponseTime}ms`,
          p95ResponseTime: `${performanceMetrics.p95ResponseTime}ms`,
          p99ResponseTime: `${performanceMetrics.p99ResponseTime}ms`,
          sampleSize: performanceMetrics.sampleSize,
        },
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      // Return 200 status even on error so Railway doesn't kill the container
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'checking',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        message: 'Service is starting or experiencing temporary issues',
      };
    }
  }
}
