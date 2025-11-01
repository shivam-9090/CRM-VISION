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

@Controller('api/notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.findAll(userId, companyId);
  }

  @Get('unread')
  async findUnread(@Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.findUnread(userId, companyId);
  }

  @Get('unread/count')
  async getUnreadCount(@Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    const count = await this.notificationsService.getUnreadCount(userId, companyId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.markAsRead(id, userId, companyId);
  }

  @Post('mark-all-read')
  async markAllAsRead(@Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.markAllAsRead(userId, companyId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user['sub'];
    const companyId = req.user['companyId'];
    return this.notificationsService.delete(id, userId, companyId);
  }
}
