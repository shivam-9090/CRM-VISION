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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Activity title',
    example: 'Follow up call with John',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Activity title is required' })
  @MinLength(2, { message: 'Activity title must be at least 2 characters' })
  @MaxLength(200, { message: 'Activity title must not exceed 200 characters' })
  @Transform(({ value }) => sanitizeString(value))
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the activity',
    example: 'Discuss Q4 contract renewal and pricing',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'Description must not exceed 2000 characters',
  })
  @Transform(({ value }) => transformOptional(value, sanitizeString))
  description?: string;

  @ApiProperty({
    description: 'Type of activity',
    enum: ActivityType,
    example: ActivityType.CALL,
  })
  @IsEnum(ActivityType, { message: 'Invalid activity type' })
  @IsNotEmpty({ message: 'Activity type is required' })
  type: ActivityType;

  @ApiProperty({
    description: 'Current status of the activity',
    enum: ActivityStatus,
    example: ActivityStatus.SCHEDULED,
  })
  @IsEnum(ActivityStatus, { message: 'Invalid activity status' })
  @IsNotEmpty({ message: 'Activity status is required' })
  status: ActivityStatus;

  @ApiProperty({
    description: 'Scheduled date and time (ISO 8601 format)',
    example: '2024-12-31T14:00:00Z',
  })
  @IsDateString(
    {},
    { message: 'Scheduled date must be a valid date (ISO 8601)' },
  )
  @IsNotEmpty({ message: 'Scheduled date is required' })
  scheduledDate: string;

  @ApiPropertyOptional({
    description: 'Related contact ID',
    example: 'clx1234567890',
  })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({
    description: 'Related deal ID',
    example: 'clx9876543210',
  })
  @IsOptional()
  @IsString()
  dealId?: string;

  @ApiPropertyOptional({
    description: 'Company ID (automatically set from authenticated user)',
  })
  @IsOptional()
  @IsString()
  companyId?: string;
}
