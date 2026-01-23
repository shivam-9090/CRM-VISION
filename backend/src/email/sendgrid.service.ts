import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

/**
 * SendGrid Email Service
 * Professional email delivery with tracking, analytics, and reliability
 */
@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);

  constructor(private readonly configService: ConfigService) {
    this.initializeSendGrid();
  }

  /**
   * Initialize SendGrid with API key
   */
  private initializeSendGrid() {
    try {
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');

      if (!apiKey) {
        this.logger.warn(
          '⚠️ SENDGRID_API_KEY not configured. Email service disabled.',
        );
        return;
      }

      sgMail.setApiKey(apiKey);
      this.logger.log('✅ SendGrid initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize SendGrid:', error);
    }
  }

  /**
   * Send email using SendGrid
   */
  async send(options: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    replyTo?: string;
  }): Promise<any> {
    try {
      const from = options.from || this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@crm-vision.com';

      const msg = {
        to: options.to,
        from,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      };

      const result = await sgMail.send(msg);

      this.logger.log(
        `✅ Email sent to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Failed to send email: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(data: {
    to: string;
    name: string;
    companyName: string;
    dashboardUrl: string;
    html: string;
    text: string;
  }): Promise<any> {
    return this.send({
      to: data.to,
      subject: '🎉 Welcome to CRM Vision - Your Account is Ready!',
      html: data.html,
      text: data.text,
    });
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(data: {
    to: string;
    verificationUrl: string;
  }): Promise<any> {
    const html = `
      <h2>Verify Your Email - CRM Vision</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${data.verificationUrl}" style="padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verify Email
      </a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create this account, please ignore this email.</p>
    `;

    return this.send({
      to: data.to,
      subject: 'Verify Your Email - CRM Vision',
      html,
      text: `Verify your email: ${data.verificationUrl}`,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: {
    to: string;
    resetUrl: string;
    name: string;
  }): Promise<any> {
    const html = `
      <h2>Password Reset Request</h2>
      <p>Hi ${data.name},</p>
      <p>We received a request to reset your password. Click the link below:</p>
      <a href="${data.resetUrl}" style="padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
        Reset Password
      </a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return this.send({
      to: data.to,
      subject: 'Password Reset - CRM Vision',
      html,
      text: `Reset your password: ${data.resetUrl}`,
    });
  }

  /**
   * Send bulk email
   */
  async sendBulk(emails: Array<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }>): Promise<any> {
    try {
      const from = this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@crm-vision.com';

      const messages = emails.map((email) => ({
        to: email.to,
        from,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }));

      const result = await sgMail.sendMultiple(messages);

      this.logger.log(
        `✅ Bulk emails sent to ${emails.length} recipients`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Failed to send bulk emails: ${error.message}`,
        error,
      );
      throw error;
    }
  }
}
