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

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private redis: Redis | null = null;
  private prefix = 'throttle:';

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl && this.configService.get('NODE_ENV') === 'production') {
      this.redis = new Redis(redisUrl);
      console.log('🔴 Redis throttler storage initialized');
    }
  }

  async increment(
    key: string,
    ttl: number,
  ): Promise<ThrottlerStorageRecord> {
    // Fallback to in-memory if Redis not available
    if (!this.redis) {
      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    const redisKey = this.prefix + key;
    const multi = this.redis.multi();

    multi.incr(redisKey);
    multi.pttl(redisKey);

    const results = await multi.exec();

    if (!results || results.length !== 2) {
      throw new Error('Redis throttler storage error');
    }

    const [[, totalHits], [, timeToExpire]] = results as [
      [null, number],
      [null, number],
    ];

    // Set TTL if key is new
    if (timeToExpire === -1) {
      await this.redis.pexpire(redisKey, ttl);
      return {
        totalHits,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    return {
      totalHits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
