# Error Handling Standardization

## Overview

This document describes the comprehensive error handling system implemented across the CRM application. The system provides standardized error responses, custom exception classes, error codes, and unified error tracking.

## Features

- ✅ **Standardized Error Response Format**: Consistent error structure across all endpoints
- ✅ **Custom Exception Classes**: Type-safe exceptions with error codes
- ✅ **Error Codes**: Unique codes for each error type for easy debugging
- ✅ **Unified Exception Filter**: Single filter handling all exception types
- ✅ **Prisma Error Handling**: Automatic conversion of database errors
- ✅ **Error Tracking**: Integration with Sentry for critical errors
- ✅ **Trace IDs**: Unique identifiers for tracking errors across logs
- ✅ **Sanitization**: Sensitive data removal before logging/reporting
- ✅ **Environment-aware**: Different error details in dev vs production

## Standardized Error Response Format

All API errors return the following structure:

```typescript
{
  "success": false,
  "error": {
    "code": "USER_001",              // Unique error code
    "message": "User not found",     // Human-readable message
    "details": {...},                // Additional context (optional)
    "timestamp": "2025-11-06T12:00:00.000Z",
    "path": "/api/users/123",        // Request path
    "statusCode": 404,               // HTTP status code
    "traceId": "1699272000000-abc123" // Unique trace ID
  }
}
```

## Error Codes

Error codes follow the format: `MODULE_ERROR_TYPE_DESCRIPTION`

### Authentication & Authorization (AUTH_xxx)

| Code | Message | Status |
|------|---------|--------|
| `AUTH_001` | Invalid email or password | 401 |
| `AUTH_002` | Authentication token has expired | 401 |
| `AUTH_003` | Invalid authentication token | 401 |
| `AUTH_004` | Authentication token is missing | 401 |
| `AUTH_005` | Invalid refresh token | 401 |
| `AUTH_006` | Refresh token has expired | 401 |
| `AUTH_007` | Account is locked | 403 |
| `AUTH_008` | Account has been disabled | 403 |
| `AUTH_009` | Invalid password reset token | 401 |
| `AUTH_010` | Password reset token has expired | 401 |
| `AUTH_011` | Insufficient permissions | 403 |
| `AUTH_012` | Session has expired | 401 |

### User Management (USER_xxx)

| Code | Message | Status |
|------|---------|--------|
| `USER_001` | User not found | 404 |
| `USER_002` | User already exists | 409 |
| `USER_003` | Email address is already in use | 409 |
| `USER_004` | Invalid email address format | 400 |
| `USER_005` | Password does not meet security requirements | 400 |
| `USER_006` | Cannot delete your own account | 400 |
| `USER_007` | Invalid user role | 400 |
| `USER_008` | User does not belong to this company | 400 |

### Company Management (COMPANY_xxx)

| Code | Message | Status |
|------|---------|--------|
| `COMPANY_001` | Company not found | 404 |
| `COMPANY_002` | Company already exists | 409 |
| `COMPANY_003` | Invalid company domain | 400 |
| `COMPANY_004` | Cannot delete company with active users | 400 |
| `COMPANY_005` | Company subscription has expired | 403 |
| `COMPANY_006` | Company quota exceeded | 403 |

### Contact Management (CONTACT_xxx)

| Code | Message | Status |
|------|---------|--------|
| `CONTACT_001` | Contact not found | 404 |
| `CONTACT_002` | Contact already exists | 409 |
| `CONTACT_003` | Invalid contact email address | 400 |
| `CONTACT_004` | Invalid contact phone number | 400 |
| `CONTACT_005` | Contact does not belong to this company | 400 |

### Deal Management (DEAL_xxx)

| Code | Message | Status |
|------|---------|--------|
| `DEAL_001` | Deal not found | 404 |
| `DEAL_002` | Invalid deal status | 400 |
| `DEAL_003` | Invalid deal value | 400 |
| `DEAL_004` | Invalid deal stage | 400 |
| `DEAL_005` | Close date cannot be in the past | 400 |
| `DEAL_006` | Deal does not belong to this company | 400 |

### Activity Management (ACTIVITY_xxx)

| Code | Message | Status |
|------|---------|--------|
| `ACTIVITY_001` | Activity not found | 404 |
| `ACTIVITY_002` | Invalid activity type | 400 |
| `ACTIVITY_003` | Invalid activity status | 400 |
| `ACTIVITY_004` | Activity date cannot be in the past | 400 |
| `ACTIVITY_005` | Activity does not belong to this company | 400 |

### Validation Errors (VAL_xxx)

