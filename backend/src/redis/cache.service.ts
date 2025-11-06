import { Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { RedisService } from './redis.service';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  compress?: boolean; // Compress large values
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  // Default TTL values in seconds
  private readonly DEFAULT_TTL = {
    SHORT: 300, // 5 minutes - frequently changing data
    MEDIUM: 1800, // 30 minutes - moderate change rate
    LONG: 3600, // 1 hour - rarely changing data
    DAY: 86400, // 24 hours - static/reference data
  };

  constructor(private redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.redis.get(fullKey);

      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return JSON.parse(value) as T;
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null; // Fail gracefully
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const serialized = JSON.stringify(value);
      const ttl = options?.ttl || this.DEFAULT_TTL.MEDIUM;

      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serialized);
      } else {
        await this.redis.set(fullKey, serialized);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`Cache set error for key ${key}:`, error);
      return false; // Fail gracefully
    }
  }

  /**
   * Delete a specific key or pattern
   */
  async delete(keyOrPattern: string, options?: CacheOptions): Promise<number> {
    try {
      const fullKey = this.buildKey(keyOrPattern, options?.prefix);

      // Check if it's a pattern (contains *)
      if (fullKey.includes('*')) {
        const keys = await this.redis.keys(fullKey);
        if (keys.length === 0) return 0;

        const deleted = await this.redis.del(...keys);
        this.stats.deletes += deleted;
        return deleted;
      }

      const deleted = await this.redis.del(fullKey);
      this.stats.deletes += deleted;
      return deleted;
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`Cache delete error for key ${keyOrPattern}:`, error);
      return 0;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string, prefix?: string): Promise<number> {
    return this.delete(pattern, { prefix });
  }

  /**
   * Check if a key exists
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Execute fetcher function
    try {
      const fresh = await fetcher();
      // Cache the result
      await this.set(key, fresh, options);
      return fresh;
    } catch (error) {
      this.logger.error(`Fetcher function error for key ${key}:`, error);
      throw error; // Propagate fetcher errors
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, by: number = 1, prefix?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key, prefix);
      return await this.redis.incrby(fullKey, by);
    } catch (error) {
      this.logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement a counter
   */
  async decrement(key: string, by: number = 1, prefix?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key, prefix);
      return await this.redis.decrby(fullKey, by);
    } catch (error) {
      this.logger.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set with expiration time
   */
  async setWithExpiry(
    key: string,
    value: any,
    seconds: number,
    prefix?: string,
  ): Promise<boolean> {
    return this.set(key, value, { ttl: seconds, prefix });
  }

  /**
   * Get remaining TTL for a key
   */
  async getTTL(key: string, prefix?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key, prefix);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      this.logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clear(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      this.logger.warn('🗑️  All cache cleared!');
      return true;
    } catch (error) {
      this.logger.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit ratio
   */
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return this.stats.hits / total;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  /**
   * Check if Redis is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get Redis info
   */
  async getInfo(): Promise<any> {
    try {
      const info = await this.redis.info();
      const available = await this.isAvailable();
      return {
        available,
        stats: this.getStats(),
        hitRatio: this.getHitRatio(),
        info: this.parseRedisInfo(info),
      };
    } catch (error) {
      return {
        available: false,
        stats: this.getStats(),
        hitRatio: this.getHitRatio(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string, prefix?: string): string {
    if (prefix) {
      return `${prefix}:${key}`;
    }
    return key;
  }

  /**
   * Parse Redis INFO output
   */
  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const parsed: any = {};

    lines.forEach((line) => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          parsed[key] = value;
        }
      }
    });

    return {
      version: parsed.redis_version,
      uptime: parsed.uptime_in_seconds,
      connected_clients: parsed.connected_clients,
      used_memory: parsed.used_memory_human,
      total_commands_processed: parsed.total_commands_processed,
    };
  }

  /**
   * Get default TTL constants
   */
  getTTLConstants() {
    return { ...this.DEFAULT_TTL };
  }
}
