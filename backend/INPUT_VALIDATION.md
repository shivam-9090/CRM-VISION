# Input Validation Strategy

**Status**: ✅ Implemented  
**Date**: November 6, 2025  
**Task**: #8 - Input Validation Enhancement

## Overview

This document describes the comprehensive input validation strategy implemented across the CRM system. All user inputs are validated, sanitized, and transformed to ensure data integrity and security.

---

## 🎯 Validation Principles

1. **Fail Fast**: Validate as early as possible (at the API boundary)
2. **Whitelist Approach**: Only accept known-good data patterns
3. **Sanitization**: Remove potentially dangerous content
4. **Clear Error Messages**: Provide actionable feedback to users
5. **Type Safety**: Leverage TypeScript and class-validator for type checking

---

## 🛠️ Custom Validation Decorators

All custom decorators are located in: `src/common/decorators/validation.decorators.ts`

### 1. **@IsStrongPassword**
Enforces strong password requirements.

**Rules**:
- Minimum 12 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{};':"\\|,.<>?)

**Usage**:
```typescript
@IsStrongPassword()
password: string;
```

**Example Valid Passwords**:
- `MyP@ssw0rd123!`
- `Secure#2025Pass`
- `Admin!User#99`

---

### 2. **@IsPhoneNumber**
Validates international phone number formats.

**Accepted Formats**:
- E.164: `+1234567890`
- US Format: `(123) 456-7890`
- Dash Format: `123-456-7890`
- International: `+44 20 7123 4567`

**Usage**:
```typescript
@IsPhoneNumber()
phone?: string;
```

---

### 3. **@IsFutureDate**
Ensures a date is in the future (useful for scheduled activities).

**Usage**:
```typescript
@IsFutureDate()
scheduledDate: string;
```

---

### 4. **@DecimalPrecision(n)**
Validates that a number doesn't exceed specified decimal places.

**Usage**:
```typescript
@DecimalPrecision(2)
@IsNumber()
value: number; // Max 2 decimal places (e.g., 99.99)
```

---

## 🔄 Transform Functions

### 1. **sanitizeString(value)**
Removes HTML tags and dangerous content using `sanitize-html`.

**What it does**:
- Strips all HTML tags
- Removes scripts and unsafe attributes
- Trims whitespace

**Usage**:
```typescript
@Transform(({ value }) => sanitizeString(value))
name: string;
```

**Example**:
```typescript
Input:  "<script>alert('xss')</script>John Doe  "
Output: "John Doe"
```

---

### 2. **normalizeEmail(value)**
Normalizes email addresses to lowercase.

**What it does**:
- Converts to lowercase
- Trims whitespace

**Usage**:
```typescript
@Transform(({ value }) => normalizeEmail(value))
email: string;
```

**Example**:
```typescript
Input:  "  JohnDoe@EXAMPLE.COM  "
Output: "johndoe@example.com"
```

---

### 3. **transformOptional(value, transformer)**
Safe wrapper for optional field transformations.

**Usage**:
```typescript
@Transform(({ value }) => transformOptional(value, sanitizeString))
description?: string;
```

---

## 📋 DTO Validation Rules

### Authentication DTOs

#### **RegisterDto**
```typescript
- email: Required, valid email, normalized to lowercase
- password: Required, 12-128 chars, strong password requirements
- name: Required, 2-100 chars, sanitized
- phone: Optional, valid phone format, sanitized
- companyId: Optional, string UUID
- role: Optional, valid Role enum
```

#### **LoginDto**
```typescript
- email: Required, valid email, normalized
- password: Required, 6-128 chars
- twoFactorToken: Optional, exactly 6 chars
```

#### **ResetPasswordDto**
```typescript
- token: Required, 32-256 chars
- newPassword: Required, 12-128 chars, strong password
```

---

### Company DTOs

#### **CreateCompanyDto**
```typescript
- name: Required, 2-200 chars, sanitized
- industry: Required, 2-100 chars, sanitized
- size: Required, 1-50 chars, sanitized
- website: Optional, valid URL, max 500 chars
- phone: Optional, valid phone format, sanitized
- email: Optional, valid email, max 255 chars, normalized
- address: Optional, max 500 chars, sanitized
```

---

### Contact DTOs

#### **CreateContactDto**
```typescript
- firstName: Required, 1-100 chars, sanitized
- lastName: Required, 1-100 chars, sanitized
- email: Optional, valid email, max 255 chars, normalized
- phone: Optional, valid phone format, sanitized
- position: Optional, max 150 chars, sanitized
- companyId: Required, string UUID
```

---

### Deal DTOs

#### **CreateDealDto**
```typescript
- title: Required, 2-200 chars, sanitized
- value: Optional, positive number, max 2 decimal places, max 999999999.99
- stage: Optional, valid DealStage enum
- leadSource: Optional, valid LeadSource enum
- leadScore: Optional, integer 0-100
- priority: Optional, valid Priority enum
- expectedCloseDate: Optional, valid ISO 8601 date
- assignedToId: Optional, string UUID
- notes: Optional, max 2000 chars, sanitized
- contactId: Optional, string UUID
```

---

### Activity DTOs

