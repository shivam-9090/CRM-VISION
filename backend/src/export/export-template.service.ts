import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduledExportDto } from './dto/scheduled-export.dto';

@Injectable()
export class ExportTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async createTemplate(
    userId: string,
    companyId: string,
    data: {
      name: string;
      description?: string;
      entityType: string;
      fields: string[];
      filters?: Record<string, any>;
      format?: string;
    },
  ) {
    return this.prisma.exportTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        entityType: data.entityType,
        fields: data.fields,
        filters: data.filters || {},
        format: data.format || 'csv',
        userId,
        companyId,
      },
    });
  }

  async getTemplate(id: string, userId: string, companyId: string) {
    const template = await this.prisma.exportTemplate.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Export template with ID ${id} not found`);
    }

    return template;
  }

  async listTemplates(
    userId: string,
    companyId: string,
    filters?: {
      entityType?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
    };

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      this.prisma.exportTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          company: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.exportTemplate.count({ where }),
    ]);

    return {
      data: templates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTemplate(
    id: string,
    userId: string,
    companyId: string,
    data: {
      name?: string;
      description?: string;
      fields?: string[];
      filters?: Record<string, any>;
      format?: string;
    },
  ) {
    const template = await this.getTemplate(id, userId, companyId);

    return this.prisma.exportTemplate.update({
      where: { id: template.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.fields && { fields: data.fields }),
        ...(data.filters && { filters: data.filters }),
        ...(data.format && { format: data.format }),
      },
    });
  }

  async deleteTemplate(id: string, userId: string, companyId: string) {
    const template = await this.getTemplate(id, userId, companyId);

    // Check if template is being used by any scheduled jobs
    const jobsUsingTemplate = await this.prisma.exportJob.count({
      where: {
        templateId: template.id,
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
    });

    if (jobsUsingTemplate > 0) {
      throw new ForbiddenException(
        `Cannot delete template. ${jobsUsingTemplate} active export job(s) are using this template.`,
      );
    }

    await this.prisma.exportTemplate.delete({
      where: { id: template.id },
    });

    return { message: 'Template deleted successfully' };
  }

  async getTemplateUsageStats(id: string, userId: string, companyId: string) {
    const template = await this.getTemplate(id, userId, companyId);

    const [totalJobs, completedJobs, failedJobs, lastUsed] = await Promise.all([
      this.prisma.exportJob.count({
        where: { templateId: template.id },
      }),
      this.prisma.exportJob.count({
        where: { templateId: template.id, status: 'COMPLETED' },
      }),
      this.prisma.exportJob.count({
        where: { templateId: template.id, status: 'FAILED' },
      }),
      this.prisma.exportJob.findFirst({
        where: { templateId: template.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      templateId: template.id,
      templateName: template.name,
      totalJobs,
      completedJobs,
      failedJobs,
      successRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      lastUsed: lastUsed?.createdAt,
    };
  }
}
