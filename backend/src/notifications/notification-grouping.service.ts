import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationGroupingService {
  private readonly logger = new Logger(NotificationGroupingService.name);

  // Types that support grouping (can be consolidated into single notification)
  private readonly GROUPABLE_TYPES: NotificationType[] = [
    NotificationType.DEAL_CREATED,
    NotificationType.DEAL_UPDATED,
    NotificationType.CONTACT_CREATED,
    NotificationType.CONTACT_UPDATED,
    NotificationType.ACTIVITY_CREATED,
    NotificationType.COMMENT_ADDED,
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a notification type supports grouping
   */
  isGroupable(type: NotificationType): boolean {
    return this.GROUPABLE_TYPES.includes(type);
  }

  /**
   * Generate a group key for notifications
   * Format: TYPE:ENTITY_TYPE:ENTITY_ID
   * Example: DEAL_CREATED:Deal:123
   *
   * @returns groupKey string or null if type is not groupable
   */
  generateGroupKey(
    type: NotificationType,
    entityType?: string,
    entityId?: string,
  ): string | null {
    if (!this.isGroupable(type)) {
      return null;
    }

    // For entity-specific notifications, group by entity
    if (entityType && entityId) {
      return `${type}:${entityType}:${entityId}`;
    }

    // For general notifications, group by type only
    return `${type}:GENERAL`;
  }

  /**
   * Find an existing notification that can be grouped with a new notification
   * Looks for notifications with the same groupKey within the specified time window
   *
   * @param userId - User ID to check
   * @param groupKey - Group key to match
   * @param windowSeconds - Time window in seconds (notifications older than this are not grouped)
   * @returns Existing notification or null if none found
   */
  async findGroupableNotification(
    userId: string,
    groupKey: string,
    windowSeconds: number,
  ) {
    const cutoffTime = new Date(Date.now() - windowSeconds * 1000);

    try {
      const notification = await this.prisma.notification.findFirst({
        where: {
          userId,
          groupKey,
          createdAt: {
            gte: cutoffTime,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (notification) {
        this.logger.log(
          `Found groupable notification: ${notification.id} (groupKey: ${groupKey}, count: ${notification.groupCount})`,
        );
      }

      return notification;
    } catch (error) {
      this.logger.error(
        `Error finding groupable notification: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Update a grouped notification with new count and message
   *
   * @param notificationId - Notification ID to update
   * @param newCount - New group count
   * @returns Updated notification
   */
  async updateGroupedNotification(notificationId: string, newCount: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    const newMessage = this.getGroupedMessage(notification.type, newCount);

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        groupCount: newCount,
        message: newMessage,
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Updated grouped notification ${notificationId}: count=${newCount}`,
    );

    return updated;
  }

  /**
   * Generate a grouped message based on notification type and count
   *
   * @param type - Notification type
   * @param count - Number of grouped notifications
   * @returns Formatted message string
   */
  getGroupedMessage(type: NotificationType, count: number): string {
    if (count <= 1) {
      // For single notification, return default message (handled by caller)
      return '';
    }

    const messages: Partial<
      Record<NotificationType, (count: number) => string>
    > = {
      [NotificationType.DEAL_CREATED]: (n) => `${n} new deals created`,
      [NotificationType.DEAL_UPDATED]: (n) => `${n} deals updated`,
      [NotificationType.DEAL_ASSIGNED]: (n) => `${n} deals assigned to you`,
      [NotificationType.DEAL_STATUS_CHANGED]: (n) =>
        `${n} deal statuses changed`,
      [NotificationType.CONTACT_CREATED]: (n) => `${n} new contacts added`,
      [NotificationType.CONTACT_UPDATED]: (n) => `${n} contacts updated`,
      [NotificationType.ACTIVITY_CREATED]: (n) => `${n} new activities created`,
      [NotificationType.ACTIVITY_ASSIGNED]: (n) =>
        `${n} activities assigned to you`,
      [NotificationType.ACTIVITY_DUE_SOON]: (n) => `${n} activities due soon`,
      [NotificationType.COMMENT_ADDED]: (n) => `${n} new comments added`,
      [NotificationType.MENTION]: (n) => `${n} new mentions`,
      [NotificationType.SYSTEM]: (n) => `${n} system notifications`,
    };

    const messageGenerator = messages[type];
    if (messageGenerator) {
      return messageGenerator(count);
    }

    // Fallback message
    return `${count} new notifications`;
  }

  /**
   * Get URL for a grouped notification
   * Returns a general list view when multiple items are grouped
   *
   * @param type - Notification type
   * @param entityType - Entity type (if specific entity)
   * @returns URL path
   */
  getNotificationUrl(type: NotificationType, entityType?: string): string {
    // For specific entity types, route to list view
    if (entityType) {
      const entityRoutes: Record<string, string> = {
        Deal: '/deals',
        Contact: '/contacts',
        Activity: '/activities',
        Company: '/companies',
      };

      return entityRoutes[entityType] || '/dashboard';
    }

    // For general types, route based on notification type
    const typeRoutes: Partial<Record<NotificationType, string>> = {
      [NotificationType.DEAL_CREATED]: '/deals',
      [NotificationType.DEAL_UPDATED]: '/deals',
      [NotificationType.DEAL_ASSIGNED]: '/deals',
      [NotificationType.DEAL_STATUS_CHANGED]: '/deals',
      [NotificationType.CONTACT_CREATED]: '/contacts',
      [NotificationType.CONTACT_UPDATED]: '/contacts',
      [NotificationType.ACTIVITY_CREATED]: '/activities',
      [NotificationType.ACTIVITY_ASSIGNED]: '/activities',
      [NotificationType.ACTIVITY_DUE_SOON]: '/activities',
      [NotificationType.COMMENT_ADDED]: '/dashboard',
      [NotificationType.MENTION]: '/dashboard',
      [NotificationType.SYSTEM]: '/dashboard',
    };

    return typeRoutes[type] || '/dashboard';
  }

  /**
   * Calculate grouping window based on user preferences
   *
   * @param userPreferredWindow - User's preferred grouping window in seconds (from preferences)
   * @returns Grouping window in seconds
   */
  getGroupingWindow(userPreferredWindow?: number): number {
    const DEFAULT_WINDOW = 300; // 5 minutes
    const MIN_WINDOW = 60; // 1 minute
    const MAX_WINDOW = 3600; // 1 hour

    if (!userPreferredWindow) {
      return DEFAULT_WINDOW;
    }

    // Clamp to min/max range
    return Math.max(MIN_WINDOW, Math.min(MAX_WINDOW, userPreferredWindow));
  }
}
