import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealStage, LeadSource, Priority } from '@prisma/client';
import {
  DecimalPrecision,
  sanitizeString,
  transformOptional,
} from '../../common/decorators/validation.decorators';

export class CreateDealDto {
  @ApiProperty({
    description: 'Deal title or name',
    example: 'Enterprise Software License - Acme Corp',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Deal title is required' })
  @MinLength(2, { message: 'Deal title must be at least 2 characters' })
  @MaxLength(200, { message: 'Deal title must not exceed 200 characters' })
  @Transform(({ value }) => sanitizeString(value))
  title: string;

  @ApiPropertyOptional({
    description: 'Deal value in company currency',
    example: 50000.0,
    minimum: 0,
    maximum: 999999999.99,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Value must be a valid number with max 2 decimal places' },
  )
  @Min(0, { message: 'Value must be a positive number' })
  @Max(999999999.99, { message: 'Value exceeds maximum allowed amount' })
  @DecimalPrecision(2)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value),
  )
  value?: number;

  @ApiPropertyOptional({
    description: 'Current stage in the deal pipeline',
    enum: DealStage,
    example: DealStage.QUALIFIED,
  })
  @IsEnum(DealStage, { message: 'Invalid deal stage' })
  @IsOptional()
  stage?: DealStage;

  @ApiPropertyOptional({
    description: 'How the lead was acquired',
    enum: LeadSource,
    example: LeadSource.WEBSITE,
  })
  @IsEnum(LeadSource, { message: 'Invalid lead source' })
  @IsOptional()
  leadSource?: LeadSource;

  @ApiPropertyOptional({
    description: 'Lead quality score (0-100)',
    example: 75,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt({ message: 'Lead score must be an integer' })
  @Min(0, { message: 'Lead score must be at least 0' })
  @Max(100, { message: 'Lead score must not exceed 100' })
  leadScore?: number;

  @ApiPropertyOptional({
    description: 'Deal priority level',
    enum: Priority,
    example: Priority.HIGH,
  })
  @IsEnum(Priority, { message: 'Invalid priority level' })
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Expected closing date (ISO 8601 format)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Expected close date must be a valid date (ISO 8601)' },
  )
  expectedCloseDate?: string;

  @ApiPropertyOptional({
    description: 'User ID to assign the deal to',
    example: 'clx1234567890',
  })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the deal',
    example: 'Customer is interested in enterprise plan with custom features',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Notes must not exceed 2000 characters' })
  @Transform(({ value }) => transformOptional(value, sanitizeString))
  notes?: string;

  @ApiPropertyOptional({
    description: 'Related contact ID',
    example: 'clx9876543210',
  })
  @IsOptional()
  @IsString()
  contactId?: string;
}
