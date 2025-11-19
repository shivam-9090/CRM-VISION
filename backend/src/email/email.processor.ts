import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailJobData, EmailStatus } from './interfaces/email.interface';
import { EmailService } from './email.service';
import { TemplateService } from './template.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly templateService: TemplateService,
  ) {}

  @Process({ name: 'send-email', concurrency: 5 })
  async handleSendEmail(job: Job<EmailJobData>) {
    const { jobId, to, subject, template, context, attempt } = job.data;

    this.logger.log(
      `Processing email job ${jobId} (attempt ${attempt}): ${subject} to ${to}`,
    );

    try {
      // Render templates
      const { html, text } = await this.templateService.renderBoth(
        template,
        context,
      );

      // Send email using the email service
      await this.emailService.sendEmailDirect({
        to,
        subject,
        html,
        text,
      });

      this.logger.log(`Email sent successfully: ${jobId}`);

      // Store delivery status
      await this.emailService.recordDeliveryStatus(jobId, {
        status: EmailStatus.SENT,
        to,
        subject,
        template,
        sentAt: new Date(),
        attempts: attempt,
      });

      return {
        success: true,
        jobId,
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email ${jobId} (attempt ${attempt})`,
        error,
      );

      // Record failure
      await this.emailService.recordDeliveryStatus(jobId, {
        status: EmailStatus.FAILED,
        to,
        subject,
        template,
        error: error instanceof Error ? error.message : String(error),
        attempts: attempt,
      });

      // Rethrow to trigger Bull's retry mechanism
      throw error;
    }
  }

  @Process({ name: 'send-bulk-email', concurrency: 3 })
  async handleBulkEmail(job: Job<EmailJobData>) {
    const { jobId, to, subject, template, context } = job.data;

    this.logger.log(
      `Processing bulk email job ${jobId}: ${subject} to ${Array.isArray(to) ? to.length : 1} recipients`,
    );

    try {
      const recipients = Array.isArray(to) ? to : [to];
      const { html, text } = await this.templateService.renderBoth(
        template,
        context,
      );

      let successCount = 0;
      let failureCount = 0;

      // Send to each recipient individually
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];

        try {
          await this.emailService.sendEmailDirect({
            to: recipient,
            subject,
            html,
            text,
          });

          successCount++;

          this.logger.log(
            `Bulk email sent to ${recipient} (${i + 1}/${recipients.length})`,
          );
        } catch (error) {
          failureCount++;
          this.logger.error(`Failed to send bulk email to ${recipient}`, error);
        }
      }

      this.logger.log(
        `Bulk email job ${jobId} completed: ${successCount} sent, ${failureCount} failed`,
      );

      return {
        success: true,
        jobId,
        successCount,
        failureCount,
        totalRecipients: recipients.length,
      };
    } catch (error) {
      this.logger.error(`Failed to process bulk email job ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Event handlers for job lifecycle
   */
  async onActive(job: Job<EmailJobData>) {
    this.logger.log(`Job ${job.id} is now active`);
    await this.emailService.recordDeliveryStatus(job.data.jobId, {
      status: EmailStatus.PROCESSING,
      to: job.data.to,
      subject: job.data.subject,
      template: job.data.template,
      attempts: job.data.attempt,
    });
  }

  async onCompleted(job: Job<EmailJobData>) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  async onFailed(job: Job<EmailJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed after all retries`, error);
    await this.emailService.recordDeliveryStatus(job.data.jobId, {
      status: EmailStatus.FAILED,
      to: job.data.to,
      subject: job.data.subject,
      template: job.data.template,
      error: error.message,
      attempts: job.attemptsMade,
    });
  }
}
