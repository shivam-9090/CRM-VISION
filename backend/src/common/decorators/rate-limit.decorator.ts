import { SetMetadata } from '@nestjs/common';

/**
 * Rate limit configuration metadata key
 */
export const RATE_LIMIT_KEY = 'rateLimit';

/**
 * Rate limit tier metadata key for user-based limits
 */
export const RATE_LIMIT_TIER_KEY = 'rateLimitTier';

/**
 * Interface for rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests allowed */
  limit: number;
  /** Time window in milliseconds */
  ttl: number;
  /** Optional description */
  description?: string;
}

/**
 * Predefined rate limit tiers for common scenarios
 */
export const RateLimitTiers = {
  /** Very strict: 3 requests per minute (password reset, forgot password) */
  STRICT: { limit: 3, ttl: 60000, description: 'Strict (3/min)' },
  
  /** Auth endpoints: 5 requests per minute (login, register) */
  AUTH: { limit: 5, ttl: 60000, description: 'Auth (5/min)' },
  
  /** Moderate: 10 requests per minute (token refresh, verification) */
  MODERATE: { limit: 10, ttl: 60000, description: 'Moderate (10/min)' },
  
  /** Standard API: 100 requests per minute (default for authenticated endpoints) */
  STANDARD: { limit: 100, ttl: 60000, description: 'Standard (100/min)' },
  
  /** Generous: 200 requests per minute (development/hot-reload) */
  GENEROUS: { limit: 200, ttl: 60000, description: 'Generous (200/min)' },
  
  /** Read-only: 300 requests per minute (GET endpoints, analytics) */
  READ_ONLY: { limit: 300, ttl: 60000, description: 'Read-only (300/min)' },
  
  /** Premium tier: 500 requests per minute (paid users, enterprise) */
  PREMIUM: { limit: 500, ttl: 60000, description: 'Premium (500/min)' },
};

/**
 * Decorator to set custom rate limit for an endpoint
 * @param config - Rate limit configuration
 * @example
 * ```
 * @RateLimit(RateLimitTiers.STRICT)
 * @Post('forgot-password')
 * async forgotPassword() { ... }
 * ```
 */
export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_KEY, config);

/**
 * Decorator to set rate limit tier based on user subscription/role
 * @param tierKey - Tier identifier
 * @example
 * ```
 * @RateLimitTier('premium')
 * @Get('analytics')
 * async getAnalytics() { ... }
 * ```
 */
export const RateLimitTier = (tierKey: string) =>
  SetMetadata(RATE_LIMIT_TIER_KEY, tierKey);
