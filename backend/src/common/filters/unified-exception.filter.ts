import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SentryService } from '../sentry.service';
import { ErrorResponse, BaseException, ErrorCode } from '../exceptions';
import { Prisma } from '@prisma/client';
import { ThrottlerException } from '@nestjs/throttler';

/**
 * Unified exception filter that handles all exceptions with standardized responses
 * Supports custom exceptions, HTTP exceptions, Prisma errors, and unknown errors
 */
@Injectable()
@Catch()
export class UnifiedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnifiedExceptionFilter.name);

  constructor(private readonly sentryService?: SentryService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log error with appropriate level
    this.logError(exception, errorResponse, request);

    // Send critical errors to Sentry
    if (errorResponse.error.statusCode >= 500) {
      this.captureInSentry(exception, request, errorResponse);
    }

    response.status(errorResponse.error.statusCode).json(errorResponse);
  }

  /**
   * Build standardized error response from any exception type
   */
  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const traceId = this.generateTraceId();

    // Custom BaseException with error codes
    if (exception instanceof BaseException) {
      const response = exception.getResponse() as any;
      return {
        success: false,
        error: {
          ...response.error,
          path,
          traceId,
        },
      };
    }

    // Throttler/Rate Limit Exception
    if (exception instanceof ThrottlerException) {
      return {
        success: false,
        error: {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Too many requests, please try again later',
          timestamp,
          path,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          traceId,
        },
      };
    }

    // Standard NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string;
      let details: any;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message =
          (exceptionResponse as any).message ||
          exception.message ||
          'Request failed';
        details = (exceptionResponse as any).error || exceptionResponse;
      } else {
        message = exception.message;
      }

      return {
        success: false,
        error: {
          code: this.mapHttpStatusToErrorCode(status),
          message,
          details,
          timestamp,
          path,
          statusCode: status,
          traceId,
        },
      };
    }

    // Prisma Database Errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, timestamp, path, traceId);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Database validation error',
          details: this.sanitizePrismaError(exception.message),
          timestamp,
          path,
          statusCode: HttpStatus.BAD_REQUEST,
          traceId,
        },
      };
    }

    // Unknown/Unhandled errors
    const error =
      exception instanceof Error ? exception : new Error('Unknown error');

    return {
      success: false,
      error: {
        code: ErrorCode.SYSTEM_INTERNAL_ERROR,
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message,
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
        timestamp,
        path,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        traceId,
      },
    };
  }

  /**
   * Handle Prisma-specific errors and map to appropriate error codes
   */
  private handlePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
    timestamp: string,
    path: string,
    traceId: string,
  ): ErrorResponse {
    let code: ErrorCode;
    let message: string;
    let statusCode: HttpStatus;

    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        code = ErrorCode.DATABASE_DUPLICATE_ENTRY;
        message = `Duplicate entry: ${this.extractFieldFromPrismaError(exception)}`;
        statusCode = HttpStatus.CONFLICT;
        break;

      case 'P2003': // Foreign key constraint violation
        code = ErrorCode.DATABASE_FOREIGN_KEY_VIOLATION;
        message = 'Foreign key constraint violated';
        statusCode = HttpStatus.BAD_REQUEST;
        break;

      case 'P2025': // Record not found
        code = ErrorCode.DATABASE_QUERY_FAILED;
        message = 'Record not found';
        statusCode = HttpStatus.NOT_FOUND;
        break;

      case 'P2000': // Value too long
      case 'P2001': // Record not found
      case 'P2011': // Null constraint violation
      case 'P2012': // Missing required value
        code = ErrorCode.VALIDATION_FAILED;
        message =
          'Validation error: ' + exception.meta?.cause || exception.message;
        statusCode = HttpStatus.BAD_REQUEST;
        break;

      default:
        code = ErrorCode.DATABASE_QUERY_FAILED;
        message =
          process.env.NODE_ENV === 'production'
            ? 'Database operation failed'
            : exception.message;
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    return {
      success: false,
      error: {
        code,
        message,
        details:
          process.env.NODE_ENV === 'development'
            ? { prismaCode: exception.code, meta: exception.meta }
            : undefined,
        timestamp,
        path,
        statusCode,
        traceId,
      },
    };
  }

  /**
   * Map HTTP status codes to error codes
   */
  private mapHttpStatusToErrorCode(status: HttpStatus): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTH_TOKEN_INVALID;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_INVALID_INPUT;
      case HttpStatus.CONFLICT:
        return ErrorCode.DATABASE_DUPLICATE_ENTRY;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SYSTEM_SERVICE_UNAVAILABLE;
      default:
        return ErrorCode.SYSTEM_INTERNAL_ERROR;
    }
  }

  /**
   * Log error with appropriate level based on status code
   */
  private logError(
    exception: unknown,
    errorResponse: ErrorResponse,
    request: Request,
  ): void {
    const { error } = errorResponse;
    const user = (request as any).user;
    const context = {
      traceId: error.traceId,
      path: error.path,
      method: request.method,
      userId: user?.id,
      companyId: user?.companyId,
      errorCode: error.code,
    };

    const message = `[${error.code}] ${error.message}`;

    if (error.statusCode >= 500) {
      // Server errors
      this.logger.error(
        message,
        exception instanceof Error ? exception.stack : undefined,
        JSON.stringify(context),
      );
    } else if (error.statusCode >= 400) {
      // Client errors
      this.logger.warn(message, JSON.stringify(context));
    } else {
      // Other
      this.logger.log(message, JSON.stringify(context));
    }
  }

  /**
   * Capture critical errors in Sentry
   */
  private captureInSentry(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
  ): void {
    if (!this.sentryService) {
      return;
    }

    try {
      const user = (request as any).user;

      if (user) {
        this.sentryService.setUser({
          id: user.id,
          email: user.email,
          username: user.username || user.email,
          companyId: user.companyId,
        });
      }

      this.sentryService.setContext('request', {
        method: request.method,
        url: request.url,
        headers: this.sanitizeHeaders(request.headers),
        query: request.query,
        params: request.params,
        body: this.sanitizeBody(request.body),
      });

      this.sentryService.setContext('error', {
        code: errorResponse.error.code,
        traceId: errorResponse.error.traceId,
        statusCode: errorResponse.error.statusCode,
      });

      this.sentryService.captureException(
        exception instanceof Error
          ? exception
          : new Error(errorResponse.error.message),
        'UnifiedExceptionFilter',
        {
          errorCode: errorResponse.error.code,
          traceId: errorResponse.error.traceId,
        },
      );
    } catch (sentryError) {
      this.logger.error('Failed to capture exception in Sentry', sentryError);
    }
  }

  /**
   * Generate unique trace ID for error tracking
   */
  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract field name from Prisma error
   */
  private extractFieldFromPrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    const target = exception.meta?.target;
    if (Array.isArray(target)) {
      return target.join(', ');
    }
    return 'unknown field';
  }

  /**
   * Sanitize Prisma error messages (remove sensitive data)
   */
  private sanitizePrismaError(message: string): string {
    // Remove potentially sensitive information from error messages
    return message
      .replace(/Argument `.*?`:/g, 'Argument:')
      .replace(/Invalid.*?`.*?`/g, 'Invalid value');
  }

  /**
   * Remove sensitive headers before logging/sending to Sentry
   */
  private sanitizeHeaders(headers: any): Record<string, any> {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Remove sensitive data from request body before logging/sending to Sentry
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
      'accessToken',
      'creditCard',
      'ssn',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
