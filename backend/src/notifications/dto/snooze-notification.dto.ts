import { IsDateString, IsOptional, IsInt, Min } from 'class-validator';

export class SnoozeNotificationDto {
  @IsDateString()
  snoozedUntil: string; // ISO date string
}

export class SnoozeByDurationDto {
  @IsInt()
  @Min(1)
  minutes: number; // Snooze for X minutes from now
}
