import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduledExportDto } from './dto/scheduled-export.dto';
import type { ExportJobData } from './export.processor';

@Injectable()
export class ExportJobService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('export') private exportQueue: Queue,
  ) {}

  async createJob(
    userId: string,
    companyId: string,
    data: CreateScheduledExportDto,
  ) {
    // Validate template if provided
    if (data.templateId) {
      const template = await this.prisma.exportTemplate.findFirst({
        where: {
          id: data.templateId,
          companyId,
        },
      });

      if (!template) {
        throw new NotFoundException(
          `Export template with ID ${data.templateId} not found`,
        );
      }

      // Use template settings if fields/format not provided
      if (!data.fields && template.fields) {
        data.fields = template.fields as string[];
      }
      if (!data.format && template.format) {
        data.format = template.format;
      }
    }

    // Calculate expiration date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const job = await this.prisma.exportJob.create({
      data: {
        entityType: data.entityType,
        format: data.format || 'csv',
        status: 'PENDING',
        schedule: data.schedule,
        filters: data.filters || {},
        fields: data.fields || [],
        templateId: data.templateId,
        userId,
        companyId,
        expiresAt,
        progress: 0,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Trigger export processing if schedule is 'once'
    if (data.schedule === 'once') {
      await this.triggerExportJob(job.id, userId, companyId);
    }

    return job;
  }

  /**
   * Trigger export job processing via Bull queue
   */
  async triggerExportJob(
    jobId: string,
    userId: string,
    companyId: string,
    userEmail?: string,
  ) {
    const job = await this.getJob(jobId, userId, companyId);

    if (job.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot trigger job with status: ${job.status}`,
      );
    }

    const jobData: ExportJobData = {
      jobId: job.id,
      entityType: job.entityType as any,
      format: job.format as any,
      companyId: job.companyId,
      userId: job.userId,
      fields: job.fields as string[],
      startDate: undefined,
      endDate: undefined,
      userEmail,
    };

    await this.exportQueue.add('processExport', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    });

    return { message: 'Export job triggered successfully', jobId: job.id };
  }

  async getJob(id: string, userId: string, companyId: string) {
    const job = await this.prisma.exportJob.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Export job with ID ${id} not found`);
    }

    return job;
  }

  async listJobs(
    userId: string,
    companyId: string,
    filters?: {
      status?: string;
      entityType?: string;
      schedule?: string;
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

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters?.schedule) {
      where.schedule = filters.schedule;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.exportJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.exportJob.count({ where }),
    ]);

    return {
      data: jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateJobStatus(
    jobId: string,
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
    data?: {
      progress?: number;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      totalRecords?: number;
      errorMessage?: string;
    },
  ) {
    const updateData: any = {
      status,
    };

    if (data?.progress !== undefined) {
      updateData.progress = data.progress;
    }

    if (data?.fileUrl) {
      updateData.fileUrl = data.fileUrl;
    }

    if (data?.fileName) {
      updateData.fileName = data.fileName;
    }

    if (data?.fileSize) {
      updateData.fileSize = data.fileSize;
    }

    if (data?.totalRecords !== undefined) {
      updateData.totalRecords = data.totalRecords;
    }

    if (data?.errorMessage) {
      updateData.errorMessage = data.errorMessage;
    }

    if (status === 'PROCESSING' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === 'COMPLETED' || status === 'FAILED') {
      updateData.completedAt = new Date();
    }

    return this.prisma.exportJob.update({
      where: { id: jobId },
      data: updateData,
    });
  }

  async deleteJob(id: string, userId: string, companyId: string) {
    const job = await this.getJob(id, userId, companyId);

    if (job.status === 'PROCESSING') {
      throw new BadRequestException(
        'Cannot delete a job that is currently processing',
      );
    }

    await this.prisma.exportJob.delete({
      where: { id: job.id },
    });

    return { message: 'Export job deleted successfully' };
  }

  async deleteExpiredJobs() {
    const now = new Date();

    const result = await this.prisma.exportJob.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
        status: {
          in: ['COMPLETED', 'FAILED'],
        },
      },
    });

    return {
      message: `Deleted ${result.count} expired export job(s)`,
      count: result.count,
    };
  }

  async getJobStats(companyId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [total, completed, failed, processing, pending] = await Promise.all([
      this.prisma.exportJob.count({
        where: {
          companyId,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.exportJob.count({
        where: {
          companyId,
          createdAt: { gte: startDate },
          status: 'COMPLETED',
        },
      }),
      this.prisma.exportJob.count({
        where: {
          companyId,
          createdAt: { gte: startDate },
          status: 'FAILED',
        },
      }),
      this.prisma.exportJob.count({
        where: {
          companyId,
          status: 'PROCESSING',
        },
      }),
      this.prisma.exportJob.count({
        where: {
          companyId,
          status: 'PENDING',
        },
      }),
    ]);

    const successRate = total > 0 ? (completed / total) * 100 : 0;

    // Get average processing time for completed jobs
    const completedJobs = await this.prisma.exportJob.findMany({
      where: {
        companyId,
        createdAt: { gte: startDate },
        status: 'COMPLETED',
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    let avgProcessingTime = 0;
    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((sum, job) => {
        const start = job.startedAt?.getTime() || 0;
        const end = job.completedAt?.getTime() || 0;
        return sum + (end - start);
      }, 0);
      avgProcessingTime = Math.round(totalTime / completedJobs.length / 1000); // seconds
    }

    return {
      period: `Last ${days} days`,
      total,
      completed,
      failed,
      processing,
      pending,
      successRate: Math.round(successRate * 100) / 100,
      avgProcessingTimeSeconds: avgProcessingTime,
    };
  }

  async cancelJob(id: string, userId: string, companyId: string) {
    const job = await this.getJob(id, userId, companyId);

    if (job.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed job');
    }

    if (job.status === 'FAILED') {
      throw new BadRequestException('Cannot cancel a failed job');
    }

    return this.prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        errorMessage: 'Job cancelled by user',
        completedAt: new Date(),
      },
    });
  }
}
