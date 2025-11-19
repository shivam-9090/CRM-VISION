import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationPreferencesService } from './notification-preferences.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationGroupingService } from './notification-grouping.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private preferencesService: NotificationPreferencesService,
    private pushService: PushNotificationService,
    @Inject(forwardRef(() => NotificationsGateway))
    private gateway: NotificationsGateway,
    private groupingService: NotificationGroupingService,
  ) {}

  async create(dto: CreateNotificationDto, companyId: string) {
    // Check if entity is muted by user
    if (dto.entityType && dto.entityId) {
      const isMuted = await this.preferencesService.isEntityMuted(
        dto.userId,
        dto.entityType,
        dto.entityId,
      );

      if (isMuted) {
        this.logger.debug(
          `Notification blocked: Entity ${dto.entityType}:${dto.entityId} is muted by user ${dto.userId}`,
        );
        return null; // Don't create notification for muted entities
      }
    }

    // Generate group key for similar notifications
    const groupKey = this.groupingService.generateGroupKey(
      dto.type,
      dto.entityType,
      dto.entityId,
    );

    // Check for existing notification in grouping window
    const preferences = await this.preferencesService.getPreferences(
      dto.userId,
    );
    const groupingWindow = this.groupingService.getGroupingWindow(
      preferences.groupingEnabled ? preferences.groupingWindow : 0,
    );

    if (preferences.groupingEnabled && groupKey) {
      const existingNotification =
        await this.groupingService.findGroupableNotification(
          dto.userId,
          groupKey,
          groupingWindow,
        );

      // Update existing notification instead of creating new one
      if (existingNotification) {
        const newCount = existingNotification.groupCount + 1;
        const updatedNotification =
          await this.groupingService.updateGroupedNotification(
            existingNotification.id,
            newCount,
          );

        this.logger.log(
          `Grouped notification ${existingNotification.id}, count: ${updatedNotification.groupCount}`,
        );

        // Send update via enabled channels
        await this.sendNotification(updatedNotification);
        return updatedNotification;
      }
    }

    // Create new notification
    const notification = await this.prisma.notification.create({
      data: {
        type: dto.type,
        title: dto.title,
        message: dto.message,
        entityType: dto.entityType,
        entityId: dto.entityId,
        userId: dto.userId,
        companyId,
        groupKey,
        groupCount: 1,
      },
    });

    // Send notification via enabled channels
    await this.sendNotification(notification);

    return notification;
  }

  /**
   * Send notification via all enabled channels (WebSocket, Push, Email)
   */
  private async sendNotification(notification: any) {
    try {
      // Get enabled channels for this notification type
      const enabledChannels = await this.preferencesService.getEnabledChannels(
        notification.userId,
        notification.type,
        notification.entityType,
        notification.entityId,
      );

      this.logger.debug(
        `Enabled channels for user ${notification.userId}: ${enabledChannels.join(', ')}`,
      );

      // Send via in-app (WebSocket)
      if (enabledChannels.includes('inApp')) {
        this.gateway.emitToUser(notification.userId, 'notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          entityType: notification.entityType,
          entityId: notification.entityId,
          isRead: notification.isRead,
          groupCount: notification.groupCount,
          createdAt: notification.createdAt,
        });
        this.logger.debug(
          `Sent WebSocket notification to user ${notification.userId}`,
        );
      }

      // Send via push notification
      if (enabledChannels.includes('push')) {
        await this.pushService.sendToAllDevices(
          notification.userId,
          notification.title,
          notification.message,
          {
            notificationId: notification.id,
            type: notification.type,
            entityType: notification.entityType,
            entityId: notification.entityId,
            url: this.groupingService.getNotificationUrl(
              notification.type,
              notification.entityType,
            ),
          },
        );
        this.logger.debug(
          `Sent push notification to user ${notification.userId}`,
        );
      }

      // TODO: Send via email (if enabled)
      // This would integrate with the existing email service
      if (enabledChannels.includes('email')) {
        // await this.emailService.sendNotificationEmail(notification);
        this.logger.debug(
          `Email notification queued for user ${notification.userId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${notification.id}`,
        error,
      );
      // Don't throw error - notification is already saved in DB
    }
  }

  async findAll(
    userId: string,
    companyId: string,
    filters?: {
      page?: number;
      limit?: number;
      type?: string;
      isRead?: boolean;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const now = new Date();
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause with filters
    const where: any = {
      userId,
      companyId,
      isMuted: false, // Exclude muted notifications
      OR: [
        { snoozedUntil: null }, // Not snoozed
        { snoozedUntil: { lte: now } }, // Snooze expired
      ],
    };

    // Add optional filters
    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // Get total count for pagination
    const total = await this.prisma.notification.count({ where });

    // Get paginated data
    const data = await this.prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findUnread(userId: string, companyId: string) {
    const now = new Date();

    return this.prisma.notification.findMany({
      where: {
        userId,
        companyId,
        isRead: false,
        isMuted: false, // Exclude muted notifications
        OR: [
          { snoozedUntil: null }, // Not snoozed
          { snoozedUntil: { lte: now } }, // Snooze expired
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUnreadCount(userId: string, companyId: string): Promise<number> {
    const now = new Date();

    return this.prisma.notification.count({
      where: {
        userId,
        companyId,
        isRead: false,
        isMuted: false, // Exclude muted notifications
        OR: [
          { snoozedUntil: null }, // Not snoozed
          { snoozedUntil: { lte: now } }, // Snooze expired
        ],
      },
    });
  }

  async markAsRead(id: string, userId: string, companyId: string) {
    return this.prisma.notification.update({
      where: {
        id,
        userId,
        companyId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: string, companyId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        companyId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async delete(id: string, userId: string, companyId: string) {
    return this.prisma.notification.delete({
      where: {
        id,
        userId,
        companyId,
      },
    });
  }

  /**
   * Snooze a notification until a specific date/time
   */
  async snoozeNotification(
    id: string,
    userId: string,
    companyId: string,
    snoozedUntil: Date,
  ) {
    // Verify notification belongs to user
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, companyId },
    });

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { snoozedUntil },
    });
  }

  /**
   * Snooze a notification for a specific duration (in minutes)
   */
  async snoozeNotificationByDuration(
    id: string,
    userId: string,
    companyId: string,
    minutes: number,
  ) {
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
    return this.snoozeNotification(id, userId, companyId, snoozedUntil);
  }

  /**
   * Unsnooze a notification (clear snoozedUntil field)
   */
  async unsnoozeNotification(id: string, userId: string, companyId: string) {
    // Verify notification belongs to user
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, companyId },
    });

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { snoozedUntil: null },
    });
  }

  /**
   * Mute a notification (mark as muted)
   */
  async muteNotification(id: string, userId: string, companyId: string) {
    // Verify notification belongs to user
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, companyId },
    });

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isMuted: true },
    });
  }

  /**
   * Unmute a notification (clear isMuted field)
   */
  async unmuteNotification(id: string, userId: string, companyId: string) {
    // Verify notification belongs to user
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, companyId },
    });

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isMuted: false },
    });
  }
}
