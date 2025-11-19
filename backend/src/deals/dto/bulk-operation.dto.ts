import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { DealStage, Priority } from '@prisma/client';

export class BulkDeleteDto {
  @IsArray()
  @IsString({ each: true })
  dealIds: string[];
}

export class BulkUpdateDto {
  @IsArray()
  @IsString({ each: true })
  dealIds: string[];

  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}
