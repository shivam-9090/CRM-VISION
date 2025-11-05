import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

// Interface for throttler storage record (no longer exported from @nestjs/throttler)
interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Enhanced Redis-based throttler storage with support for:
 * - Per-user rate limiting (track by user ID)
 * - Per-IP rate limiting (track by IP address)
 * - Sliding window algorithm for accurate rate limiting
 * - Redis fallback to in-memory for development
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private redis: Redis | null = null;
  private prefix = 'throttle:';
  private readonly inMemoryCache = new Map<
    string,
    { hits: number; expiresAt: number }
  >();

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    // Initialize Redis only in production or if explicitly enabled
    if (redisUrl && this.configService.get('NODE_ENV') === 'production') {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });
      console.log('🔴 Redis throttler storage initialized');
    } else {
      console.log('📝 In-memory throttler storage (development mode)');
    }

    // Clean up in-memory cache every 5 minutes
    setInterval(() => this.cleanupInMemoryCache(), 5 * 60 * 1000);
  }

  /**
   * Increment the hit count for a given key using sliding window algorithm
   * @param key - The throttle key (includes IP, user ID, or endpoint)
   * @param ttl - Time to live in milliseconds
   */
  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    // Use Redis in production, fallback to in-memory otherwise
    if (this.redis && this.redis.status === 'ready') {
      return this.incrementRedis(key, ttl);
    } else {
      return this.incrementInMemory(key, ttl);
    }
  }

  /**
   * Redis-based increment using sorted sets for sliding window
   */
  private async incrementRedis(
    key: string,
    ttl: number,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = this.prefix + key;
    const now = Date.now();
    const windowStart = now - ttl;

    try {
      const multi = this.redis!.multi();

      // Remove expired entries (sliding window)
      multi.zremrangebyscore(redisKey, 0, windowStart);

      // Add current request with timestamp
      multi.zadd(redisKey, now, `${now}-${Math.random()}`);

      // Count requests in current window
      multi.zcard(redisKey);

      // Set expiry on the key
      multi.pexpire(redisKey, ttl);

      // Get TTL
      multi.pttl(redisKey);

      const results = await multi.exec();

      if (!results || results.length !== 5) {
        throw new Error('Redis throttler storage error');
      }

      // Extract totalHits from ZCARD result
      const totalHits = results[2][1] as number;
      const timeToExpire = results[4][1] as number;

      return {
        totalHits,
        timeToExpire: timeToExpire > 0 ? timeToExpire : ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch (error) {
      console.error('Redis throttler error, falling back to in-memory:', error);
      return this.incrementInMemory(key, ttl);
    }
  }

  /**
   * In-memory fallback for development or Redis failures
   */
  private incrementInMemory(key: string, ttl: number): ThrottlerStorageRecord {
    const now = Date.now();
    const existing = this.inMemoryCache.get(key);

    if (!existing || existing.expiresAt < now) {
      // New window
      this.inMemoryCache.set(key, {
        hits: 1,
        expiresAt: now + ttl,
      });

      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    // Increment existing
    existing.hits++;
    const timeToExpire = existing.expiresAt - now;

    return {
      totalHits: existing.hits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  /**
   * Clean up expired entries from in-memory cache
   */
  private cleanupInMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.inMemoryCache.entries()) {
      if (value.expiresAt < now) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  /**
   * Get current hit count for a key without incrementing
   */
  async getHitCount(key: string): Promise<number> {
    if (this.redis && this.redis.status === 'ready') {
      const redisKey = this.prefix + key;
      const count = await this.redis.zcard(redisKey);
      return count || 0;
    } else {
      const existing = this.inMemoryCache.get(key);
      return existing && existing.expiresAt > Date.now() ? existing.hits : 0;
    }
  }

  /**
   * Reset rate limit for a specific key (useful for testing or admin override)
   */
  async reset(key: string): Promise<void> {
    if (this.redis && this.redis.status === 'ready') {
      const redisKey = this.prefix + key;
      await this.redis.del(redisKey);
    } else {
      this.inMemoryCache.delete(key);
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
    this.inMemoryCache.clear();
  }
}
