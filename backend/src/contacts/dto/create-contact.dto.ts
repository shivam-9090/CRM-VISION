import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  normalizeEmail,
  sanitizeString,
  IsPhoneNumber,
  transformOptional,
} from '../../common/decorators/validation.decorators';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(1, { message: 'First name must be at least 1 character' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  @Transform(({ value }) => sanitizeString(value))
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(1, { message: 'Last name must be at least 1 character' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  @Transform(({ value }) => sanitizeString(value))
  lastName: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @Transform(({ value }) => transformOptional(value, normalizeEmail))
  email?: string;

  @IsOptional()
  @IsPhoneNumber({ message: 'Please provide a valid phone number' })
  @Transform(({ value }) => transformOptional(value, sanitizeString))
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'Position must not exceed 150 characters' })
  @Transform(({ value }) => transformOptional(value, sanitizeString))
  position?: string;

  @IsString()
  @IsNotEmpty({ message: 'Company ID is required' })
  companyId: string;
}
