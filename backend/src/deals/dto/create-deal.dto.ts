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
import { DealStage, LeadSource, Priority } from '@prisma/client';
import {
  DecimalPrecision,
  sanitizeString,
  transformOptional,
} from '../../common/decorators/validation.decorators';

export class CreateDealDto {
  @IsString()
  @IsNotEmpty({ message: 'Deal title is required' })
  @MinLength(2, { message: 'Deal title must be at least 2 characters' })
  @MaxLength(200, { message: 'Deal title must not exceed 200 characters' })
  @Transform(({ value }) => sanitizeString(value))
  title: string;

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

  @IsEnum(DealStage, { message: 'Invalid deal stage' })
  @IsOptional()
  stage?: DealStage;

  @IsEnum(LeadSource, { message: 'Invalid lead source' })
  @IsOptional()
  leadSource?: LeadSource;

  @IsOptional()
  @IsInt({ message: 'Lead score must be an integer' })
  @Min(0, { message: 'Lead score must be at least 0' })
  @Max(100, { message: 'Lead score must not exceed 100' })
  leadScore?: number;

  @IsEnum(Priority, { message: 'Invalid priority level' })
  @IsOptional()
  priority?: Priority;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Expected close date must be a valid date (ISO 8601)' },
  )
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Notes must not exceed 2000 characters' })
  @Transform(({ value }) => transformOptional(value, sanitizeString))
  notes?: string;

  @IsOptional()
  @IsString()
  contactId?: string;
}
