import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { SentryService } from './sentry.service';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(private readonly sentryService: SentryService) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(
        ({ timestamp, level, message, context, ...meta }) => {
          let msg = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        },
      ),
    );

    // Create transports
    const transports: winston.transport[] = [
      // Console output
      new winston.transports.Console({
        format: isProduction ? logFormat : consoleFormat,
        level: isProduction ? 'info' : 'debug',
      }),
    ];

    // File transports for production
    if (isProduction) {
      transports.push(
        // Error logs
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // Combined logs
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: isProduction ? 'info' : 'debug',
      format: logFormat,
      transports,
      exitOnError: false,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
    this.sentryService.addBreadcrumb({
      category: 'log',
      message,
      level: 'info',
      data: { context },
    });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });

    // Send to Sentry
    if (trace) {
      this.sentryService.captureException(new Error(message), context, {
        stack: trace,
      });
    } else {
      this.sentryService.captureMessage(message, 'error', { context });
    }
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
    this.sentryService.captureMessage(message, 'warning', { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
    this.sentryService.addBreadcrumb({
      category: 'debug',
      message,
      level: 'debug',
      data: { context },
    });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  /**
   * Log HTTP request
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
  ) {
    const level =
      statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.logger.log(level, `${method} ${url} ${statusCode} ${duration}ms`, {
      context: 'HTTP',
      method,
      url,
      statusCode,
      duration,
      userId,
    });

    // Send to Sentry for performance tracking
    this.sentryService.captureHttpRequest(method, url, statusCode, duration);
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, success: boolean) {
    const level = success ? 'debug' : 'error';
    this.logger.log(level, `Database query: ${query.substring(0, 100)}...`, {
      context: 'Database',
      query,
      duration,
      success,
    });

    // Send to Sentry
    this.sentryService.captureQuery(query, duration, success);
  }

  /**
   * Log authentication event
   */
  logAuth(
    event: string,
    userId?: string,
    success: boolean = true,
    details?: Record<string, any>,
  ) {
    const level = success ? 'info' : 'warn';
    this.logger.log(level, `Auth: ${event}`, {
      context: 'Authentication',
      event,
      userId,
      success,
      ...details,
    });

    this.sentryService.addBreadcrumb({
      category: 'auth',
      message: event,
      level: success ? 'info' : 'warning',
      data: { userId, success, ...details },
    });
  }

  /**
   * Log business event
   */
  logBusinessEvent(
    event: string,
    entityType: string,
    entityId: string,
    userId: string,
    action: string,
  ) {
    this.logger.info(`Business: ${action} ${entityType}`, {
      context: 'Business',
      event,
      entityType,
      entityId,
      userId,
      action,
    });

    this.sentryService.addBreadcrumb({
      category: 'business',
      message: `${action} ${entityType}`,
      level: 'info',
      data: { event, entityType, entityId, userId, action },
    });
  }

  /**
   * Log security event
   */
  logSecurity(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
  ) {
    const level =
      severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this.logger.log(level, `Security: ${event}`, {
      context: 'Security',
      event,
      severity,
      ...details,
    });

    // Always send security events to Sentry
    const sentryLevel =
      severity === 'critical'
        ? 'fatal'
        : severity === 'high'
          ? 'error'
          : 'warning';
    this.sentryService.captureMessage(`Security Event: ${event}`, sentryLevel, {
      severity,
      ...details,
    });
  }
}
