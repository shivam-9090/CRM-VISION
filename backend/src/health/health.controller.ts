import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../redis/cache.service';
import { ApiPublicEndpoint } from '../common/swagger/swagger-decorators';

@ApiTags('Health')
@Controller('health')
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
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      const dbResponseTime = Date.now() - startTime;
      const poolStats = this.prisma.getPoolStats();

      // Check Redis cache
      const cacheInfo = await this.cache.getInfo();

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
          stats: cacheInfo.stats,
          hitRatio: `${(cacheInfo.hitRatio * 100).toFixed(2)}%`,
          redis: cacheInfo.info || null,
        },
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}
