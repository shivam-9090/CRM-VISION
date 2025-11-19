/**
 * Standardized error codes for the CRM system
 * Format: MODULE_ERROR_TYPE_DESCRIPTION
 */
export enum ErrorCode {
  // Authentication & Authorization (AUTH)
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_TOKEN_EXPIRED = 'AUTH_002',
  AUTH_TOKEN_INVALID = 'AUTH_003',
  AUTH_TOKEN_MISSING = 'AUTH_004',
  AUTH_REFRESH_TOKEN_INVALID = 'AUTH_005',
  AUTH_REFRESH_TOKEN_EXPIRED = 'AUTH_006',
  AUTH_ACCOUNT_LOCKED = 'AUTH_007',
  AUTH_ACCOUNT_DISABLED = 'AUTH_008',
  AUTH_PASSWORD_RESET_TOKEN_INVALID = 'AUTH_009',
  AUTH_PASSWORD_RESET_TOKEN_EXPIRED = 'AUTH_010',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_011',
  AUTH_SESSION_EXPIRED = 'AUTH_012',

  // User Management (USER)
  USER_NOT_FOUND = 'USER_001',
  USER_ALREADY_EXISTS = 'USER_002',
  USER_EMAIL_TAKEN = 'USER_003',
  USER_INVALID_EMAIL = 'USER_004',
  USER_WEAK_PASSWORD = 'USER_005',
  USER_CANNOT_DELETE_SELF = 'USER_006',
  USER_INVALID_ROLE = 'USER_007',
  USER_COMPANY_MISMATCH = 'USER_008',

  // Company Management (COMPANY)
  COMPANY_NOT_FOUND = 'COMPANY_001',
  COMPANY_ALREADY_EXISTS = 'COMPANY_002',
  COMPANY_INVALID_DOMAIN = 'COMPANY_003',
  COMPANY_CANNOT_DELETE_WITH_USERS = 'COMPANY_004',
  COMPANY_SUBSCRIPTION_EXPIRED = 'COMPANY_005',
  COMPANY_QUOTA_EXCEEDED = 'COMPANY_006',

  // Contact Management (CONTACT)
  CONTACT_NOT_FOUND = 'CONTACT_001',
  CONTACT_ALREADY_EXISTS = 'CONTACT_002',
  CONTACT_INVALID_EMAIL = 'CONTACT_003',
  CONTACT_INVALID_PHONE = 'CONTACT_004',
  CONTACT_COMPANY_MISMATCH = 'CONTACT_005',

  // Deal Management (DEAL)
  DEAL_NOT_FOUND = 'DEAL_001',
  DEAL_INVALID_STATUS = 'DEAL_002',
  DEAL_INVALID_VALUE = 'DEAL_003',
  DEAL_INVALID_STAGE = 'DEAL_004',
  DEAL_CLOSE_DATE_PAST = 'DEAL_005',
  DEAL_COMPANY_MISMATCH = 'DEAL_006',

  // Activity Management (ACTIVITY)
  ACTIVITY_NOT_FOUND = 'ACTIVITY_001',
  ACTIVITY_INVALID_TYPE = 'ACTIVITY_002',
  ACTIVITY_INVALID_STATUS = 'ACTIVITY_003',
  ACTIVITY_PAST_DATE = 'ACTIVITY_004',
  ACTIVITY_COMPANY_MISMATCH = 'ACTIVITY_005',

  // Validation Errors (VALIDATION)
  VALIDATION_FAILED = 'VAL_001',
  VALIDATION_INVALID_INPUT = 'VAL_002',
  VALIDATION_MISSING_REQUIRED_FIELD = 'VAL_003',
  VALIDATION_INVALID_FORMAT = 'VAL_004',
  VALIDATION_VALUE_OUT_OF_RANGE = 'VAL_005',
  VALIDATION_INVALID_DATE = 'VAL_006',
  VALIDATION_INVALID_UUID = 'VAL_007',

  // Database Errors (DATABASE)
  DATABASE_CONNECTION_FAILED = 'DB_001',
  DATABASE_QUERY_FAILED = 'DB_002',
  DATABASE_CONSTRAINT_VIOLATION = 'DB_003',
  DATABASE_DUPLICATE_ENTRY = 'DB_004',
  DATABASE_FOREIGN_KEY_VIOLATION = 'DB_005',
  DATABASE_TRANSACTION_FAILED = 'DB_006',

