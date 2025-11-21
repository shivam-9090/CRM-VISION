import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  Headers,
  Res,
  SetMetadata,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { GoogleCalendarConnectDto } from './dto/google-calendar-connect.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

// Decorator to mark public routes
export const Public = () => SetMetadata('isPublic', true);

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('google/auth-url')
  @ApiOperation({ summary: 'Get Google OAuth URL for connecting calendar' })
  @ApiResponse({ status: 200, description: 'Returns OAuth URL' })
  getGoogleAuthUrl(@Request() req) {
    const url = this.calendarService.getGoogleAuthUrl(req.user.id);
    return { url };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('google/connect')
  @ApiOperation({ summary: 'Connect Google Calendar with authorization code' })
  @ApiResponse({ status: 200, description: 'Calendar connected successfully' })
  async connectGoogle(@Request() req, @Body() dto: GoogleCalendarConnectDto) {
    return this.calendarService.connectGoogleCalendar(req.user.id, dto.code);
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'OAuth callback from Google Calendar' })
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      // Decode user ID from state parameter
      const userId = state
        ? Buffer.from(state, 'base64').toString('utf-8')
        : '';

      if (!userId || !code) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Error</title>
              <style>
                body { font-family: Arial; text-align: center; padding: 50px; }
                .error { color: #dc2626; }
              </style>
            </head>
            <body>
              <h2 class="error">❌ Invalid Request</h2>
              <p>Missing required parameters.</p>
              <script>
                setTimeout(() => window.close(), 3000);
              </script>
            </body>
          </html>
        `);
      }

      await this.calendarService.connectGoogleCalendar(userId, code);

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Connected Successfully</title>
            <style>
              body { 
                font-family: 'Segoe UI', Arial, sans-serif; 
                text-align: center; 
                padding: 50px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                margin: 0;
              }
              .container {
                background: white;
                color: #333;
                padding: 40px;
                border-radius: 15px;
                max-width: 500px;
                margin: 0 auto;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              }
              h2 { color: #10b981; margin-bottom: 10px; }
              .icon { font-size: 60px; margin-bottom: 20px; }
              p { font-size: 16px; color: #6b7280; }
              .features {
                text-align: left;
                margin: 20px auto;
                max-width: 350px;
              }
              .feature {
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .feature:last-child { border-bottom: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✅</div>
              <h2>Google Calendar Connected!</h2>
              <p>Your CRM is now synced with Google Calendar.</p>
              
              <div class="features">
                <div class="feature">✨ Two-way sync enabled</div>
                <div class="feature">📅 Meetings auto-sync</div>
                <div class="feature">🎥 Google Meet links</div>
                <div class="feature">🔔 Real-time updates</div>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px;">
                This window will close automatically...
              </p>
            </div>
            <script>
              // Notify parent window
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GOOGLE_AUTH_SUCCESS',
                  message: 'Google Calendar connected successfully'
                }, '*');
              }
              
              // Auto-close after 3 seconds
              setTimeout(() => {
                window.close();
              }, 3000);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Connection Failed</title>
            <style>
              body { 
                font-family: 'Segoe UI', Arial, sans-serif; 
                text-align: center; 
                padding: 50px;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                margin: 0;
              }
              .container {
                background: white;
                color: #333;
                padding: 40px;
                border-radius: 15px;
                max-width: 500px;
                margin: 0 auto;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              }
              h2 { color: #dc2626; margin-bottom: 10px; }
              .icon { font-size: 60px; margin-bottom: 20px; }
              p { font-size: 16px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">❌</div>
              <h2>Connection Failed</h2>
              <p>Unable to connect Google Calendar.</p>
              <p style="font-size: 14px; margin-top: 20px;">
                ${error instanceof Error ? error.message : 'Please try again.'}
              </p>
              <p style="margin-top: 30px; font-size: 14px;">
                This window will close automatically...
              </p>
            </div>
            <script>
              // Notify parent window
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GOOGLE_AUTH_ERROR',
                  message: 'Failed to connect Google Calendar'
                }, '*');
              }
              
              // Auto-close after 4 seconds
              setTimeout(() => {
                window.close();
              }, 4000);
            </script>
          </body>
        </html>
      `);
    }
  }

  @Public()
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Google Calendar push notification webhook' })
  async handleGoogleWebhook(
    @Headers('x-goog-channel-id') channelId: string,
    @Headers('x-goog-resource-state') resourceState: string,
  ) {
    await this.calendarService.handleGoogleWebhook(channelId, resourceState);
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('meetings')
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiResponse({ status: 201, description: 'Meeting created successfully' })
  async createMeeting(@Request() req, @Body() dto: CreateMeetingDto) {
    return this.calendarService.createMeeting(req.user.id, dto);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('meetings')
  @ApiOperation({ summary: 'Get all meetings for user' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getMeetings(@Request() req, @Query() filters: any) {
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : undefined;
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined;
    const status = filters.status;

    return this.calendarService.getMeetings(
      req.user.id,
      startDate,
      endDate,
      status,
    );
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('meetings/:id')
  @ApiOperation({ summary: 'Get meeting by ID' })
  async getMeeting(@Param('id') id: string) {
    // Implementation similar to getMeetings but for single meeting
    return { message: 'Get single meeting' };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Put('meetings/:id')
  @ApiOperation({ summary: 'Update a meeting' })
  async updateMeeting(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.calendarService.updateMeeting(req.user.id, id, dto);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Delete('meetings/:id')
  @ApiOperation({ summary: 'Delete a meeting' })
  async deleteMeeting(@Param('id') id: string, @Request() req) {
    return this.calendarService.deleteMeeting(req.user.id, id);
  }
}
