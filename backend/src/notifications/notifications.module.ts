import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationGroupingService } from './notification-grouping.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationPreferencesService,
    PushNotificationService,
    NotificationGroupingService,
    NotificationsGateway,
  ],
  exports: [
    NotificationsService,
    NotificationPreferencesService,
    PushNotificationService,
    NotificationGroupingService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
