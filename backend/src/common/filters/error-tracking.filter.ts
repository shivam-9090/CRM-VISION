import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger.service';
import { SentryService } from '../sentry.service';

@Catch()
export class ErrorTrackingFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly sentry: SentryService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error:
        exception instanceof HttpException
          ? exception.getResponse()
          : 'Internal Server Error',
    };

    // Log error with context
    this.logger.error(
      `${request.method} ${request.url} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      'ErrorTracking',
    );

    // Send to Sentry for tracking
    if (status >= 500) {
      // Only send 5xx errors to Sentry
      const user = (request as any).user;
      if (user) {
        this.sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.username,
          companyId: user.companyId,
        });
      }

      this.sentry.setContext('request', {
        method: request.method,
        url: request.url,
        headers: this.sanitizeHeaders(request.headers),
        query: request.query,
        params: request.params,
        body: this.sanitizeBody(request.body),
      });

      this.sentry.captureException(
        exception instanceof Error ? exception : new Error(message),
        'ErrorTracking',
        {
          statusCode: status,
          path: request.url,
          method: request.method,
        },
      );
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Remove sensitive headers before sending to Sentry
   */
  private sanitizeHeaders(headers: any): Record<string, any> {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Remove sensitive data from request body before sending to Sentry
   */
  private sanitizeBody(body: any): Record<string, any> {
    if (!body || typeof body !== 'object') {
      return {};
    }

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'refreshToken',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
