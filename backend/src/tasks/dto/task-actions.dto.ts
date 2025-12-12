import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class AssignTaskDto {
  @ApiProperty({ example: 'user_123' })
  @IsString()
  assignedToId: string;
}

export class StartTaskDto {
  @ApiPropertyOptional({ example: 'Starting work on this task' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CompleteTaskDto {
  @ApiProperty({ example: 5.5 })
  @IsNumber()
  actualHours: number;

  @ApiPropertyOptional({
    example: 'Task completed successfully. Fixed OAuth bug.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiPropertyOptional({ example: 'Blocked by API team' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 2.5 })
  @IsNumber()
  @IsOptional()
  hoursSpent?: number;
}
