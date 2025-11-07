import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  Patch,
  Body,
  Headers,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { PushNotificationService } from './push-notification.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import {
  UpdatePreferencesDto,
  SetTypePreferenceDto,
  MuteEntityDto,
  ToggleChannelDto,
  SetQuietHoursDto,
  SubscribePushDto,
  PaginatedNotificationsQueryDto,
  SnoozeNotificationDto,
  SnoozeByDurationDto,
} from './dto';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly pushService: PushNotificationService,
  ) {}

  @Get()
  @Permissions(PERMISSIONS.NOTIFICATION_READ)
  async findAll(@Req() req: any, @Query() query: PaginatedNotificationsQueryDto) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.findAll(userId, companyId, {
      page: query.page,
      limit: query.limit,
      type: query.type,
      isRead: query.isRead,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }

  @Get('unread')
  @Permissions(PERMISSIONS.NOTIFICATION_READ)
  async findUnread(@Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.findUnread(userId, companyId);
  }

  @Get('unread/count')
  @Permissions(PERMISSIONS.NOTIFICATION_READ)
  async getUnreadCount(@Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    const count = await this.notificationsService.getUnreadCount(
      userId,
      companyId,
    );
    return { count };
  }

  @Patch(':id/read')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.markAsRead(id, userId, companyId);
  }

  @Post('mark-all-read')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async markAllAsRead(@Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.markAllAsRead(userId, companyId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.NOTIFICATION_DELETE)
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.delete(id, userId, companyId);
  }

  // ============================================
  // SNOOZE/MUTE ENDPOINTS
  // ============================================

  @Post(':id/snooze')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async snoozeNotification(
    @Param('id') id: string,
    @Body() dto: SnoozeNotificationDto,
    @Req() req: any,
  ) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    const snoozedUntil = new Date(dto.snoozedUntil);
    return this.notificationsService.snoozeNotification(
      id,
      userId,
      companyId,
      snoozedUntil,
    );
  }

  @Post(':id/snooze-duration')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async snoozeNotificationByDuration(
    @Param('id') id: string,
    @Body() dto: SnoozeByDurationDto,
    @Req() req: any,
  ) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.snoozeNotificationByDuration(
      id,
      userId,
      companyId,
      dto.minutes,
    );
  }

  @Delete(':id/snooze')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async unsnoozeNotification(@Param('id') id: string, @Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.unsnoozeNotification(
      id,
      userId,
      companyId,
    );
  }

  @Post(':id/mute')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async muteNotification(@Param('id') id: string, @Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.muteNotification(id, userId, companyId);
  }

  @Delete(':id/mute')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async unmuteNotification(@Param('id') id: string, @Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.unmuteNotification(id, userId, companyId);
  }

  // ============================================
  // NOTIFICATION PREFERENCES ENDPOINTS
  // ============================================

  @Get('preferences')
  @Permissions(PERMISSIONS.NOTIFICATION_READ)
  async getPreferences(@Req() req: any) {
    const userId = req.user['sub'];
    return this.preferencesService.getPreferences(userId);
  }

  @Patch('preferences')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async updatePreferences(
    @Req() req: any,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const userId = req.user['sub'];
    return this.preferencesService.updatePreferences(userId, dto);
  }

  @Post('preferences/channel/:channel')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async toggleChannel(
    @Param('channel') channel: 'email' | 'push' | 'inApp',
    @Req() req: any,
    @Body() dto: ToggleChannelDto,
  ) {
    const userId = req.user['sub'];
    return this.preferencesService.toggleChannel(
      userId,
      channel,
      dto.enabled,
    );
  }

  @Post('preferences/types/:type')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async setTypePreference(
    @Param('type') type: string,
    @Req() req: any,
    @Body() dto: Omit<SetTypePreferenceDto, 'type'>,
  ) {
    const userId = req.user['sub'];
    return this.preferencesService.setTypePreference(userId, {
      ...dto,
      type: type as any,
    });
  }

  @Post('preferences/quiet-hours')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async setQuietHours(@Req() req: any, @Body() dto: SetQuietHoursDto) {
    const userId = req.user['sub'];
    return this.preferencesService.setQuietHours(
      userId,
      dto.start,
      dto.end,
      dto.enabled,
    );
  }

  @Post('preferences/mute')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async muteEntity(@Req() req: any, @Body() dto: MuteEntityDto) {
    const userId = req.user['sub'];
    return this.preferencesService.addMutedEntity(userId, dto);
  }

  @Delete('preferences/mute/:entityType/:entityId')
  @Permissions(PERMISSIONS.NOTIFICATION_DELETE)
  async unmuteEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Req() req: any,
  ) {
    const userId = req.user['sub'];
    return this.preferencesService.removeMutedEntity(
      userId,
      entityType,
      entityId,
    );
  }

  // ============================================
  // PUSH NOTIFICATION ENDPOINTS
  // ============================================

  @Get('push/vapid-public-key')
  async getVapidPublicKey() {
    return {
      publicKey: this.pushService.getPublicKey(),
    };
  }

  @Post('push/subscribe')
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  async subscribeToPush(
    @Req() req: any,
    @Body() dto: SubscribePushDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    const userId = req.user['sub'];
    return this.pushService.subscribe(userId, dto, userAgent);
  }

  @Delete('push/unsubscribe/:endpoint')
  @Permissions(PERMISSIONS.NOTIFICATION_DELETE)
  async unsubscribeFromPush(
    @Param('endpoint') endpoint: string,
    @Req() req: any,
  ) {
    const userId = req.user['sub'];
    // URL-decode the endpoint parameter
    const decodedEndpoint = decodeURIComponent(endpoint);
    return this.pushService.unsubscribe(userId, decodedEndpoint);
  }

  @Get('push/subscriptions')
  @Permissions(PERMISSIONS.NOTIFICATION_READ)
  async getPushSubscriptions(@Req() req: any) {
    const userId = req.user['sub'];
    return this.pushService.getUserSubscriptions(userId);
  }

  @Delete('push/subscriptions')
  @Permissions(PERMISSIONS.NOTIFICATION_DELETE)
  async deleteAllPushSubscriptions(@Req() req: any) {
    const userId = req.user['sub'];
    return this.pushService.deleteAllUserSubscriptions(userId);
  }
}
