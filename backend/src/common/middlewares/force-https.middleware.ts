import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Force HTTPS Middleware
 *
 * Redirects all HTTP requests to HTTPS in production environment.
 * This ensures all traffic is encrypted and secure.
 *
 * NOTE: This middleware should only be enabled in production.
 * In development/staging, HTTP is typically used for local testing.
 */
@Injectable()
export class ForceHttpsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Only enforce HTTPS in production
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    // Check if the request is already HTTPS
    const isHttps =
      req.secure || // Standard Express check
      req.headers['x-forwarded-proto'] === 'https' || // Behind a proxy/load balancer
      req.headers['x-forwarded-ssl'] === 'on'; // Some proxies use this

    if (!isHttps) {
      // Construct HTTPS URL
      const httpsUrl = `https://${req.headers.host}${req.url}`;

      // 301 Permanent Redirect to HTTPS
      return res.redirect(301, httpsUrl);
    }

    // Request is already HTTPS, continue
    next();
  }
}
