import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { ExportJobService } from './export-job.service';
import { ExportStreamingService } from './export-streaming.service';
import { FileStorageService } from './file-storage.service';
import { EmailService } from '../email/email.service';

export interface ExportJobData {
  jobId: string;
  entityType: 'contacts' | 'deals' | 'activities' | 'companies';
  format: 'csv' | 'excel' | 'json' | 'xml';
  companyId: string;
  userId: string;
  fields?: string[];
  startDate?: Date;
  endDate?: Date;
  userEmail?: string;
}

@Processor('export')
export class ExportProcessor {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(
    private readonly exportJobService: ExportJobService,
    private readonly exportStreamingService: ExportStreamingService,
    private readonly fileStorageService: FileStorageService,
    private readonly emailService: EmailService,
  ) {}

  @Process('processExport')
  async handleExport(job: Job<ExportJobData>) {
    const { jobId, entityType, format, companyId, userId, startDate, endDate } =
      job.data;

    this.logger.log(
      `🚀 Processing export job ${jobId} - ${entityType} as ${format}`,
    );

    try {
      // Get full job details with template
      const fullJob = await this.exportJobService['prisma'].exportJob.findUnique({
        where: { id: jobId },
        include: { template: true },
      });

      if (!fullJob) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Get fields from job or template
      const rawFields = fullJob.fields || fullJob.template?.fields || [];
      
      // Ensure fields is an array
      const fieldsArray = Array.isArray(rawFields) ? rawFields : [];

      // Convert fields to format needed by streaming service
      const fieldMappings = fieldsArray.map((field: any) => ({
        label: field.label || field,
        value: field.value || field,
      }));

      // Update job status to PROCESSING
      await this.exportJobService.updateJobStatus(jobId, 'PROCESSING', {
        progress: 0,
      });

      // Report progress: 10%
      await job.progress(10);
      await this.exportJobService.updateJobStatus(jobId, 'PROCESSING', {
        progress: 10,
      });

      // Get async generator for the entity type (fields need to be string array for streaming)
      const fieldNames = fieldsArray.map((f: any) => (typeof f === 'string' ? f : f.value || f.label));
      const options = { fields: fieldNames, startDate, endDate };
      let dataGenerator: AsyncGenerator<any>;
      let totalRecords = 0;

      switch (entityType) {
        case 'contacts':
          dataGenerator = this.exportStreamingService.streamContacts(
            companyId,
            options,
          );
          break;
        case 'deals':
          dataGenerator = this.exportStreamingService.streamDeals(
            companyId,
            options,
          );
          break;
        case 'activities':
          dataGenerator = this.exportStreamingService.streamActivities(
            companyId,
            options,
          );
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      // Report progress: 20%
      await job.progress(20);
      await this.exportJobService.updateJobStatus(jobId, 'PROCESSING', {
        progress: 20,
      });

      // Generate file content based on format
      let fileContent: Buffer | string;

      switch (format) {
        case 'csv': {
          const stream = await this.exportStreamingService.createCSVStream(
            dataGenerator,
            fieldMappings,
          );
          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            chunks.push(chunk as any);
            totalRecords++;
          }
          fileContent = Buffer.concat(chunks);
          break;
        }

        case 'excel': {
          const workbook =
            await this.exportStreamingService.createExcelWorkbook(
              dataGenerator,
              fieldMappings,
              entityType.charAt(0).toUpperCase() + entityType.slice(1),
            );
          fileContent = (await workbook.xlsx.writeBuffer()) as any;
          // Count records from workbook
          const worksheet = workbook.worksheets[0];
          totalRecords = worksheet.rowCount - 1; // Exclude header
          break;
        }

        case 'json': {
          const data =
            await this.exportStreamingService.createJSONArray(dataGenerator);
          totalRecords = data.length;
          fileContent = JSON.stringify(data, null, 2);
          break;
        }

        case 'xml': {
          const data =
            await this.exportStreamingService.createJSONArray(dataGenerator);
          totalRecords = data.length;
          // Create a new generator from the array
          async function* arrayToGenerator(arr: any[]) {
            for (const item of arr) {
              yield item;
            }
          }
          fileContent = await this.exportStreamingService.createXMLString(
            arrayToGenerator(data),
            entityType + 's',
            entityType,
          );
          break;
        }

        default:
          throw new Error(`Unsupported format: ${format as string}`);
      }

      // Report progress: 60%
      await job.progress(60);
      await this.exportJobService.updateJobStatus(jobId, 'PROCESSING', {
        progress: 60,
      });

      // Save file to storage
      const fileInfo = await this.fileStorageService.saveFile(
        fileContent,
        entityType,
        format,
        userId,
      );

      // Report progress: 80%
      await job.progress(80);
      await this.exportJobService.updateJobStatus(jobId, 'PROCESSING', {
        progress: 80,
        fileUrl: fileInfo.fileUrl,
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
        totalRecords,
      });

      // Update job status to COMPLETED
      await this.exportJobService.updateJobStatus(jobId, 'COMPLETED', {
        progress: 100,
        fileUrl: fileInfo.fileUrl,
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
        totalRecords,
      });

      // Send email notification if email provided
      if (job.data.userEmail) {
        try {
          await this.emailService.sendExportReadyEmail(job.data.userEmail, {
            fileName: fileInfo.fileName,
            fileSize: fileInfo.fileSize,
            totalRecords,
            format,
            entityType,
            downloadUrl: fileInfo.fileUrl,
          });
          this.logger.log(
            `📧 Email notification sent to ${job.data.userEmail}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send email notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          // Don't fail the job if email fails
        }
      }

      await job.progress(100);
      this.logger.log(
        `✅ Export job ${jobId} completed - ${totalRecords} records exported`,
      );

      return {
        success: true,
        jobId,
        totalRecords,
        fileUrl: fileInfo.fileUrl,
      };
    } catch (error) {
      this.logger.error(
        `❌ Export job ${jobId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      // Update job status to FAILED
      await this.exportJobService.updateJobStatus(jobId, 'FAILED', {
        errorMessage:
          error instanceof Error ? error.message : 'Unknown error occurred',
        progress: 0,
      });

      throw error;
    }
  }
}