#### **CreateActivityDto**
```typescript
- title: Required, 2-200 chars, sanitized
- description: Optional, max 2000 chars, sanitized
- type: Required, valid ActivityType enum (CALL, EMAIL, MEETING, NOTE, TASK)
- status: Required, valid ActivityStatus enum (SCHEDULED, COMPLETED, CANCELLED)
- scheduledDate: Required, valid ISO 8601 date
- contactId: Optional, string UUID
- dealId: Optional, string UUID
- companyId: Optional, string UUID
```

---

## ⚙️ ValidationPipe Configuration

Located in: `src/main.ts`

```typescript
new ValidationPipe({
  whitelist: true,                    // Strip unknown properties
  forbidNonWhitelisted: true,         // Reject unknown properties
  transform: true,                    // Auto-transform to DTO instances
  disableErrorMessages: false,        // Show validation errors
  validateCustomDecorators: true,     // Enable custom decorators
  transformOptions: {
    enableImplicitConversion: true,   // Auto-convert types
    exposeDefaultValues: true,        // Use DTO default values
  },
})
```

---

## 🔒 Security Benefits

### 1. **XSS Prevention**
- All text inputs are sanitized using `sanitize-html`
- HTML tags and scripts are removed
- Prevents stored XSS attacks

### 2. **SQL Injection Prevention**
- Parameterized queries via Prisma ORM
- Input validation prevents malformed data
- Type checking ensures correct data types

### 3. **Data Integrity**
- Length constraints prevent buffer overflow
- Type validation ensures correct data structure
- Enum validation prevents invalid states

### 4. **Business Logic Protection**
- Email normalization prevents duplicate accounts
- Phone validation ensures contactable numbers
- Date validation prevents scheduling in the past

---

## 📊 Validation Error Response Format

When validation fails, the API returns a structured error response:

```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email address",
    "Password must be at least 12 characters and contain uppercase, lowercase, number, and special character",
    "name must be longer than or equal to 2 characters"
  ],
  "error": "Bad Request"
}
```

---

## 🧪 Testing Validation

### Example: Testing Strong Password Validation

```typescript
// Valid passwords
"MyP@ssw0rd123!"     ✅
"Secure#2025Pass"    ✅
"Admin!User#99"      ✅

// Invalid passwords
"password"           ❌ (too short, no uppercase, no special char)
"Password123"        ❌ (no special character)
"Password!"          ❌ (no number)
"password123!"       ❌ (no uppercase)
```

### Example: Testing Email Normalization

```typescript
// Input variations (all become the same)
"  JohnDoe@EXAMPLE.COM  "
"johndoe@example.com"
"JohnDoe@Example.com"

// All normalize to:
"johndoe@example.com"
```

---

## 📝 Best Practices

### 1. **Always Use DTOs**
Never accept plain objects. Always define a DTO with validation decorators.

```typescript
// ❌ Bad
@Post()
create(@Body() data: any) { }

// ✅ Good
@Post()
create(@Body() dto: CreateUserDto) { }
```

### 2. **Combine Multiple Validators**
Layer validators for comprehensive checks.

```typescript
@IsEmail()                          // Must be email format
@IsNotEmpty()                       // Cannot be empty
@MaxLength(255)                     // Length constraint
@Transform(({ value }) => normalizeEmail(value))  // Normalize
email: string;
```

### 3. **Provide Clear Error Messages**
Always include helpful error messages.

```typescript
@MinLength(2, { message: 'Name must be at least 2 characters long' })
@MaxLength(100, { message: 'Name must not exceed 100 characters' })
name: string;
```

### 4. **Sanitize User-Generated Content**
Always sanitize fields that accept free-form text.

```typescript
@Transform(({ value }) => sanitizeString(value))
@MaxLength(2000)
notes?: string;
```

### 5. **Use Type Transformations**
Enable automatic type conversion for better DX.

```typescript
@Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : Number(value))
@IsNumber()
value?: number;
```

---

## 🔄 Update DTOs Checklist

When creating or updating a DTO:

- [ ] Add appropriate validators (`@IsString`, `@IsEmail`, etc.)
- [ ] Add length constraints (`@MinLength`, `@MaxLength`)
- [ ] Add range constraints for numbers (`@Min`, `@Max`)
- [ ] Add enum validators for status fields (`@IsEnum`)
- [ ] Add transformers for sanitization (`@Transform`)
- [ ] Mark optional fields correctly (`@IsOptional`)
- [ ] Add custom error messages
- [ ] Test validation with valid and invalid data

---

## 📚 Related Documentation

- [NestJS Validation Pipes](https://docs.nestjs.com/techniques/validation)
- [class-validator Documentation](https://github.com/typestack/class-validator)
- [class-transformer Documentation](https://github.com/typestack/class-transformer)
- [sanitize-html Documentation](https://github.com/apostrophecms/sanitize-html)

---

## 🎯 Next Steps

- [ ] Add integration tests for all DTOs
- [ ] Add validation for file uploads (Task #18 - Attachments)
- [ ] Consider adding rate limiting per validation failure
- [ ] Add validation metrics to monitoring

---

**Implementation Complete**: All DTOs now have comprehensive validation, sanitization, and transformation rules. The system is protected against common input-based vulnerabilities.
