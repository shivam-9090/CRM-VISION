import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@prisma/client';
import {
  IsStrongPassword,
  IsPhoneNumber,
  normalizeEmail,
  sanitizeString,
  transformOptional,
} from '../../common/decorators/validation.decorators';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => normalizeEmail(value))
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @IsStrongPassword({
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Transform(({ value }) => sanitizeString(value))
  name: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Company name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Company name must not exceed 100 characters' })
  @Transform(({ value }) => transformOptional(value, sanitizeString))
  companyName?: string;

  @IsString()
  @IsOptional()
  @IsPhoneNumber({ message: 'Please provide a valid phone number' })
  @Transform(({ value }) => transformOptional(value, sanitizeString))
  phone?: string;

  @IsString()
  @IsOptional()
  companyId?: string;

  @IsEnum(Role, { message: 'Invalid role specified' })
  @IsOptional()
  role?: Role;
}
