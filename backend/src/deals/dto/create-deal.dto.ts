import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DealStage } from '@prisma/client';

export class CreateDealDto {
  @IsString()
  title: string;

  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value),
  )
  value: number;

  @IsEnum(DealStage)
  stage: DealStage;

  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value),
  )
  probability: number;

  @IsDateString()
  expectedCloseDate: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  contactId?: string;
}