import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisUrl =
          configService.get('REDIS_URL') || 'redis://localhost:6379';

        const redis = new Redis(redisUrl, {
          retryStrategy(times) {
            // Stop retrying after 3 attempts
            if (times > 3) {
              console.log('⚠️ Redis connection failed after 3 attempts. Caching disabled.');
              return null; // Stop retrying
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 1, // Reduced from 3 to fail faster
          lazyConnect: true, // Don't fail if Redis is not available
          enableOfflineQueue: false, // Don't queue commands when offline
        });

        redis.on('connect', () => {
          console.log('✅ Redis connected - caching enabled');
        });

        redis.on('error', (err) => {
          // Only log once, not for every retry
          if (!redis.status || redis.status === 'connecting') {
            console.log('⚠️ Redis unavailable - caching disabled');
          }
        });

        redis.on('close', () => {
          console.log('🔴 Redis connection closed');
        });

        // Try to connect, but don't fail if it doesn't work
        redis.connect().catch(() => {
          console.log('⚠️ Redis not available - application will run without caching');
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