  // File & Upload Errors (FILE)
  FILE_NOT_FOUND = 'FILE_001',
  FILE_TOO_LARGE = 'FILE_002',
  FILE_INVALID_TYPE = 'FILE_003',
  FILE_UPLOAD_FAILED = 'FILE_004',
  FILE_CORRUPTED = 'FILE_005',

  // Rate Limiting (RATE)
  RATE_LIMIT_EXCEEDED = 'RATE_001',
  RATE_LIMIT_TOO_MANY_REQUESTS = 'RATE_002',

  // External Services (EXTERNAL)
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXT_001',
  EXTERNAL_API_ERROR = 'EXT_002',
  EXTERNAL_TIMEOUT = 'EXT_003',
  EMAIL_SEND_FAILED = 'EXT_004',
  EMAIL_TEMPLATE_NOT_FOUND = 'EXT_005',

  // Business Logic (BUSINESS)
  BUSINESS_RULE_VIOLATION = 'BIZ_001',
  BUSINESS_OPERATION_NOT_ALLOWED = 'BIZ_002',
  BUSINESS_INVALID_STATE_TRANSITION = 'BIZ_003',

  // System Errors (SYSTEM)
  SYSTEM_INTERNAL_ERROR = 'SYS_001',
  SYSTEM_SERVICE_UNAVAILABLE = 'SYS_002',
  SYSTEM_MAINTENANCE_MODE = 'SYS_003',
  SYSTEM_CONFIGURATION_ERROR = 'SYS_004',

  // Generic
  UNKNOWN_ERROR = 'UNKNOWN',
}

