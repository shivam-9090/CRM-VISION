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
   * Initialize the email transporter (SMTP or development mode)
   */
  private initializeTransporter() {
    try {
      const nodeEnv = this.configService.get<string>('NODE_ENV');
      const smtpHost = this.configService.get<string>('SMTP_HOST');

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

      this.logger.log(`Email queued successfully: ${jobId} (Job ID: ${job.id})`);

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
}
