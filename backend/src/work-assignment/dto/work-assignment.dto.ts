import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuggestAssignmentDto {
  @ApiProperty({ example: 'task_123' })
  @IsString()
  taskId: string;

  @ApiPropertyOptional({
    example: ['React', 'TypeScript', 'API Integration'],
    description: 'Required skills for this task',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredSkills?: string[];
}

export class AcceptSuggestionDto {
  @ApiProperty({ example: 'suggestion_123' })
  @IsString()
  suggestionId: string;
}

export class RejectSuggestionDto {
  @ApiProperty({ example: 'suggestion_123' })
  @IsString()
  suggestionId: string;

  @ApiPropertyOptional({ example: 'Employee is on vacation this week' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class AutoAssignTaskDto {
  @ApiProperty({ example: 'task_123' })
  @IsString()
  taskId: string;

  @ApiPropertyOptional({
    example: ['React', 'TypeScript'],
    description: 'Required skills for auto-assignment',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredSkills?: string[];
}