/**
 * Human-readable error messages mapped to error codes
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication & Authorization
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCode.AUTH_TOKEN_INVALID]: 'Invalid authentication token',
  [ErrorCode.AUTH_TOKEN_MISSING]: 'Authentication token is missing',
  [ErrorCode.AUTH_REFRESH_TOKEN_INVALID]: 'Invalid refresh token',
  [ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED]: 'Refresh token has expired',
  [ErrorCode.AUTH_ACCOUNT_LOCKED]:
    'Account is locked due to multiple failed login attempts',
  [ErrorCode.AUTH_ACCOUNT_DISABLED]: 'Account has been disabled',
  [ErrorCode.AUTH_PASSWORD_RESET_TOKEN_INVALID]: 'Invalid password reset token',
  [ErrorCode.AUTH_PASSWORD_RESET_TOKEN_EXPIRED]:
    'Password reset token has expired',
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]:
    'Insufficient permissions to perform this action',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Your session has expired',

  // User Management
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.USER_EMAIL_TAKEN]: 'Email address is already in use',
  [ErrorCode.USER_INVALID_EMAIL]: 'Invalid email address format',
  [ErrorCode.USER_WEAK_PASSWORD]:
    'Password does not meet security requirements',
  [ErrorCode.USER_CANNOT_DELETE_SELF]: 'Cannot delete your own account',
  [ErrorCode.USER_INVALID_ROLE]: 'Invalid user role',
  [ErrorCode.USER_COMPANY_MISMATCH]: 'User does not belong to this company',

  // Company Management
  [ErrorCode.COMPANY_NOT_FOUND]: 'Company not found',
  [ErrorCode.COMPANY_ALREADY_EXISTS]: 'Company already exists',
  [ErrorCode.COMPANY_INVALID_DOMAIN]: 'Invalid company domain',
  [ErrorCode.COMPANY_CANNOT_DELETE_WITH_USERS]:
    'Cannot delete company with active users',
  [ErrorCode.COMPANY_SUBSCRIPTION_EXPIRED]: 'Company subscription has expired',
  [ErrorCode.COMPANY_QUOTA_EXCEEDED]: 'Company quota exceeded',

  // Contact Management
  [ErrorCode.CONTACT_NOT_FOUND]: 'Contact not found',
  [ErrorCode.CONTACT_ALREADY_EXISTS]: 'Contact already exists',
  [ErrorCode.CONTACT_INVALID_EMAIL]: 'Invalid contact email address',
  [ErrorCode.CONTACT_INVALID_PHONE]: 'Invalid contact phone number',
  [ErrorCode.CONTACT_COMPANY_MISMATCH]:
    'Contact does not belong to this company',

  // Deal Management
  [ErrorCode.DEAL_NOT_FOUND]: 'Deal not found',
  [ErrorCode.DEAL_INVALID_STATUS]: 'Invalid deal status',
  [ErrorCode.DEAL_INVALID_VALUE]: 'Invalid deal value',
  [ErrorCode.DEAL_INVALID_STAGE]: 'Invalid deal stage',
  [ErrorCode.DEAL_CLOSE_DATE_PAST]: 'Close date cannot be in the past',
  [ErrorCode.DEAL_COMPANY_MISMATCH]: 'Deal does not belong to this company',

  // Activity Management
  [ErrorCode.ACTIVITY_NOT_FOUND]: 'Activity not found',
  [ErrorCode.ACTIVITY_INVALID_TYPE]: 'Invalid activity type',
  [ErrorCode.ACTIVITY_INVALID_STATUS]: 'Invalid activity status',
  [ErrorCode.ACTIVITY_PAST_DATE]: 'Activity date cannot be in the past',
  [ErrorCode.ACTIVITY_COMPANY_MISMATCH]:
    'Activity does not belong to this company',

  // Validation Errors
  [ErrorCode.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCode.VALIDATION_INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.VALIDATION_MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCode.VALIDATION_INVALID_FORMAT]: 'Invalid format',
  [ErrorCode.VALIDATION_VALUE_OUT_OF_RANGE]: 'Value is out of acceptable range',
  [ErrorCode.VALIDATION_INVALID_DATE]: 'Invalid date format',
  [ErrorCode.VALIDATION_INVALID_UUID]: 'Invalid UUID format',

  // Database Errors
  [ErrorCode.DATABASE_CONNECTION_FAILED]: 'Database connection failed',
  [ErrorCode.DATABASE_QUERY_FAILED]: 'Database query failed',
  [ErrorCode.DATABASE_CONSTRAINT_VIOLATION]: 'Database constraint violation',
  [ErrorCode.DATABASE_DUPLICATE_ENTRY]: 'Duplicate entry',
  [ErrorCode.DATABASE_FOREIGN_KEY_VIOLATION]: 'Foreign key constraint violated',
  [ErrorCode.DATABASE_TRANSACTION_FAILED]: 'Database transaction failed',

  // File & Upload Errors
  [ErrorCode.FILE_NOT_FOUND]: 'File not found',
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds maximum allowed',
  [ErrorCode.FILE_INVALID_TYPE]: 'Invalid file type',
  [ErrorCode.FILE_UPLOAD_FAILED]: 'File upload failed',
  [ErrorCode.FILE_CORRUPTED]: 'File is corrupted or unreadable',

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCode.RATE_LIMIT_TOO_MANY_REQUESTS]:
    'Too many requests, please try again later',

  // External Services
  [ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: 'External service is unavailable',
  [ErrorCode.EXTERNAL_API_ERROR]: 'External API error',
  [ErrorCode.EXTERNAL_TIMEOUT]: 'External service timeout',
  [ErrorCode.EMAIL_SEND_FAILED]: 'Failed to send email',
  [ErrorCode.EMAIL_TEMPLATE_NOT_FOUND]: 'Email template not found',

  // Business Logic
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 'Business rule violation',
  [ErrorCode.BUSINESS_OPERATION_NOT_ALLOWED]: 'Operation not allowed',
  [ErrorCode.BUSINESS_INVALID_STATE_TRANSITION]:
    'Invalid state transition attempted',

  // System Errors
  [ErrorCode.SYSTEM_INTERNAL_ERROR]: 'Internal server error',
  [ErrorCode.SYSTEM_SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.SYSTEM_MAINTENANCE_MODE]: 'System is under maintenance',
  [ErrorCode.SYSTEM_CONFIGURATION_ERROR]: 'System configuration error',

  // Generic
  [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred',
};
