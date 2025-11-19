import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    this.client = new Redis(redisUrl, {
      retryStrategy(times) {
        // Stop retrying after 3 attempts
        if (times > 3) {
          console.log(
            '⚠️ Redis connection failed after 3 attempts. Caching disabled.',
          );
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 1, // Reduced from 3 to fail faster
      lazyConnect: true, // Don't fail if Redis is not available
      enableOfflineQueue: false, // Don't queue commands when offline
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected - caching enabled');
    });

    this.client.on('error', () => {
      // Only log once, not for every retry
      if (!this.client.status || this.client.status === 'connecting') {
        this.logger.warn('⚠️ Redis unavailable - caching disabled');
      }
    });

    this.client.on('close', () => {
      this.logger.log('🔴 Redis connection closed');
    });
  }

  async onModuleInit() {
    // Try to connect, but don't fail if it doesn't work
    try {
      await this.client.connect();
    } catch {
      this.logger.warn(
        '⚠️ Redis not available - application will run without caching',
      );
    }
  }

  getClient(): Redis {
    return this.client;
  }
}
