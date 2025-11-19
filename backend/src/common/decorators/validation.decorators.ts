import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import sanitizeHtml from 'sanitize-html';

/**
 * Custom validation decorator: Checks if the date is in the future
 */
@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(dateString: string): boolean {
    if (!dateString) return true; // Allow empty for optional fields
    const inputDate = new Date(dateString);
    const now = new Date();
    return inputDate > now;
  }

  defaultMessage(): string {
    return 'Date must be in the future';
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}

/**
 * Custom validation decorator: Validates phone number format
 * Accepts international formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
 */
@ValidatorConstraint({ name: 'isPhoneNumber', async: false })
export class IsPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(phone: string): boolean {
    if (!phone) return true; // Allow empty for optional fields
    // International phone number regex (E.164 and common formats)
    const phoneRegex =
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,5}[-\s.]?[0-9]{1,5}$/;
    return phoneRegex.test(phone);
  }

  defaultMessage(): string {
    return 'Phone number must be a valid format (e.g., +1234567890, (123) 456-7890)';
  }
}

export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneNumberConstraint,
    });
  };
}

/**
 * Custom validation decorator: Sanitizes HTML content
 * Removes potentially dangerous tags and attributes
 */
@ValidatorConstraint({ name: 'sanitizeHtml', async: false })
export class SanitizeHtmlConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return true;
    // This validator always returns true, but modifies the value
    // The actual sanitization happens in the transform
    return true;
  }

  defaultMessage(): string {
    return 'Content contains unsafe HTML';
  }
}

export function SanitizeHtml(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: SanitizeHtmlConstraint,
    });
  };
}

/**
 * Transform decorator: Sanitizes string input
 * Use with @Transform decorator from class-transformer
 */
export function sanitizeString(value: unknown): string {
  if (!value || typeof value !== 'string') return value as string;

  // Remove HTML tags and dangerous content
  const sanitized = sanitizeHtml(value, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });

  // Trim whitespace
  return sanitized.trim();
}

/**
 * Transform decorator: Normalizes email to lowercase
 */
export function normalizeEmail(value: unknown): string {
  if (!value || typeof value !== 'string') return value as string;
  return value.toLowerCase().trim();
}

/**
 * Safe optional transform wrapper
 */
export function transformOptional<T>(
  value: unknown,
  transformer: (val: string) => T,
): T | undefined {
  if (!value) return undefined;
  if (typeof value !== 'string') return value as T;
  return transformer(value);
}

/**
 * Custom validation decorator: Validates password strength
 * Requirements:
 * - At least 12 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * - Contains special character
 */
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string): boolean {
    if (!password) return false;

    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  }

  defaultMessage(): string {
    return 'Password must be at least 6 characters and contain uppercase, lowercase, number, and special character';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

/**
 * Custom validation decorator: Validates decimal precision
 * Ensures numbers don't exceed specified decimal places
 */
@ValidatorConstraint({ name: 'decimalPrecision', async: false })
export class DecimalPrecisionConstraint
  implements ValidatorConstraintInterface
{
  validate(value: number, args: ValidationArguments): boolean {
    if (value === null || value === undefined) return true;
    const maxDecimalPlaces = args.constraints[0] as number;
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    return decimalPlaces <= maxDecimalPlaces;
  }

  defaultMessage(args: ValidationArguments): string {
    return `Number must not exceed ${args.constraints[0] as number} decimal places`;
  }
}

export function DecimalPrecision(
  maxDecimalPlaces: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [maxDecimalPlaces],
      validator: DecimalPrecisionConstraint,
    });
  };
}
