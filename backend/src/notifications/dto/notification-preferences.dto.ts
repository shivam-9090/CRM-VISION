import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @IsOptional()
  @IsString()
  soundType?: 'default' | 'subtle' | 'none';

  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'quietHoursStart must be in HH:mm format (24-hour)',
  })
  quietHoursStart?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'quietHoursEnd must be in HH:mm format (24-hour)',
  })
  quietHoursEnd?: string;

  @IsOptional()
  @IsBoolean()
  groupingEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  groupingWindow?: number;
}

export class SetTypePreferenceDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;
}

export class MuteEntityDto {
  @IsString()
  entityType: string;

  @IsString()
  entityId: string;
}

export class ToggleChannelDto {
  @IsBoolean()
  enabled: boolean;
}

export class SetQuietHoursDto {
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start must be in HH:mm format (24-hour)',
  })
  start: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end must be in HH:mm format (24-hour)',
  })
  end: string;

  @IsBoolean()
  enabled: boolean;
}
