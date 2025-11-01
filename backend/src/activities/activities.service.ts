import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SanitizerService } from '../common/sanitizer.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { Activity } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    private sanitizer: SanitizerService,
  ) {}

  async create(createActivityDto: CreateActivityDto, companyId: string) {
    // ✅ Sanitize text inputs to prevent XSS
    const sanitizedData = {
      title: this.sanitizer.sanitizeText(createActivityDto.title) || '',
      description: createActivityDto.description
        ? this.sanitizer.sanitizeRichText(createActivityDto.description)
        : undefined,
      type: createActivityDto.type,
      status: createActivityDto.status,
      scheduledDate: new Date(createActivityDto.scheduledDate),
      dealId: createActivityDto.dealId,
      contactId: createActivityDto.contactId,
      companyId,
    };

    return this.prisma.activity.create({
      data: sanitizedData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
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
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          deal: {
            select: {
              id: true,
              title: true,
              stage: true,
              value: true,
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
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
            priority: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async update(
    id: string,
    updateActivityDto: UpdateActivityDto,
    companyId?: string,
  ) {
    const where: any = { id };

    if (companyId) {
      where.companyId = companyId;
    }

    const activity = await this.prisma.activity.findFirst({ where });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Sanitize text fields
    const updateData: any = {};

    if (updateActivityDto.title !== undefined) {
      updateData.title =
        this.sanitizer.sanitizeText(updateActivityDto.title) ?? undefined;
    }
    if (updateActivityDto.description !== undefined) {
      updateData.description =
        this.sanitizer.sanitizeRichText(updateActivityDto.description) ??
        undefined;
    }
    if (updateActivityDto.type !== undefined) {
      updateData.type = updateActivityDto.type;
    }
    if (updateActivityDto.status !== undefined) {
      updateData.status = updateActivityDto.status;
    }
    if (updateActivityDto.scheduledDate !== undefined) {
      updateData.scheduledDate = new Date(updateActivityDto.scheduledDate);
    }
    if (updateActivityDto.dealId !== undefined) {
      updateData.dealId = updateActivityDto.dealId;
    }
    if (updateActivityDto.contactId !== undefined) {
      updateData.contactId = updateActivityDto.contactId;
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
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
            priority: true,
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
