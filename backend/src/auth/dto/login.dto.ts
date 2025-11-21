import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail } from '../../common/decorators/validation.decorators';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => normalizeEmail(value))
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;

  @IsOptional()
  @IsString()
  @Length(6, 6, { message: '2FA code must be exactly 6 characters' })
  twoFactorToken?: string;
}
