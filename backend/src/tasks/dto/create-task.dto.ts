import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskType, TaskStatus, Priority } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: 'Fix login bug' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Users cannot login with Google OAuth' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TaskType, example: TaskType.DEVELOPMENT })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({ enum: Priority, example: Priority.HIGH })
  @IsEnum(Priority)
  priority: Priority;

  @ApiPropertyOptional({ example: 8 })
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional({ example: '2025-12-20T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ example: 'comp_123' })
  @IsString()
  companyId: string;

  @ApiPropertyOptional({ example: 'deal_456' })
  @IsString()
  @IsOptional()
  dealId?: string;

  @ApiPropertyOptional({ example: 'contact_789' })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({ example: 'activity_101' })
  @IsString()
  @IsOptional()
  activityId?: string;

  @ApiPropertyOptional({ example: 'user_202' })
  @IsString()
  @IsOptional()
  assignedToId?: string;
}
