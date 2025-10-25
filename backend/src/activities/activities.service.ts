import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { Activity } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createActivityDto: CreateActivityDto, companyId: string) {
    return this.prisma.activity.create({
      data: {
        ...createActivityDto,
        scheduledDate: new Date(createActivityDto.scheduledDate),
        companyId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(
    companyId?: string,
    pagination: PaginationDto = {},
    type?: string,
  ): Promise<PaginatedResponse<Activity>> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (companyId) {
      where.companyId = companyId;
    }
    
    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: {
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
        skip,
        take: limit,
      }),
      this.prisma.activity.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string, companyId?: string) {
    const where: any = { id };
    
    if (companyId) {
      where.companyId = companyId;
    }

    const activity = await this.prisma.activity.findFirst({
      where,
      include: {
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
      where.companyId = companyId;
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
      where.companyId = companyId;
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