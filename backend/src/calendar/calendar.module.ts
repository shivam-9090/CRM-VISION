import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { EventsGateway } from './events.gateway';
import { CalendarReminderProcessor } from './calendar-reminder.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'calendar-reminders',
    }),
  ],
  controllers: [CalendarController],
  providers: [CalendarService, EventsGateway, CalendarReminderProcessor],
  exports: [CalendarService, EventsGateway],
})
export class CalendarModule {}
