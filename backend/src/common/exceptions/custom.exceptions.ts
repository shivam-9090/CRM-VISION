import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';
import { ErrorCode } from './error-codes.enum';

/**
 * Authentication and Authorization Exceptions
 */
export class InvalidCredentialsException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.AUTH_INVALID_CREDENTIALS, details, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenExpiredException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.AUTH_TOKEN_EXPIRED, details, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidTokenException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.AUTH_TOKEN_INVALID, details, HttpStatus.UNAUTHORIZED);
  }
}

export class MissingTokenException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.AUTH_TOKEN_MISSING, details, HttpStatus.UNAUTHORIZED);
  }
}

export class RefreshTokenInvalidException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
      details,
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class RefreshTokenExpiredException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED,
      details,
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AccountLockedException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.AUTH_ACCOUNT_LOCKED, details, HttpStatus.FORBIDDEN);
  }
}

export class AccountDisabledException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.AUTH_ACCOUNT_DISABLED, details, HttpStatus.FORBIDDEN);
  }
}

export class InsufficientPermissionsException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
      details,
      HttpStatus.FORBIDDEN,
    );
  }
}

export class SessionExpiredException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.AUTH_SESSION_EXPIRED, details, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * User Management Exceptions
 */
export class UserNotFoundException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.USER_NOT_FOUND, details, HttpStatus.NOT_FOUND);
  }
}

export class UserAlreadyExistsException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.USER_ALREADY_EXISTS, details, HttpStatus.CONFLICT);
  }
}

export class EmailTakenException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.USER_EMAIL_TAKEN, details, HttpStatus.CONFLICT);
  }
}

export class WeakPasswordException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.USER_WEAK_PASSWORD, details, HttpStatus.BAD_REQUEST);
  }
}

export class CannotDeleteSelfException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.USER_CANNOT_DELETE_SELF, details, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Company Management Exceptions
 */
export class CompanyNotFoundException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.COMPANY_NOT_FOUND, details, HttpStatus.NOT_FOUND);
  }
}

export class CompanyAlreadyExistsException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.COMPANY_ALREADY_EXISTS, details, HttpStatus.CONFLICT);
  }
}

export class CompanyQuotaExceededException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.COMPANY_QUOTA_EXCEEDED, details, HttpStatus.FORBIDDEN);
  }
}

/**
 * Contact Management Exceptions
 */
export class ContactNotFoundException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.CONTACT_NOT_FOUND, details, HttpStatus.NOT_FOUND);
  }
}

export class ContactAlreadyExistsException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.CONTACT_ALREADY_EXISTS, details, HttpStatus.CONFLICT);
  }
}

/**
 * Deal Management Exceptions
 */
export class DealNotFoundException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.DEAL_NOT_FOUND, details, HttpStatus.NOT_FOUND);
  }
}

export class InvalidDealStatusException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.DEAL_INVALID_STATUS, details, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidDealStageException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.DEAL_INVALID_STAGE, details, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Activity Management Exceptions
 */
export class ActivityNotFoundException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.ACTIVITY_NOT_FOUND, details, HttpStatus.NOT_FOUND);
  }
}

export class InvalidActivityTypeException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.ACTIVITY_INVALID_TYPE, details, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidActivityStatusException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.ACTIVITY_INVALID_STATUS, details, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Validation Exceptions
 */
export class ValidationException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.VALIDATION_FAILED, details, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidInputException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.VALIDATION_INVALID_INPUT, details, HttpStatus.BAD_REQUEST);
  }
}

export class MissingRequiredFieldException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.VALIDATION_MISSING_REQUIRED_FIELD,
      details,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Database Exceptions
 */
export class DatabaseConnectionException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.DATABASE_CONNECTION_FAILED,
      details,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class DatabaseQueryException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.DATABASE_QUERY_FAILED,
      details,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class DuplicateEntryException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.DATABASE_DUPLICATE_ENTRY, details, HttpStatus.CONFLICT);
  }
}

export class ForeignKeyViolationException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.DATABASE_FOREIGN_KEY_VIOLATION,
      details,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * File & Upload Exceptions
 */
export class FileNotFoundException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.FILE_NOT_FOUND, details, HttpStatus.NOT_FOUND);
  }
}

export class FileTooLargeException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.FILE_TOO_LARGE, details, HttpStatus.PAYLOAD_TOO_LARGE);
  }
}

export class InvalidFileTypeException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.FILE_INVALID_TYPE, details, HttpStatus.BAD_REQUEST);
  }
}

export class FileUploadFailedException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.FILE_UPLOAD_FAILED,
      details,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Rate Limiting Exceptions
 */
export class RateLimitExceededException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, details, HttpStatus.TOO_MANY_REQUESTS);
  }
}

/**
 * External Service Exceptions
 */
export class ExternalServiceException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      details,
      HttpStatus.BAD_GATEWAY,
    );
  }
}

export class EmailSendFailedException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.EMAIL_SEND_FAILED,
      details,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class EmailTemplateNotFoundException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.EMAIL_TEMPLATE_NOT_FOUND, details, HttpStatus.NOT_FOUND);
  }
}

/**
 * Business Logic Exceptions
 */
export class BusinessRuleViolationException extends BaseException {
  constructor(details?: any) {
    super(ErrorCode.BUSINESS_RULE_VIOLATION, details, HttpStatus.BAD_REQUEST);
  }
}

export class OperationNotAllowedException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.BUSINESS_OPERATION_NOT_ALLOWED,
      details,
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * System Exceptions
 */
export class InternalServerException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.SYSTEM_INTERNAL_ERROR,
      details,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class ServiceUnavailableException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.SYSTEM_SERVICE_UNAVAILABLE,
      details,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class MaintenanceModeException extends BaseException {
  constructor(details?: any) {
    super(
      ErrorCode.SYSTEM_MAINTENANCE_MODE,
      details,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
