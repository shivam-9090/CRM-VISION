import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';

export enum ExportEntityType {
  CONTACTS = 'contacts',
  DEALS = 'deals',
  ACTIVITIES = 'activities',
  COMPANIES = 'companies',
}

export enum ExportSchedule {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ONCE = 'once',
}

export enum ExportJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class CreateScheduledExportDto {
  @IsEnum(ExportEntityType)
  entityType: ExportEntityType;

  @IsEnum(ExportSchedule)
  schedule: ExportSchedule;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @IsOptional()
  filters?: Record<string, any>;

  @IsOptional()
  @IsEnum(['csv', 'excel', 'json', 'xml'])
  format?: string = 'csv';
}
