import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from './events.gateway';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/dto/create-notification.dto';

@Processor('calendar-reminders')
export class CalendarReminderProcessor {
  private readonly logger = new Logger(CalendarReminderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process('send-reminder')
  async handleReminder(job: Job) {
    const { meetingId, method } = job.data;

    try {
      const meeting = await this.prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          organizer: true,
          company: true,
        },
      });

      if (!meeting) {
        this.logger.warn(`Meeting ${meetingId} not found`);
        return;
      }

      // Log the reminder
      this.logger.log(
        `Processing ${method} reminder for meeting: ${meeting.title}`,
      );

      // Send reminder based on method
      switch (method) {
        case 'EMAIL':
          await this.sendEmailReminder(meeting);
          break;
        case 'NOTIFICATION':
          await this.sendNotificationReminder(meeting);
          break;
        case 'POPUP':
          await this.sendPopupReminder(meeting);
          break;
        default:
          this.logger.warn(`Unknown reminder method: ${method}`);
      }

      // Update reminder status
      await this.prisma.meetingReminder.updateMany({
        where: {
          meetingId,
          method,
          sentAt: null,
        },
        data: {
          sentAt: new Date(),
        },
      });

      this.logger.log(`${method} reminder sent for meeting: ${meeting.title}`);
    } catch (error) {
      this.logger.error(
        `Failed to send ${method} reminder for meeting ${meetingId}`,
        error,
      );
      throw error;
    }
  }

  private async sendEmailReminder(meeting: any) {
    const { organizer, company } = meeting;

    // Calculate time until meeting
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const minutesUntil = Math.floor(
      (startTime.getTime() - now.getTime()) / 60000,
    );

    let timeDescription = '';
    if (minutesUntil < 60) {
      timeDescription = `in ${minutesUntil} minutes`;
    } else {
      const hours = Math.floor(minutesUntil / 60);
      timeDescription = `in ${hours} hour${hours > 1 ? 's' : ''}`;
    }

    // Prepare email
    const subject = `📅 Meeting Reminder: ${meeting.title}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .meeting-details { background-color: white; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #4F46E5; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white !important; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Meeting Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${organizer.name},</p>
            <p>This is a reminder that you have a meeting coming up ${timeDescription}.</p>
            
            <div class="meeting-details">
              <h3 style="margin-top: 0;">${meeting.title}</h3>
              <div class="detail-row">
                <span class="label">📅 When:</span> ${new Date(meeting.startTime).toLocaleString()}
              </div>
              <div class="detail-row">
                <span class="label">⏱️ Duration:</span> ${Math.floor((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / 60000)} minutes
              </div>
              ${meeting.location ? `<div class="detail-row"><span class="label">📍 Location:</span> ${meeting.location}</div>` : ''}
              ${meeting.googleMeetLink ? `<div class="detail-row"><span class="label">🎥 Google Meet:</span> <a href="${meeting.googleMeetLink}">${meeting.googleMeetLink}</a></div>` : ''}
              ${meeting.description ? `<div class="detail-row"><span class="label">📝 Description:</span><br/>${meeting.description}</div>` : ''}
              ${meeting.agenda ? `<div class="detail-row"><span class="label">📋 Agenda:</span><br/>${meeting.agenda}</div>` : ''}
            </div>

            ${meeting.googleMeetLink ? `<a href="${meeting.googleMeetLink}" class="button">Join Google Meet</a>` : ''}
            
            <div class="footer">
              <p>This is an automated reminder from your CRM Calendar System.</p>
              <p>Company: ${company.name}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use sendEmailDirect for immediate HTML email delivery
    await this.emailService.sendEmailDirect({
      to: organizer.email,
      subject,
      html,
    });
  }

  private async sendNotificationReminder(meeting: any) {
    const { organizer, company } = meeting;

    // Calculate time until meeting
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const minutesUntil = Math.floor(
      (startTime.getTime() - now.getTime()) / 60000,
    );

    let timeDescription = '';
    if (minutesUntil < 60) {
      timeDescription = `in ${minutesUntil} minutes`;
    } else {
      const hours = Math.floor(minutesUntil / 60);
      timeDescription = `in ${hours} hour${hours > 1 ? 's' : ''}`;
    }

    // Create in-app notification
    await this.notificationsService.create(
      {
        userId: meeting.organizerId,
        title: `Meeting Reminder: ${meeting.title}`,
        message: `Your meeting "${meeting.title}" is starting ${timeDescription}`,
        type: NotificationType.MEETING_REMINDER,
        metadata: {
          meetingId: meeting.id,
          startTime: meeting.startTime,
          location: meeting.location,
          googleMeetLink: meeting.googleMeetLink,
        },
      },
      company.id,
    );
  }

  private async sendPopupReminder(meeting: any) {
    // Send real-time popup via WebSocket
    this.eventsGateway.emitMeetingReminder(
      meeting.companyId,
      meeting.organizerId,
      {
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location,
        googleMeetLink: meeting.googleMeetLink,
        description: meeting.description,
        organizer: meeting.organizer,
      },
    );
  }
}
