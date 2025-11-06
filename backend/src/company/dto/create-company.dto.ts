import {
  IsString,
  IsOptional,
  IsEmail,
  IsUrl,
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

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  @MinLength(2, { message: 'Company name must be at least 2 characters' })
  @MaxLength(200, { message: 'Company name must not exceed 200 characters' })
  @Transform(({ value }) => sanitizeString(value))
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Industry is required' })
  @MinLength(2, { message: 'Industry must be at least 2 characters' })
  @MaxLength(100, { message: 'Industry must not exceed 100 characters' })
  @Transform(({ value }) => sanitizeString(value))
  industry: string;

  @IsString()
  @IsNotEmpty({ message: 'Company size is required' })
  @MinLength(1, { message: 'Company size is required' })
  @MaxLength(50, { message: 'Company size must not exceed 50 characters' })
  @Transform(({ value }) => sanitizeString(value))
  size: string;

  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid website URL' })
  @MaxLength(500, { message: 'Website URL must not exceed 500 characters' })
  website?: string;

  @IsOptional()
  @IsPhoneNumber({ message: 'Please provide a valid phone number' })
  @Transform(({ value }) => transformOptional(value, sanitizeString))
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @Transform(({ value }) => transformOptional(value, normalizeEmail))
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Address must not exceed 500 characters' })
  @Transform(({ value }) => transformOptional(value, sanitizeString))
  address?: string;
}
