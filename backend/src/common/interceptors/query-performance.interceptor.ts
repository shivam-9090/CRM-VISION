import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Query Performance Interceptor
 * 
 * Monitors API endpoint performance and logs slow queries.
 * Helps identify performance bottlenecks and optimization opportunities.
 */
@Injectable()
export class QueryPerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('QueryPerformance');
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly VERY_SLOW_QUERY_THRESHOLD = 3000; // 3 seconds

  // In-memory metrics storage (replace with Redis in production)
  private static metrics = {
    totalRequests: 0,
    slowQueries: 0,
    averageResponseTime: 0,
    requestTimes: [] as number[],
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          this.trackMetrics(responseTime);

          // Log slow queries
          if (responseTime > this.VERY_SLOW_QUERY_THRESHOLD) {
            this.logger.error(
              `🐌 VERY SLOW QUERY: ${method} ${url} - ${responseTime}ms`,
            );
          } else if (responseTime > this.SLOW_QUERY_THRESHOLD) {
            this.logger.warn(
              `⚠️  SLOW QUERY: ${method} ${url} - ${responseTime}ms`,
            );
          }

          // Log all queries in development with timing
          if (process.env.NODE_ENV === 'development') {
            this.logger.debug(`${method} ${url} - ${responseTime}ms`);
          }
        },
        error: () => {
          const responseTime = Date.now() - startTime;
          this.logger.error(
            `❌ ERROR: ${method} ${url} - Failed after ${responseTime}ms`,
          );
        },
      }),
    );
  }

  /**
   * Track performance metrics
   */
  private trackMetrics(responseTime: number): void {
    const metrics = QueryPerformanceInterceptor.metrics;

    metrics.totalRequests++;
    metrics.requestTimes.push(responseTime);

    // Keep only last 1000 requests in memory
    if (metrics.requestTimes.length > 1000) {
      metrics.requestTimes.shift();
    }

    // Update average
    metrics.averageResponseTime =
      metrics.requestTimes.reduce((sum, time) => sum + time, 0) /
      metrics.requestTimes.length;

    // Count slow queries
    if (responseTime > this.SLOW_QUERY_THRESHOLD) {
      metrics.slowQueries++;
    }
  }

  /**
   * Get current metrics (used by health check endpoint)
   */
  static getMetrics() {
    const metrics = QueryPerformanceInterceptor.metrics;
    const times = metrics.requestTimes;

    // Calculate percentiles
    const sortedTimes = [...times].sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

    return {
      totalRequests: metrics.totalRequests,
      slowQueries: metrics.slowQueries,
      slowQueryPercentage: metrics.totalRequests
        ? ((metrics.slowQueries / metrics.totalRequests) * 100).toFixed(2)
        : '0.00',
      averageResponseTime: Math.round(metrics.averageResponseTime),
      p50ResponseTime: Math.round(p50),
      p95ResponseTime: Math.round(p95),
      p99ResponseTime: Math.round(p99),
      sampleSize: times.length,
    };
  }

  /**
   * Reset metrics (for testing or after deployment)
   */
  static resetMetrics(): void {
    QueryPerformanceInterceptor.metrics = {
      totalRequests: 0,
      slowQueries: 0,
      averageResponseTime: 0,
      requestTimes: [],
    };
  }
}
