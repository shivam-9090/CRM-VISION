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
} from '@nestjs/common';
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

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('google/auth-url')
  @ApiOperation({ summary: 'Get Google OAuth URL for connecting calendar' })
  @ApiResponse({ status: 200, description: 'Returns OAuth URL' })
  getGoogleAuthUrl() {
    const url = this.calendarService.getGoogleAuthUrl();
    return { url };
  }

  @Post('google/connect')
  @ApiOperation({ summary: 'Connect Google Calendar with authorization code' })
  @ApiResponse({ status: 200, description: 'Calendar connected successfully' })
  async connectGoogle(@Request() req, @Body() dto: GoogleCalendarConnectDto) {
    return this.calendarService.connectGoogleCalendar(req.user.id, dto.code);
  }

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

  @Post('meetings')
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiResponse({ status: 201, description: 'Meeting created successfully' })
  async createMeeting(@Request() req, @Body() dto: CreateMeetingDto) {
    return this.calendarService.createMeeting(req.user.id, dto);
  }

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

  @Get('meetings/:id')
  @ApiOperation({ summary: 'Get meeting by ID' })
  async getMeeting(@Param('id') id: string) {
    // Implementation similar to getMeetings but for single meeting
    return { message: 'Get single meeting' };
  }

  @Put('meetings/:id')
  @ApiOperation({ summary: 'Update a meeting' })
  async updateMeeting(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.calendarService.updateMeeting(req.user.id, id, dto);
  }

  @Delete('meetings/:id')
  @ApiOperation({ summary: 'Delete a meeting' })
  async deleteMeeting(@Param('id') id: string, @Request() req) {
    return this.calendarService.deleteMeeting(req.user.id, id);
  }
}
