import { IsEmail, IsString, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class InviteDto {
  @IsEmail()
  email: string;

  @IsString()
  companyId: string;

  @IsEnum(Role)
  role: Role;
}