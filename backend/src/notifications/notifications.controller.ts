import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Permissions(PERMISSIONS.NOTIFICATION_READ)
  async findAll(@Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.findAll(userId, companyId);
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
}
