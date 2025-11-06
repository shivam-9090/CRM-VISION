import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  sanitizeString,
  transformOptional,
} from '../../common/decorators/validation.decorators';

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
  @IsNotEmpty({ message: 'Activity title is required' })
  @MinLength(2, { message: 'Activity title must be at least 2 characters' })
  @MaxLength(200, { message: 'Activity title must not exceed 200 characters' })
  @Transform(({ value }) => sanitizeString(value))
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'Description must not exceed 2000 characters',
  })
  @Transform(({ value }) => transformOptional(value, sanitizeString))
  description?: string;

  @IsEnum(ActivityType, { message: 'Invalid activity type' })
  @IsNotEmpty({ message: 'Activity type is required' })
  type: ActivityType;

  @IsEnum(ActivityStatus, { message: 'Invalid activity status' })
  @IsNotEmpty({ message: 'Activity status is required' })
  status: ActivityStatus;

  @IsDateString(
    {},
    { message: 'Scheduled date must be a valid date (ISO 8601)' },
  )
  @IsNotEmpty({ message: 'Scheduled date is required' })
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
