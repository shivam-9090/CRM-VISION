import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  TASK = 'TASK',
}

export enum ActivityStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateActivityDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsEnum(ActivityStatus)
  status: ActivityStatus;

  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  dealId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}