| Code | Message | Status |
|------|---------|--------|
| `VAL_001` | Validation failed | 400 |
| `VAL_002` | Invalid input provided | 400 |
| `VAL_003` | Required field is missing | 400 |
| `VAL_004` | Invalid format | 400 |
| `VAL_005` | Value is out of acceptable range | 400 |
| `VAL_006` | Invalid date format | 400 |
| `VAL_007` | Invalid UUID format | 400 |

### Database Errors (DB_xxx)

| Code | Message | Status |
|------|---------|--------|
| `DB_001` | Database connection failed | 503 |
| `DB_002` | Database query failed | 500 |
| `DB_003` | Database constraint violation | 400 |
| `DB_004` | Duplicate entry | 409 |
| `DB_005` | Foreign key constraint violated | 400 |
| `DB_006` | Database transaction failed | 500 |

### File & Upload Errors (FILE_xxx)

| Code | Message | Status |
|------|---------|--------|
| `FILE_001` | File not found | 404 |
| `FILE_002` | File size exceeds maximum allowed | 413 |
| `FILE_003` | Invalid file type | 400 |
| `FILE_004` | File upload failed | 500 |
| `FILE_005` | File is corrupted or unreadable | 400 |

### Rate Limiting (RATE_xxx)

| Code | Message | Status |
|------|---------|--------|
| `RATE_001` | Rate limit exceeded | 429 |
| `RATE_002` | Too many requests | 429 |

### External Services (EXT_xxx)

| Code | Message | Status |
|------|---------|--------|
| `EXT_001` | External service is unavailable | 502 |
| `EXT_002` | External API error | 502 |
| `EXT_003` | External service timeout | 504 |
| `EXT_004` | Failed to send email | 500 |
| `EXT_005` | Email template not found | 404 |

### Business Logic (BIZ_xxx)

| Code | Message | Status |
|------|---------|--------|
| `BIZ_001` | Business rule violation | 400 |
| `BIZ_002` | Operation not allowed | 403 |
| `BIZ_003` | Invalid state transition | 400 |

### System Errors (SYS_xxx)

| Code | Message | Status |
|------|---------|--------|
| `SYS_001` | Internal server error | 500 |
| `SYS_002` | Service temporarily unavailable | 503 |
| `SYS_003` | System is under maintenance | 503 |
| `SYS_004` | System configuration error | 500 |

## Usage Examples

### Using Custom Exceptions

```typescript
import { 
  UserNotFoundException, 
  EmailTakenException,
  InsufficientPermissionsException 
} from '@common/exceptions';

// In your service
async findUser(id: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  
  if (!user) {
    throw new UserNotFoundException({ userId: id });
  }
  
  return user;
}

// With additional details
async createUser(dto: CreateUserDto) {
  const existing = await this.findByEmail(dto.email);
  
  if (existing) {
    throw new EmailTakenException({ 
      email: dto.email,
      existingUserId: existing.id 
    });
  }
  
  return this.prisma.user.create({ data: dto });
}

// Permission checks
async deleteUser(userId: string, currentUser: User) {
  if (!currentUser.permissions.includes('user:delete')) {
    throw new InsufficientPermissionsException({
      required: 'user:delete',
      current: currentUser.permissions
    });
  }
  
  // ... delete logic
}
```

### Creating Custom Business Exceptions

```typescript
import { BaseException } from '@common/exceptions/base.exception';
import { ErrorCode } from '@common/exceptions/error-codes.enum';
import { HttpStatus } from '@nestjs/common';

export class DealAlreadyClosedException extends BaseException {
  constructor(dealId: string) {
    super(
      ErrorCode.BUSINESS_OPERATION_NOT_ALLOWED,
      { dealId, reason: 'Deal is already closed' },
      HttpStatus.BAD_REQUEST
    );
  }
}
```

### Frontend Error Handling

```typescript
// API client
async function createUser(data: CreateUserDto) {
  try {
    const response = await api.post('/api/users', data);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      
      // Handle specific error codes
      switch (apiError.code) {
        case 'USER_003': // Email taken
          showError('This email is already registered');
          break;
        case 'USER_005': // Weak password
          showError('Password is too weak. Please use a stronger password');
          break;
        case 'AUTH_011': // Insufficient permissions
          showError('You do not have permission to perform this action');
          break;
        default:
          showError(apiError.message);
      }
      
      // Log trace ID for support
      console.error('Error trace ID:', apiError.traceId);
    }
    throw error;
  }
}
```

## Automatic Error Handling

The `UnifiedExceptionFilter` automatically handles:

### Prisma Errors

