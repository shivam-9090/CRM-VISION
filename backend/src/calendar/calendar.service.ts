import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { EventsGateway } from './events.gateway';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly oauth2Client: OAuth2Client;
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventsGateway: EventsGateway,
    @InjectQueue('calendar-reminders') private reminderQueue: Queue,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );

    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || '';
  }

  /**
   * Get Google OAuth URL for authorization
   */
  getGoogleAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    // Encode userId in state parameter for callback
    const state = Buffer.from(userId).toString('base64');

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state,
    });
  }

  /**
   * Connect Google Calendar after OAuth callback
   */
  async connectGoogleCalendar(userId: string, code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      if (
        !tokens.access_token ||
        !tokens.refresh_token ||
        !tokens.expiry_date
      ) {
        throw new BadRequestException('Invalid tokens received from Google');
      }

      const encryptedAccessToken = this.encrypt(tokens.access_token);
      const encryptedRefreshToken = this.encrypt(tokens.refresh_token);

      await this.prisma.googleCalendarToken.upsert({
        where: { userId },
        create: {
          userId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiry: new Date(tokens.expiry_date),
          isConnected: true,
        },
        update: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiry: new Date(tokens.expiry_date),
          isConnected: true,
          lastSyncAt: new Date(),
        },
      });

      await this.setupGoogleCalendarWatch(userId);

      this.logger.log(`Google Calendar connected for user ${userId}`);
      return {
        success: true,
        message: 'Google Calendar connected successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to connect Google Calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException('Failed to connect Google Calendar');
    }
  }

  /**
   * Setup Google Calendar push notifications
   */
  private async setupGoogleCalendarWatch(userId: string) {
    try {
      const token = await this.prisma.googleCalendarToken.findUnique({
        where: { userId },
      });

      if (!token) {
        throw new NotFoundException('Google Calendar not connected');
      }

      this.oauth2Client.setCredentials({
        access_token: this.decrypt(token.accessToken),
        refresh_token: this.decrypt(token.refreshToken),
      });

      const calendar = google.calendar({
        version: 'v3',
        auth: this.oauth2Client,
      });

      const webhookUrl = `${this.configService.get<string>('APP_URL')}/api/calendar/webhook`;
      const channelId = `${userId}-${Date.now()}`;

      const response = await calendar.events.watch({
        calendarId: 'primary',
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
        },
      });

      if (response.data.expiration) {
        await this.prisma.googleCalendarToken.update({
          where: { userId },
          data: {
            channelId,
            channelExpiry: new Date(parseInt(response.data.expiration)),
          },
        });
      }

      this.logger.log(`Google Calendar watch setup for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to setup Google Calendar watch: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create a new meeting
   */
  async createMeeting(userId: string, dto: CreateMeetingDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.companyId) {
        throw new NotFoundException('User or company not found');
      }

      const meetingData: Prisma.MeetingCreateInput = {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        attendees: dto.attendees
          ? (JSON.parse(JSON.stringify(dto.attendees)) as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        agenda: dto.agenda,
        organizer: { connect: { id: userId } },
        company: { connect: { id: user.companyId } },
      };

      if (dto.contactId) {
        meetingData.contact = { connect: { id: dto.contactId } };
      }

      if (dto.dealId) {
        meetingData.deal = { connect: { id: dto.dealId } };
      }

      const meeting = await this.prisma.meeting.create({
        data: meetingData,
        include: {
          organizer: true,
          company: true,
          contact: true,
          deal: true,
        },
      });

      if (dto.syncToGoogle) {
        await this.syncMeetingToGoogle(meeting.id, userId, dto.addGoogleMeet);
      }

      if (dto.reminders && dto.reminders.length > 0) {
        await this.scheduleReminders(
          meeting.id,
          dto.reminders,
          new Date(dto.startTime),
        );
      }

      this.eventsGateway.emitMeetingCreated(user.companyId, meeting);

      return meeting;
    } catch (error) {
      this.logger.error(
        `Failed to create meeting: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Update a meeting
   */
  async updateMeeting(
    userId: string,
    meetingId: string,
    dto: UpdateMeetingDto,
  ) {
    try {
      const meeting = await this.prisma.meeting.findUnique({
        where: { id: meetingId },
      });

      if (!meeting) {
        throw new NotFoundException('Meeting not found');
      }

      if (meeting.organizerId !== userId) {
        throw new BadRequestException('Not authorized to update this meeting');
      }

      const updateData: Prisma.MeetingUpdateInput = {};

      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.description !== undefined)
        updateData.description = dto.description;
      if (dto.location !== undefined) updateData.location = dto.location;
      if (dto.startTime !== undefined) updateData.startTime = dto.startTime;
      if (dto.endTime !== undefined) updateData.endTime = dto.endTime;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.notes !== undefined) updateData.notes = dto.notes;
      if (dto.agenda !== undefined) updateData.agenda = dto.agenda;
      if (dto.attendees !== undefined) {
        updateData.attendees = dto.attendees
          ? JSON.parse(JSON.stringify(dto.attendees))
          : Prisma.JsonNull;
      }

      const updatedMeeting = await this.prisma.meeting.update({
        where: { id: meetingId },
        data: updateData,
        include: {
          organizer: true,
          company: true,
          contact: true,
          deal: true,
        },
      });

      if (meeting.googleEventId) {
        await this.updateGoogleEvent(userId, updatedMeeting);
      }

      if (dto.reminders && dto.reminders.length > 0) {
        await this.prisma.meetingReminder.deleteMany({
          where: { meetingId, sentAt: null },
        });
        await this.scheduleReminders(
          meetingId,
          dto.reminders,
          dto.startTime ? new Date(dto.startTime) : meeting.startTime,
        );
      }

      this.eventsGateway.emitMeetingUpdated(
        updatedMeeting.companyId,
        updatedMeeting,
      );

      return updatedMeeting;
    } catch (error) {
      this.logger.error(
        `Failed to update meeting: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Delete a meeting
   */
  async deleteMeeting(userId: string, meetingId: string) {
    try {
      const meeting = await this.prisma.meeting.findUnique({
        where: { id: meetingId },
      });

      if (!meeting) {
        throw new NotFoundException('Meeting not found');
      }

      if (meeting.organizerId !== userId) {
        throw new BadRequestException('Not authorized to delete this meeting');
      }

      if (meeting.googleEventId) {
        await this.deleteGoogleEvent(userId, meeting.googleEventId);
      }

      await this.prisma.meetingReminder.deleteMany({
        where: { meetingId },
      });

      await this.prisma.meeting.delete({
        where: { id: meetingId },
      });

      this.eventsGateway.emitMeetingDeleted(meeting.companyId, meetingId);

      return { success: true, message: 'Meeting deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete meeting: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Get user's meetings
   */
  async getMeetings(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    status?: string,
  ) {
    const where: Prisma.MeetingWhereInput = {
      organizerId: userId,
    };

    if (startDate && endDate) {
      where.startTime = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (status) {
      where.status = status as any;
    }

    return this.prisma.meeting.findMany({
      where,
      include: {
        organizer: true,
        company: true,
        contact: true,
        deal: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  /**
   * Sync meeting to Google Calendar
   */
  private async syncMeetingToGoogle(
    meetingId: string,
    userId: string,
    addGoogleMeet: boolean = false,
  ) {
    try {
      const meeting = await this.prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          organizer: true,
        },
      });

      if (!meeting) {
        throw new NotFoundException('Meeting not found');
      }

      const token = await this.prisma.googleCalendarToken.findUnique({
        where: { userId },
      });

      if (!token || !token.isConnected) {
        this.logger.warn('Google Calendar not connected');
        return;
      }

      this.oauth2Client.setCredentials({
        access_token: this.decrypt(token.accessToken),
        refresh_token: this.decrypt(token.refreshToken),
      });

      const calendar = google.calendar({
        version: 'v3',
        auth: this.oauth2Client,
      });

      const attendees = Array.isArray(meeting.attendees)
        ? (meeting.attendees as any[]).map((a: any) => ({
            email: a.email,
            displayName: a.name,
          }))
        : [];

      const event: calendar_v3.Schema$Event = {
        summary: meeting.title,
        description: meeting.description || undefined,
        location: meeting.location || undefined,
        start: {
          dateTime: meeting.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: meeting.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees,
        conferenceData: addGoogleMeet
          ? {
              createRequest: {
                requestId: `meet-${meetingId}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            }
          : undefined,
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: addGoogleMeet ? 1 : undefined,
      });

      await this.prisma.meeting.update({
        where: { id: meetingId },
        data: {
          googleEventId: response.data.id || undefined,
          googleMeetLink: response.data.hangoutLink || undefined,
        },
      });

      this.logger.log(`Meeting synced to Google Calendar: ${meetingId}`);
    } catch (error) {
      this.logger.error(
        `Failed to sync meeting to Google: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Update Google Calendar event
   */
  private async updateGoogleEvent(userId: string, meeting: any) {
    try {
      const token = await this.prisma.googleCalendarToken.findUnique({
        where: { userId },
      });

      if (!token || !token.isConnected || !meeting.googleEventId) {
        return;
      }

      this.oauth2Client.setCredentials({
        access_token: this.decrypt(token.accessToken),
        refresh_token: this.decrypt(token.refreshToken),
      });

      const calendar = google.calendar({
        version: 'v3',
        auth: this.oauth2Client,
      });

      const attendees = Array.isArray(meeting.attendees)
        ? (meeting.attendees as any[]).map((a: any) => ({
            email: a.email,
            displayName: a.name,
          }))
        : [];

      const event: calendar_v3.Schema$Event = {
        summary: meeting.title,
        description: meeting.description || undefined,
        location: meeting.location || undefined,
        start: {
          dateTime: meeting.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: meeting.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees,
      };

      await calendar.events.update({
        calendarId: 'primary',
        eventId: meeting.googleEventId,
        requestBody: event,
      });

      this.logger.log(
        `Google Calendar event updated: ${meeting.googleEventId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update Google event: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete Google Calendar event
   */
  private async deleteGoogleEvent(userId: string, eventId: string) {
    try {
      const token = await this.prisma.googleCalendarToken.findUnique({
        where: { userId },
      });

      if (!token || !token.isConnected) {
        return;
      }

      this.oauth2Client.setCredentials({
        access_token: this.decrypt(token.accessToken),
        refresh_token: this.decrypt(token.refreshToken),
      });

      const calendar = google.calendar({
        version: 'v3',
        auth: this.oauth2Client,
      });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      this.logger.log(`Google Calendar event deleted: ${eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete Google event: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Handle Google Calendar webhook notifications
   */
  async handleGoogleWebhook(channelId: string, resourceState: string) {
    try {
      if (resourceState !== 'exists') {
        return;
      }

      const token = await this.prisma.googleCalendarToken.findFirst({
        where: { channelId },
      });

      if (!token) {
        this.logger.warn(`No token found for channel: ${channelId}`);
        return;
      }

      await this.syncFromGoogle(token.userId);
    } catch (error) {
      this.logger.error(
        `Failed to handle Google webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Sync events from Google Calendar to CRM
   */
  private async syncFromGoogle(userId: string) {
    try {
      const token = await this.prisma.googleCalendarToken.findUnique({
        where: { userId },
      });

      if (!token || !token.isConnected) {
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.companyId) {
        return;
      }

      this.oauth2Client.setCredentials({
        access_token: this.decrypt(token.accessToken),
        refresh_token: this.decrypt(token.refreshToken),
      });

      const calendar = google.calendar({
        version: 'v3',
        auth: this.oauth2Client,
      });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
        syncToken: token.syncToken || undefined,
      });

      const events = response.data.items || [];

      for (const event of events) {
        await this.processGoogleEvent(event, userId, user.companyId);
      }

      if (response.data.nextSyncToken) {
        await this.prisma.googleCalendarToken.update({
          where: { userId },
          data: {
            syncToken: response.data.nextSyncToken,
            lastSyncAt: new Date(),
          },
        });
      }

      this.logger.log(`Synced ${events.length} events from Google Calendar`);
    } catch (error) {
      this.logger.error(
        `Failed to sync from Google: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Process a single Google Calendar event
   */
  private async processGoogleEvent(
    event: calendar_v3.Schema$Event,
    userId: string,
    companyId: string,
  ) {
    try {
      if (!event.id || !event.start || !event.end) {
        return;
      }

      const startDateTime = event.start.dateTime || event.start.date;
      const endDateTime = event.end.dateTime || event.end.date;

      if (!startDateTime || !endDateTime) {
        return;
      }

      const existingMeeting = await this.prisma.meeting.findFirst({
        where: { googleEventId: event.id },
      });

      const attendees = event.attendees
        ? event.attendees.map((a) => ({
            email: a.email || '',
            name: a.displayName || a.email || '',
          }))
        : [];

      if (event.status === 'cancelled' && existingMeeting) {
        await this.prisma.meeting.delete({
          where: { id: existingMeeting.id },
        });
        this.eventsGateway.emitMeetingDeleted(companyId, existingMeeting.id);
        return;
      }

      const meetingData = {
        title: event.summary || 'Untitled Event',
        description: event.description || null,
        location: event.location || null,
        startTime: new Date(startDateTime),
        endTime: new Date(endDateTime),
        attendees: attendees as Prisma.InputJsonValue,
        googleEventId: event.id,
        googleMeetLink: event.hangoutLink || null,
      };

      if (existingMeeting) {
        const updatedMeeting = await this.prisma.meeting.update({
          where: { id: existingMeeting.id },
          data: meetingData,
          include: {
            organizer: true,
            company: true,
          },
        });
        this.eventsGateway.emitMeetingUpdated(companyId, updatedMeeting);
      } else {
        const newMeeting = await this.prisma.meeting.create({
          data: {
            ...meetingData,
            organizerId: userId,
            companyId,
          },
          include: {
            organizer: true,
            company: true,
          },
        });
        this.eventsGateway.emitMeetingCreated(companyId, newMeeting);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process Google event: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Schedule meeting reminders
   */
  private async scheduleReminders(
    meetingId: string,
    reminders: Array<{ method: string; minutes: number }>,
    startTime: Date,
  ) {
    try {
      for (const reminder of reminders) {
        const reminderTime = new Date(
          startTime.getTime() - reminder.minutes * 60000,
        );

        await this.prisma.meetingReminder.create({
          data: {
            meetingId,
            method: reminder.method as any,
            minutesBefore: reminder.minutes,
            scheduledFor: reminderTime,
          },
        });

        const delay = reminderTime.getTime() - Date.now();
        if (delay > 0) {
          await this.reminderQueue.add(
            'send-reminder',
            {
              meetingId,
              method: reminder.method,
            },
            {
              delay,
              removeOnComplete: true,
            },
          );
        }
      }

      this.logger.log(
        `Scheduled ${reminders.length} reminders for meeting ${meetingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule reminders: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Refresh expired tokens
   */
  private async refreshAccessToken(userId: string) {
    try {
      const token = await this.prisma.googleCalendarToken.findUnique({
        where: { userId },
      });

      if (!token) {
        return;
      }

      this.oauth2Client.setCredentials({
        refresh_token: this.decrypt(token.refreshToken),
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (credentials.access_token && credentials.expiry_date) {
        await this.prisma.googleCalendarToken.update({
          where: { userId },
          data: {
            accessToken: this.encrypt(credentials.access_token),
            tokenExpiry: new Date(credentials.expiry_date),
          },
        });
      }

      this.logger.log(`Access token refreshed for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv,
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(text: string): string {
    const parts = text.split(':');
    const ivString = parts.shift();

    if (!ivString) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(ivString, 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv,
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
