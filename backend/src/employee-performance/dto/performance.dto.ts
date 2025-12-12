import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePerformanceReviewDto {
  @ApiProperty({ example: 'user_123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  reviewPeriodStart: string;

  @ApiProperty({ example: '2025-03-31T23:59:59Z' })
  @IsDateString()
  reviewPeriodEnd: string;

  @ApiProperty({ example: 8.5 })
  @IsNumber()
  qualityScore: number;

  @ApiPropertyOptional({ example: 'Excellent performance this quarter' })
  @IsString()
  @IsOptional()
  reviewNotes?: string;

  @ApiPropertyOptional({
    example: ['fast_delivery', 'quality_work', 'team_player'],
  })
  @IsArray()
  @IsOptional()
  strengths?: string[];

  @ApiPropertyOptional({
    example: ['needs_better_communication', 'time_management'],
  })
  @IsArray()
  @IsOptional()
  improvements?: string[];
}

export class UpdateSkillsDto {
  @ApiProperty({ example: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'] })
  @IsArray()
  @IsString({ each: true })
  skillTags: string[];
}

export class UpdateWorkCapacityDto {
  @ApiProperty({
    example: 7,
    description: 'Maximum concurrent tasks employee can handle',
  })
  @IsNumber()
  workCapacity: number;
}
