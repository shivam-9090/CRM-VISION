import { IsEmail, IsInt, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class InviteDto {
  @IsEmail()
  email: string;

  @IsInt()
  companyId: number;

  @IsEnum(Role)
  role: Role;
}