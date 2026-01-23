import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import {
  EmailOptions,
  EmailJobData,
  EmailStatus,
  EmailDeliveryStatus,
} from './interfaces/email.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private deliveryStatuses = new Map<string, Partial<EmailDeliveryStatus>>();

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    void this.initializeTransporter();
  }

  /**
   * Initialize the email transporter (SMTP, AWS SES, or development mode)
   */
  private initializeTransporter() {
    try {
      const nodeEnv = this.configService.get<string>('NODE_ENV');
      const smtpHost = this.configService.get<string>('SMTP_HOST');
      const awsSesRegion = this.configService.get<string>('AWS_SES_REGION');
      const awsAccessKeyId =
        this.configService.get<string>('AWS_ACCESS_KEY_ID');
      const awsSecretAccessKey = this.configService.get<string>(
        'AWS_SECRET_ACCESS_KEY',
      );

      // AWS SES configuration (priority if configured)
      if (
        nodeEnv === 'production' &&
        awsSesRegion &&
        awsAccessKeyId &&
        awsSecretAccessKey
      ) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const aws = require('@aws-sdk/client-ses');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodemailerSes = require('nodemailer-ses-transport');

        const ses = new aws.SES({
          region: awsSesRegion,
          credentials: {
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey,
          },
        });

        this.transporter = nodemailer.createTransport(
          nodemailerSes({
            ses,
            aws,
          }),
        );

        this.logger.log(
          `Email service initialized (production mode - AWS SES: ${awsSesRegion})`,
        );
        return;
      }

      // Production SMTP configuration
      if (nodeEnv === 'production' && smtpHost) {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: this.configService.get<number>('SMTP_PORT', 587),
          secure: this.configService.get<number>('SMTP_PORT') === 465,
          auth: {
            user: this.configService.get<string>('SMTP_USER'),
            pass: this.configService.get<string>('SMTP_PASS'),
          },
          tls: {
            rejectUnauthorized: false,
          },
          pool: true, // Use connection pooling
          maxConnections: 5,
          maxMessages: 100,
        });

        this.logger.log(
          `Email service initialized (production mode - SMTP: ${smtpHost}:${this.configService.get('SMTP_PORT')})`,
        );
        return;
      }

      // Development mode - log emails to console
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });

      this.logger.log(
        'Email service initialized (development mode - console logging)',
      );
    } catch (error) {
      this.logger.error('Failed to initialize email transporter', error);
    }
  }

  /**
   * Queue an email for sending (recommended method)
   */
  async queueEmail(options: EmailOptions): Promise<string> {
    const jobId = uuidv4();

    const jobData: EmailJobData = {
      ...options,
      jobId,
      createdAt: new Date(),
      attempt: 1,
    };

    try {
      const job = await this.emailQueue.add('send-email', jobData, {
        priority: options.priority || 0,
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 seconds, exponentially increase
        },
        removeOnComplete: false, // Keep completed jobs for tracking
        removeOnFail: false, // Keep failed jobs for debugging
      });

      this.logger.log(
        `Email queued successfully: ${jobId} (Job ID: ${job.id})`,
      );

      // Store initial status
      this.deliveryStatuses.set(jobId, {
        jobId,
        status: EmailStatus.PENDING,
        to: options.to,
        subject: options.subject,
        template: options.template,
        createdAt: new Date(),
        attempts: 0,
      });

      return jobId;
    } catch (error) {
      this.logger.error(`Failed to queue email: ${jobId}`, error);
      throw new Error('Failed to queue email');
    }
  }

  /**
   * Queue bulk emails
   */
  async queueBulkEmail(options: EmailOptions): Promise<string> {
    const jobId = uuidv4();

    const jobData: EmailJobData = {
      ...options,
      jobId,
      createdAt: new Date(),
      attempt: 1,
    };

    try {
      const job = await this.emailQueue.add('send-bulk-email', jobData, {
        priority: options.priority || 0,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      });

      this.logger.log(
        `Bulk email queued successfully: ${jobId} (Job ID: ${job.id})`,
      );

      return jobId;
    } catch (error) {
      this.logger.error(`Failed to queue bulk email: ${jobId}`, error);
      throw new Error('Failed to queue bulk email');
    }
  }

  /**
   * Send email directly without queue (for immediate sending)
   * Used internally by the processor
   */
  async sendEmailDirect(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get<string>(
          'EMAIL_FROM',
          'noreply@crm-system.com',
        ),
        ...options,
      };

      // In development, log the email content
      if (this.configService.get<string>('NODE_ENV') !== 'production') {
        this.logger.log('Email (Development Mode):');
        this.logger.log(`To: ${options.to}`);
        this.logger.log(`Subject: ${options.subject}`);
        this.logger.log('Email would be sent via SMTP in production');
        return;
      }

      // In production, actually send the email
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent to ${options.to}`,
        result.messageId as string,
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Record email delivery status
   */
  async recordDeliveryStatus(
    jobId: string,
    status: Partial<EmailDeliveryStatus>,
  ): Promise<void> {
    const existingStatus = this.deliveryStatuses.get(jobId) || {};
    this.deliveryStatuses.set(jobId, {
      ...existingStatus,
      ...status,
      jobId,
    });

    this.logger.log(
      `Delivery status updated for ${jobId}: ${status.status || 'UNKNOWN'}`,
    );
  }

  /**
   * Get delivery status for an email
   */
  async getDeliveryStatus(jobId: string): Promise<EmailDeliveryStatus | null> {
    const status = this.deliveryStatuses.get(jobId);
    if (!status) {
      this.logger.warn(`No delivery status found for job: ${jobId}`);
      return null;
    }

    return status as EmailDeliveryStatus;
  }

  /**
   * Get email queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Retry a failed email
   */
  async retryEmail(jobId: string): Promise<boolean> {
    try {
      const job = await this.emailQueue.getJob(jobId);
      if (!job) {
        this.logger.warn(`Job not found for retry: ${jobId}`);
        return false;
      }

      await job.retry();
      this.logger.log(`Email job retried: ${jobId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to retry email job: ${jobId}`, error);
      return false;
    }
  }

  /**
   * Clean up old jobs (completed/failed)
   */
  async cleanupOldJobs(
    olderThanDays: number = 7,
  ): Promise<{ removed: number }> {
    try {
      const timestamp = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

      const [completedJobs, failedJobs] = await Promise.all([
        this.emailQueue.getCompleted(),
        this.emailQueue.getFailed(),
      ]);

      let removed = 0;

      for (const job of [...completedJobs, ...failedJobs]) {
        if (job.timestamp < timestamp) {
          await job.remove();
          removed++;
        }
      }

      this.logger.log(`Cleaned up ${removed} old email jobs`);
      return { removed };
    } catch (error) {
      this.logger.error('Failed to cleanup old jobs', error);
      throw error;
    }
  }

  /**
   * Pause the email queue
   */
  async pauseQueue(): Promise<void> {
    await this.emailQueue.pause();
    this.logger.log('Email queue paused');
  }

  /**
   * Resume the email queue
   */
  async resumeQueue(): Promise<void> {
    await this.emailQueue.resume();
    this.logger.log('Email queue resumed');
  }

  /**
   * Get failed jobs for manual review
   */
  async getFailedJobs(): Promise<any[]> {
    const failed = await this.emailQueue.getFailed();
    return failed.map((job) => ({
      id: job.id,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
    }));
  }

  /**
   * Send export ready notification email (direct send, not queued)
   */
  async sendExportReadyEmail(
    to: string,
    exportDetails: {
      fileName: string;
      fileSize: number;
      totalRecords: number;
      format: string;
      entityType: string;
      downloadUrl: string;
    },
  ): Promise<void> {
    const formattedSize = this.formatBytes(exportDetails.fileSize);
    const expirationTime = '24 hours';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Your Export is Ready! 📊</h2>
          
          <p>Your export has been successfully processed and is ready for download.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Export Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Entity Type:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${this.capitalize(exportDetails.entityType)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Format:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${exportDetails.format.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Records:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${exportDetails.totalRecords.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>File Size:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${formattedSize}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>File Name:</strong></td>
                <td style="padding: 8px 0; text-align: right; word-break: break-all;">${exportDetails.fileName}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${exportDetails.downloadUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; display: inline-block; 
                      font-weight: bold;">
              Download Export
            </a>
          </div>
          
          <p style="color: #ef4444; font-size: 14px; text-align: center;">
            ⚠️ This file will be available for ${expirationTime}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This is an automated message from your CRM system.
          </p>
        </div>
      `;

    const text = `
Your Export is Ready!

Your export has been successfully processed and is ready for download.

Export Details:
- Entity Type: ${this.capitalize(exportDetails.entityType)}
- Format: ${exportDetails.format.toUpperCase()}
- Records: ${exportDetails.totalRecords.toLocaleString()}
- File Size: ${formattedSize}
- File Name: ${exportDetails.fileName}

Download Link: ${exportDetails.downloadUrl}

⚠️ This file will be available for ${expirationTime}

---
This is an automated message from your CRM system.
      `.trim();

    // Send directly using nodemailer (not queued for immediate delivery)
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'SMTP_FROM',
          'noreply@crm-system.com',
        ),
        to,
        subject: `Your ${this.capitalize(exportDetails.entityType)} Export is Ready`,
        html,
        text,
      });

      this.logger.log(`✅ Export ready email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send export ready email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
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

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
