import {
  Processor,
  Process,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ExportJobService } from './export-job.service';
import { ExportStreamingService } from './export-streaming.service';
import { FileStorageService } from './file-storage.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

type ExportFormat = 'csv' | 'excel' | 'json' | 'xml';
type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface ScheduledExportJobData {
  jobId: string;
  entityType: string;
  format: ExportFormat;
  filters?: Record<string, any>;
  fields?: string[];
  companyId: string;
  userId: string;
  userEmail: string;
  templateId?: string;
}

@Processor('scheduled-export')
export class ExportQueueProcessor {
  private readonly logger = new Logger(ExportQueueProcessor.name);

  constructor(
    private readonly exportJobService: ExportJobService,
    private readonly exportStreamingService: ExportStreamingService,
    private readonly fileStorageService: FileStorageService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @Process()
  async processExport(job: Job<ScheduledExportJobData>) {
    const {
      jobId,
      entityType,
      format,
      filters,
      fields,
      companyId,
      userId,
      userEmail,
    } = job.data;

    this.logger.log(
      `📤 Processing export job: ${jobId} (${entityType} → ${format})`,
    );

    try {
      // Update job status to PROCESSING
      await this.exportJobService.updateJobStatus(jobId, 'PROCESSING');

      // Get data based on entity type
      let data: any[];
      let totalRecords = 0;

      switch (entityType) {
        case 'contacts':
          data = await this.getContacts(companyId, filters);
          break;
        case 'companies':
          data = await this.getCompanies(companyId, filters);
          break;
        case 'deals':
          data = await this.getDeals(companyId, filters);
          break;
        case 'activities':
          data = await this.getActivities(companyId, filters);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      totalRecords = data.length;

      // Filter fields if specified
      if (fields && fields.length > 0) {
        data = data.map((item) => {
          const filtered: any = {};
          fields.forEach((field) => {
            if (item[field] !== undefined) {
              filtered[field] = item[field];
            }
          });
          return filtered;
        });
      }

      // Generate file based on format
      let fileContent: Buffer | string;
      let mimeType: string;

      switch (format) {
        case 'csv':
          fileContent = await this.exportStreamingService.generateCSV(data);
          mimeType = 'text/csv';
          break;
        case 'excel':
          fileContent = await this.exportStreamingService.generateExcel(
            data,
            entityType,
          );
          mimeType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'json':
          fileContent = await this.exportStreamingService.generateJSON(data);
          mimeType = 'application/json';
          break;
        case 'xml':
          fileContent = await this.exportStreamingService.generateXML(
            data,
            entityType,
          );
          mimeType = 'application/xml';
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Save file to storage
      const { fileUrl, fileName, fileSize, filePath } =
        await this.fileStorageService.saveFile(
          fileContent,
          entityType,
          format.toLowerCase(),
          userId,
        );

      // Update job with success
      await this.exportJobService.updateJobStatus(jobId, 'COMPLETED', {
        totalRecords,
        fileUrl,
        fileName,
        fileSize,
      });

      // Send email notification
      await this.sendCompletionEmail(
        userEmail,
        entityType,
        format,
        fileUrl,
        totalRecords,
        fileSize,
      );

      this.logger.log(
        `✅ Export job completed: ${jobId} (${totalRecords} records, ${this.formatBytes(fileSize)})`,
      );

      return { success: true, jobId, fileUrl, totalRecords };
    } catch (error) {
      this.logger.error(
        `❌ Export job failed: ${jobId} - ${error.message}`,
        error.stack,
      );

      // Update job with failure
      await this.exportJobService.updateJobStatus(jobId, 'FAILED', {
        errorMessage: error.message,
      });

      // Send failure email
      await this.sendFailureEmail(userEmail, entityType, format, error.message);

      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`✅ Job ${job.id} completed successfully`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ Job ${job.id} failed: ${error.message}`);
  }

  /**
   * Get contacts data
   */
  private async getContacts(companyId: string, filters?: Record<string, any>) {
    const where: any = { companyId };

    if (filters) {
      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    return this.prisma.contact.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get companies data
   */
  private async getCompanies(companyId: string, filters?: Record<string, any>) {
    // For companies, user can only export their own company
    return this.prisma.company.findMany({
      where: { id: companyId },
    });
  }

  /**
   * Get deals data
   */
  private async getDeals(companyId: string, filters?: Record<string, any>) {
    const where: any = { companyId };

    if (filters) {
      if (filters.stage) {
        where.stage = filters.stage;
      }
      if (filters.priority) {
        where.priority = filters.priority;
      }
    }

    return this.prisma.deal.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get activities data
   */
  private async getActivities(
    companyId: string,
    filters?: Record<string, any>,
  ) {
    const where: any = { companyId };

    if (filters) {
      if (filters.type) {
        where.type = filters.type;
      }
      if (filters.status) {
        where.status = filters.status;
      }
    }

    return this.prisma.activity.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, firstName: true, lastName: true },
        },
        deal: {
          select: { id: true, title: true },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  /**
   * Send completion email
   */
  private async sendCompletionEmail(
    email: string,
    entityType: string,
    format: ExportFormat,
    fileUrl: string,
    totalRecords: number,
    fileSize: number,
  ) {
    try {
      await this.emailService.sendExportReadyEmail(email, {
        fileName: `${entityType}_export.${format.toLowerCase()}`,
        fileSize,
        totalRecords,
        format: format.toLowerCase(),
        entityType,
        downloadUrl: fileUrl,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send completion email: ${errorMessage}`);
    }
  }

  /**
   * Send failure email
   */
  private async sendFailureEmail(
    email: string,
    entityType: string,
    format: ExportFormat,
    errorMessage: string,
  ) {
    try {
      await this.emailService.sendEmailDirect({
        to: email,
        subject: `Export Failed: ${entityType} (${format})`,
        text: `Your export of ${entityType} in ${format} format failed with error: ${errorMessage}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Export Failed ❌</h2>
            <p>Your export of <strong>${entityType}</strong> in <strong>${format}</strong> format failed.</p>
            <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
              <strong>Error:</strong> ${errorMessage}
            </div>
            <p>Please try again or contact support if the problem persists.</p>
          </div>
        `,
      });
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send failure email: ${errMessage}`);
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
