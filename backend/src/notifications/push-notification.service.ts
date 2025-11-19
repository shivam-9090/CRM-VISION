import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as webPush from 'web-push';

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private vapidKeys: {
    publicKey: string;
    privateKey: string;
    subject: string;
  };

  constructor(private readonly prisma: PrismaService) {
    // Initialize VAPID keys from environment variables
    this.vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || '',
      privateKey: process.env.VAPID_PRIVATE_KEY || '',
      subject: process.env.VAPID_SUBJECT || 'mailto:admin@crm.com',
    };

    // Configure web-push with VAPID details
    if (this.vapidKeys.publicKey && this.vapidKeys.privateKey) {
      webPush.setVapidDetails(
        this.vapidKeys.subject,
        this.vapidKeys.publicKey,
        this.vapidKeys.privateKey,
      );
      this.logger.log('Web Push configured with VAPID keys');
    } else {
      this.logger.warn(
        'VAPID keys not configured. Push notifications will not work. Run: npx web-push generate-vapid-keys',
      );
    }
  }

  /**
   * Get VAPID public key for client-side subscription
   */
  getPublicKey(): string {
    return this.vapidKeys.publicKey;
  }

  /**
   * Subscribe a user to push notifications
   * Stores the subscription in the database
   */
  async subscribe(
    userId: string,
    subscription: PushSubscriptionPayload,
    userAgent?: string,
  ) {
    try {
      // Check if subscription already exists
      const existing = await this.prisma.pushSubscription.findUnique({
        where: { endpoint: subscription.endpoint },
      });

      if (existing) {
        // Update if exists (user might re-subscribe from same device)
        return await this.prisma.pushSubscription.update({
          where: { endpoint: subscription.endpoint },
          data: {
            keys: subscription.keys as any,
            userAgent,
            updatedAt: new Date(),
          },
        });
      }

      // Create new subscription
      return await this.prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys as any,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to subscribe user ${userId} to push notifications`,
        error,
      );
      throw new BadRequestException('Failed to create push subscription');
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string, endpoint: string) {
    try {
      const subscription = await this.prisma.pushSubscription.findUnique({
        where: { endpoint },
      });

      if (!subscription || subscription.userId !== userId) {
        throw new BadRequestException('Subscription not found');
      }

      await this.prisma.pushSubscription.delete({
        where: { endpoint },
      });

      this.logger.log(`User ${userId} unsubscribed from push notifications`);
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe user ${userId} from push notifications`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send push notification to a specific subscription
   */
  private async sendToEndpoint(
    subscription: any,
    payload: any,
  ): Promise<boolean> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      };

      await webPush.sendNotification(pushSubscription, JSON.stringify(payload));

      return true;
    } catch (error: any) {
      // Handle expired subscriptions
      if (error.statusCode === 410) {
        this.logger.warn(
          `Subscription expired (410 Gone): ${subscription.endpoint}`,
        );
        // Delete expired subscription
        await this.prisma.pushSubscription
          .delete({
            where: { endpoint: subscription.endpoint },
          })
          .catch(() => {
            /* ignore */
          });
        return false;
      }

      this.logger.error(
        `Failed to send push notification to ${subscription.endpoint}`,
        error,
      );
      return false;
    }
  }

  /**
   * Send push notification to a specific user (all their devices)
   */
  async sendPushNotification(userId: string, payload: any) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      this.logger.debug(`No push subscriptions found for user ${userId}`);
      return;
    }

    const results = await Promise.allSettled(
      subscriptions.map((sub) => this.sendToEndpoint(sub, payload)),
    );

    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value === true,
    ).length;

    this.logger.log(
      `Sent push notifications to ${successCount}/${subscriptions.length} devices for user ${userId}`,
    );
  }

  /**
   * Send push notification to all user devices with rich content
   */
  async sendToAllDevices(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ) {
    const payload = {
      title,
      body,
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        ...data,
        timestamp: Date.now(),
        url: data?.url || '/dashboard',
      },
      actions: [
        {
          action: 'view',
          title: 'View',
        },
        {
          action: 'close',
          title: 'Close',
        },
      ],
    };

    await this.sendPushNotification(userId, payload);
  }

  /**
   * Get all push subscriptions for a user
   */
  async getUserSubscriptions(userId: string) {
    return await this.prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete all push subscriptions for a user
   */
  async deleteAllUserSubscriptions(userId: string) {
    const result = await this.prisma.pushSubscription.deleteMany({
      where: { userId },
    });

    this.logger.log(
      `Deleted ${result.count} push subscriptions for user ${userId}`,
    );

    return result;
  }
}