```typescript
// Prisma errors are automatically converted
// P2002 (unique constraint) → DB_004 (Duplicate entry)
// P2003 (foreign key) → DB_005 (Foreign key violation)
// P2025 (record not found) → DB_002 (Query failed)
```

### HTTP Exceptions

```typescript
// Standard NestJS exceptions work seamlessly
throw new NotFoundException('User not found');
// → Returns standardized error response with appropriate code
```

### Rate Limiting

```typescript
// Throttler exceptions are caught automatically
// → Returns RATE_001 error with 429 status
```

## Error Tracking & Monitoring

### Trace IDs

Every error receives a unique trace ID for correlation:

```typescript
// Format: timestamp-randomstring
// Example: 1699272000000-abc123def

// Use trace ID to:
// 1. Search logs
// 2. Track error in Sentry
// 3. Correlate across microservices
// 4. Help users report issues
```

### Sentry Integration

- All 5xx errors are automatically sent to Sentry
- User context is attached if available
- Request details are sanitized before sending
- Custom error codes are included in Sentry tags

### Logging

```typescript
// Errors are logged with appropriate levels:
// - 5xx errors: logger.error() with stack trace
// - 4xx errors: logger.warn()
// - Others: logger.log()

// Log format includes:
{
  "traceId": "1699272000000-abc123",
  "path": "/api/users/123",
  "method": "DELETE",
  "userId": "user-123",
  "companyId": "company-456",
  "errorCode": "USER_001"
}
```

## Sensitive Data Sanitization

The filter automatically removes sensitive data before logging or sending to Sentry:

### Headers
- `authorization`
- `cookie`
- `x-api-key`
- `x-auth-token`

### Body Fields
- `password`
- `token`
- `secret`
- `apiKey`
- `refreshToken`
- `accessToken`
- `creditCard`
- `ssn`

## Environment-Specific Behavior

### Development
- Full error details including stack traces
- Prisma error details
- Database query information

### Production
- Sanitized error messages
- No stack traces
- Generic messages for system errors
- Detailed logging to Sentry only

## Testing Error Handling

```typescript
describe('UserService', () => {
  it('should throw UserNotFoundException when user not found', async () => {
    await expect(service.findOne('invalid-id')).rejects.toThrow(
      UserNotFoundException
    );
  });
  
  it('should throw EmailTakenException on duplicate email', async () => {
    await service.create({ email: 'test@example.com', ...data });
    
    await expect(
      service.create({ email: 'test@example.com', ...data })
    ).rejects.toThrow(EmailTakenException);
  });
});
```

## Best Practices

### ✅ DO

- Use custom exceptions for domain-specific errors
- Include relevant details in exception constructor
- Use appropriate error codes for different scenarios
- Log errors at appropriate levels
- Test error handling paths
- Provide trace IDs to users for support

### ❌ DON'T

- Throw generic Error objects
- Include sensitive data in error messages
- Return different error formats
- Log sensitive information
- Expose internal implementation details
- Use generic error messages

## Migration Guide

### Replacing Old Exceptions

```typescript
// OLD
throw new NotFoundException('User not found');

// NEW
throw new UserNotFoundException({ userId: id });

// OLD
throw new BadRequestException('Email already exists');

// NEW
throw new EmailTakenException({ email: dto.email });

// OLD
throw new UnauthorizedException('Invalid token');

// NEW
throw new InvalidTokenException({ reason: 'Token signature invalid' });
```

## Configuration

### main.ts

```typescript
import { UnifiedExceptionFilter } from '@common/filters/unified-exception.filter';
import { SentryService } from '@common/sentry.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get Sentry service for error tracking
  const sentryService = app.get(SentryService);
  
  // Apply unified exception filter globally
  app.useGlobalFilters(new UnifiedExceptionFilter(sentryService));
  
  await app.listen(3000);
}
```

## Monitoring & Alerts

Set up alerts for:

- High error rates (>5% of requests)
- Specific critical error codes (AUTH_007, DB_001, SYS_001)
- Increased 5xx errors
- Rate limiting violations
- Database connection failures

## Support

When users report errors:

1. Ask for the trace ID from error response
2. Search logs using trace ID
3. Check Sentry for full context
4. Review error code for quick diagnosis
5. Verify user permissions if AUTH_011

## Files

- `src/common/exceptions/error-codes.enum.ts` - Error code definitions
- `src/common/exceptions/base.exception.ts` - Base exception class
- `src/common/exceptions/custom.exceptions.ts` - Domain-specific exceptions
- `src/common/filters/unified-exception.filter.ts` - Global exception handler

---

**Status**: ✅ Completed (Task #15)  
**Version**: 1.0.0  
**Last Updated**: November 6, 2025
