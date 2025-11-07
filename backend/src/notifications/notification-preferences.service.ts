import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import {
  UpdatePreferencesDto,
  SetTypePreferenceDto,
  MuteEntityDto,
} from './dto/notification-preferences.dto';

interface TypePreferences {
  [key: string]: {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    inAppEnabled?: boolean;
  };
}

interface MutedEntity {
  entityType: string;
  entityId: string;
}

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create notification preferences for a user
   * If preferences don't exist, create with default values
   */
  async getPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          pushEnabled: true,
          inAppEnabled: true,
          typePreferences: {},
          soundEnabled: true,
          soundType: 'default',
          quietHoursEnabled: false,
          mutedEntities: [],
          groupingEnabled: true,
          groupingWindow: 300, // 5 minutes
        },
      });
    }

    return preferences;
  }

  /**
   * Update notification preferences for a user
   */
  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    // Ensure preferences exist first
    await this.getPreferences(userId);

    return this.prisma.notificationPreference.update({
      where: { userId },
      data: dto,
    });
  }

  /**
   * Toggle a notification channel on/off
   */
  async toggleChannel(
    userId: string,
    channel: 'email' | 'push' | 'inApp',
    enabled: boolean,
  ) {
    await this.getPreferences(userId);

    const fieldMap = {
      email: 'emailEnabled',
      push: 'pushEnabled',
      inApp: 'inAppEnabled',
    };

    return this.prisma.notificationPreference.update({
      where: { userId },
      data: { [fieldMap[channel]]: enabled },
    });
  }

  /**
   * Set channel preferences for a specific notification type
   */
  async setTypePreference(userId: string, dto: SetTypePreferenceDto) {
    const preferences = await this.getPreferences(userId);
    const typePreferences = (preferences.typePreferences as TypePreferences) || {};

    // Update or create preference for this type
    typePreferences[dto.type] = {
      emailEnabled: dto.emailEnabled,
      pushEnabled: dto.pushEnabled,
      inAppEnabled: dto.inAppEnabled,
    };

    return this.prisma.notificationPreference.update({
      where: { userId },
      data: { typePreferences },
    });
  }

  /**
   * Add an entity to the muted list
   */
  async addMutedEntity(userId: string, dto: MuteEntityDto) {
    const preferences = await this.getPreferences(userId);
    const mutedEntities = (preferences.mutedEntities as unknown as MutedEntity[]) || [];

    // Check if already muted
    const alreadyMuted = mutedEntities.some(
      (entity) =>
        entity.entityType === dto.entityType &&
        entity.entityId === dto.entityId,
    );

    if (!alreadyMuted) {
      mutedEntities.push({
        entityType: dto.entityType,
        entityId: dto.entityId,
      });

      return this.prisma.notificationPreference.update({
        where: { userId },
        data: { mutedEntities: mutedEntities as any },
      });
    }

    return preferences;
  }

  /**
   * Remove an entity from the muted list
   */
  async removeMutedEntity(
    userId: string,
    entityType: string,
    entityId: string,
  ) {
    const preferences = await this.getPreferences(userId);
    const mutedEntities = (preferences.mutedEntities as unknown as MutedEntity[]) || [];

    const filtered = mutedEntities.filter(
      (entity) =>
        !(entity.entityType === entityType && entity.entityId === entityId),
    );

    return this.prisma.notificationPreference.update({
      where: { userId },
      data: { mutedEntities: filtered as any },
    });
  }

  /**
   * Set quiet hours for a user
   */
  async setQuietHours(
    userId: string,
    start: string,
    end: string,
    enabled: boolean,
  ) {
    await this.getPreferences(userId);

    return this.prisma.notificationPreference.update({
      where: { userId },
      data: {
        quietHoursEnabled: enabled,
        quietHoursStart: start,
        quietHoursEnd: end,
      },
    });
  }

  /**
   * Check if current time is within user's quiet hours
   */
  async isInQuietHours(userId: string): Promise<boolean> {
    const preferences = await this.getPreferences(userId);

    if (!preferences.quietHoursEnabled || !preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes since midnight

    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);

    const quietStart = startHour * 60 + startMin;
    const quietEnd = endHour * 60 + endMin;

    // Handle quiet hours that span midnight (e.g., 22:00 - 08:00)
    if (quietStart > quietEnd) {
      return currentTime >= quietStart || currentTime < quietEnd;
    }

    return currentTime >= quietStart && currentTime < quietEnd;
  }

  /**
   * Check if entity is muted
   */
  async isEntityMuted(
    userId: string,
    entityType: string,
    entityId: string,
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId);
    const mutedEntities = (preferences.mutedEntities as unknown as MutedEntity[]) || [];

    return mutedEntities.some(
      (entity) =>
        entity.entityType === entityType && entity.entityId === entityId,
    );
  }

  /**
   * Core logic: Determine if notification should be sent via a specific channel
   * Checks: quiet hours, muted entities, channel enabled, type-specific preferences
   */
  async shouldNotify(
    userId: string,
    notificationType: NotificationType,
    channel: 'email' | 'push' | 'inApp',
    entityType?: string,
    entityId?: string,
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId);

    // Check quiet hours (applies to all channels)
    if (await this.isInQuietHours(userId)) {
      return false;
    }

    // Check if entity is muted
    if (entityType && entityId) {
      if (await this.isEntityMuted(userId, entityType, entityId)) {
        return false;
      }
    }

    // Check global channel setting
    const channelEnabledMap = {
      email: preferences.emailEnabled,
      push: preferences.pushEnabled,
      inApp: preferences.inAppEnabled,
    };

    if (!channelEnabledMap[channel]) {
      return false;
    }

    // Check type-specific preferences (overrides global)
    const typePreferences = preferences.typePreferences as TypePreferences;
    if (typePreferences && typePreferences[notificationType]) {
      const typeChannelPref = typePreferences[notificationType];
      
      if (channel === 'email' && typeChannelPref.emailEnabled !== undefined) {
        return typeChannelPref.emailEnabled;
      }
      if (channel === 'push' && typeChannelPref.pushEnabled !== undefined) {
        return typeChannelPref.pushEnabled;
      }
      if (channel === 'inApp' && typeChannelPref.inAppEnabled !== undefined) {
        return typeChannelPref.inAppEnabled;
      }
    }

    // Default: use global channel preference
    return channelEnabledMap[channel];
  }

  /**
   * Get all enabled channels for a notification
   */
  async getEnabledChannels(
    userId: string,
    notificationType: NotificationType,
    entityType?: string,
    entityId?: string,
  ): Promise<string[]> {
    const channels: string[] = [];

    for (const channel of ['email', 'push', 'inApp'] as const) {
      if (
        await this.shouldNotify(
          userId,
          notificationType,
          channel,
          entityType,
          entityId,
        )
      ) {
        channels.push(channel);
      }
    }

    return channels;
  }
}
