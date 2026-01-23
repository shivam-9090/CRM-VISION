import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * EmailJS Service - Simple email service using SMTP
 * No AWS required, just uses SMTP configuration
 */
@Injectable()
export class EmailJsService {
  private readonly logger = new Logger(EmailJsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter
   */
  private initializeTransporter() {
    try {
      const smtpHost = this.configService.get<string>('SMTP_HOST');
      const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
      const smtpUser = this.configService.get<string>('SMTP_USER');
      const smtpPass = this.configService.get<string>('SMTP_PASS');

      if (smtpHost && smtpUser && smtpPass) {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
        });

        this.logger.log(
          `✅ EmailJS initialized (SMTP: ${smtpHost}:${smtpPort})`,
        );
      } else {
        this.logger.warn(
          '⚠️ SMTP not configured. Using console logging for emails.',
        );
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: true,
        });
      }
    } catch (error) {
      this.logger.error('Failed to initialize EmailJS transporter:', error);
      throw error;
    }
  }

  /**
   * Send email using SMTP
   */
  async send(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    from?: string;
  }): Promise<any> {
    try {
      const from =
        options.from ||
        this.configService.get<string>('SMTP_FROM', 'noreply@crm-vision.com');

      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`✅ Email sent to ${options.to} - Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${options.to}:`, error);
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
}
