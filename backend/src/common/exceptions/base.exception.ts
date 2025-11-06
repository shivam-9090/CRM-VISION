import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ERROR_MESSAGES } from './error-codes.enum';

/**
 * Standardized error response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
    statusCode: number;
    traceId?: string;
  };
}

/**
 * Base application exception with standardized error codes
 */
export class BaseException extends HttpException {
  constructor(
    private readonly errorCode: ErrorCode,
    private readonly details?: any,
    statusCode?: HttpStatus,
  ) {
    const message = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];
    super(
      {
        success: false,
        error: {
          code: errorCode,
          message,
          details,
          timestamp: new Date().toISOString(),
          statusCode: statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
        },
      },
      statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  getErrorCode(): ErrorCode {
    return this.errorCode;
  }

  getDetails(): any {
    return this.details;
  }
}
