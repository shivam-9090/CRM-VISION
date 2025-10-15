import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsString()
  companyName: string;

  @IsString()
  industry: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.ADMIN; // Company owner is admin by default
}