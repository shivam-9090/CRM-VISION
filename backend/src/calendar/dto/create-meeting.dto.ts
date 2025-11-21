import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  IsJSON,
  ValidateNested,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeetingAttendeeDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  optional?: boolean;
}

export class MeetingReminderDto {
  @ApiProperty({ example: 15, description: 'Minutes before meeting' })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  minutes: number;

  @ApiProperty({
    example: 'EMAIL',
    enum: ['EMAIL', 'NOTIFICATION', 'POPUP'],
  })
  @IsString()
  @IsEnum(['EMAIL', 'NOTIFICATION', 'POPUP'])
  @IsNotEmpty()
  method: 'EMAIL' | 'NOTIFICATION' | 'POPUP';
}

export class CreateMeetingDto {
  @ApiProperty({ example: 'Product Demo with ACME Corp' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Discuss Q4 product features and pricing' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Conference Room A' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: '2025-11-25T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '2025-11-25T11:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsString()
  @IsOptional()
  timeZone?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @ApiPropertyOptional({ example: 'deal_123' })
  @IsString()
  @IsOptional()
  dealId?: string;

  @ApiPropertyOptional({ example: 'contact_456' })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({
    type: [MeetingAttendeeDto],
    example: [{ email: 'john@example.com', name: 'John Doe' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingAttendeeDto)
  @IsOptional()
  attendees?: MeetingAttendeeDto[];

  @ApiPropertyOptional({
    type: [MeetingReminderDto],
    example: [
      { minutes: 15, method: 'notification' },
      { minutes: 60, method: 'email' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingReminderDto)
  @IsOptional()
  reminders?: MeetingReminderDto[];

  @ApiPropertyOptional({ example: 'Meeting agenda and objectives...' })
  @IsString()
  @IsOptional()
  agenda?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Sync to Google Calendar',
  })
  @IsBoolean()
  @IsOptional()
  syncToGoogle?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Add Google Meet link' })
  @IsBoolean()
  @IsOptional()
  addGoogleMeet?: boolean;
}
