import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskType, TaskStatus, Priority } from '@prisma/client';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Fix login bug - Updated' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Users cannot login with Google OAuth - Added workaround',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskType, example: TaskType.DEVELOPMENT })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiPropertyOptional({ enum: Priority, example: Priority.URGENT })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ example: 6 })
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional({ example: 5.5 })
  @IsNumber()
  @IsOptional()
  actualHours?: number;

  @ApiPropertyOptional({ example: '2025-12-20T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'user_303' })
  @IsString()
  @IsOptional()
  assignedToId?: string;
}
