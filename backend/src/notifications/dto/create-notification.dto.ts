import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export enum NotificationType {
  DEAL_CREATED = 'DEAL_CREATED',
  DEAL_UPDATED = 'DEAL_UPDATED',
  DEAL_ASSIGNED = 'DEAL_ASSIGNED',
  DEAL_STATUS_CHANGED = 'DEAL_STATUS_CHANGED',
  CONTACT_CREATED = 'CONTACT_CREATED',
  CONTACT_UPDATED = 'CONTACT_UPDATED',
  ACTIVITY_CREATED = 'ACTIVITY_CREATED',
  ACTIVITY_ASSIGNED = 'ACTIVITY_ASSIGNED',
  ACTIVITY_DUE_SOON = 'ACTIVITY_DUE_SOON',
  COMMENT_ADDED = 'COMMENT_ADDED',
  MENTION = 'MENTION',
  SYSTEM = 'SYSTEM',
}

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}
