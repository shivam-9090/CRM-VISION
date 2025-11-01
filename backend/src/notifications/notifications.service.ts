import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto, companyId: string) {
    return this.prisma.notification.create({
      data: {
        type: dto.type,
        title: dto.title,
        message: dto.message,
        entityType: dto.entityType,
        entityId: dto.entityId,
        userId: dto.userId,
        companyId,
      },
    });
  }

  async findAll(userId: string, companyId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 notifications
    });
  }

  async findUnread(userId: string, companyId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        companyId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUnreadCount(userId: string, companyId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        companyId,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string, userId: string, companyId: string) {
    return this.prisma.notification.update({
      where: {
        id,
        userId,
        companyId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: string, companyId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        companyId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async delete(id: string, userId: string, companyId: string) {
    return this.prisma.notification.delete({
      where: {
        id,
        userId,
        companyId,
      },
    });
  }
}
