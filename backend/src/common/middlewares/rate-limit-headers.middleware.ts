import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to add rate limit headers to all responses
 * Provides transparency to clients about their rate limit status
 *
 * Headers added:
 * - X-RateLimit-Limit: Maximum requests allowed in the time window
 * - X-RateLimit-Window: Time window in seconds
 * - X-Rate-Limit-Policy: Description of the rate limiting policy
 */
@Injectable()
export class RateLimitHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Set default rate limit information headers
    // These are informational and don't affect actual throttling
    res.setHeader('X-RateLimit-Policy', 'Per-endpoint limits apply');
    res.setHeader('X-RateLimit-Window', '60'); // 60 seconds

    // Add security header to prevent rate limit info disclosure
    res.setHeader('X-Content-Type-Options', 'nosniff');

    next();
  }
}
