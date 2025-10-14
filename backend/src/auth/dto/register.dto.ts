import { IsEmail, IsString, MinLength, IsOptional, IsInt, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  companyId: number;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}