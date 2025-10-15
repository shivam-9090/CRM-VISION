import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DealStage } from '@prisma/client';

export class CreateDealDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value),
  )
  value?: number;

  @IsEnum(DealStage)
  @IsOptional()
  stage?: DealStage;

  @IsString()
  companyId: string;

  @IsString()
  contactId: string;
}