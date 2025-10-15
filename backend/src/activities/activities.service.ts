import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createActivityDto: CreateActivityDto, userId: string) {
    return this.prisma.activity.create({
      data: {
        ...createActivityDto,
        scheduledDate: new Date(createActivityDto.scheduledDate),
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(companyId?: string, type?: string) {
    const where: any = {};
    
    if (companyId) {
      where.OR = [
        { companyId },
        { user: { companyId } },
      ];
    }
    
    if (type) {
      where.type = type;
    }

    return this.prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });
  }

  async findOne(id: string, companyId?: string) {
    const where: any = { id };
    
    if (companyId) {
      where.OR = [
        { companyId },
        { user: { companyId } },
      ];
    }

    const activity = await this.prisma.activity.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto, companyId?: string) {
    const where: any = { id };
    
    if (companyId) {
      where.OR = [
        { companyId },
        { user: { companyId } },
      ];
    }

    const activity = await this.prisma.activity.findFirst({ where });
    
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const updateData: any = { ...updateActivityDto };
    if (updateActivityDto.scheduledDate) {
      updateData.scheduledDate = new Date(updateActivityDto.scheduledDate);
    }

    return this.prisma.activity.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string, companyId?: string) {
    const where: any = { id };
    
    if (companyId) {
      where.OR = [
        { companyId },
        { user: { companyId } },
      ];
    }

    const activity = await this.prisma.activity.findFirst({ where });
    
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return this.prisma.activity.delete({
      where: { id },
    });
  }
}