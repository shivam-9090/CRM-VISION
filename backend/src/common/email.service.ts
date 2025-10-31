import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // For development, we'll use a test account or console logging
    // In production, you would configure this with real SMTP settings
    void this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Production SMTP configuration
      if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false, // Allow self-signed certificates for some providers
          },
        });

        this.logger.log(
          `Email service initialized (production mode - SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`,
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

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@crm-system.com',
        to: email,
        subject: 'Password Reset Request - CRM System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You have requested to reset your password for your CRM System account.</p>
            <p>Please click the button below to reset your password:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This email was sent from the CRM System. Please do not reply to this email.
            </p>
          </div>
        `,
        text: `
          Password Reset Request
          
          Hello,
          
          You have requested to reset your password for your CRM System account.
          
          Please visit the following link to reset your password:
          ${resetUrl}
          
          This link will expire in 1 hour.
          
          If you didn't request this password reset, please ignore this email.
        `,
      };

      // In development, log the email content
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log('Password Reset Email (Development Mode):');
        this.logger.log(`To: ${email}`);
        this.logger.log(`Subject: ${mailOptions.subject}`);
        this.logger.log(`Reset URL: ${resetUrl}`);
        this.logger.log(
          'Email content logged. In production, this would be sent via SMTP.',
        );
        return;
      }

      // In production, actually send the email
      const result: any = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Password reset email sent to ${email}`,
        result.messageId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
      throw new Error('Failed to send password reset email');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@crm-system.com',
        to: email,
        subject: 'Welcome to CRM System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to CRM System!</h2>
            <p>Hello ${name},</p>
            <p>Welcome to our CRM System! Your account has been successfully created.</p>
            <p>You can now log in and start managing your business relationships.</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login" 
                 style="background-color: #28a745; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Log In Now
              </a>
            </div>
            <p>If you have any questions, feel free to contact our support team.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This email was sent from the CRM System. Please do not reply to this email.
            </p>
          </div>
        `,
        text: `
          Welcome to CRM System!
          
          Hello ${name},
          
          Welcome to our CRM System! Your account has been successfully created.
          
          You can now log in at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login
          
          If you have any questions, feel free to contact our support team.
        `,
      };

      // In development, log the email content
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log('Welcome Email (Development Mode):');
        this.logger.log(`To: ${email}`);
        this.logger.log(`Subject: ${mailOptions.subject}`);
        this.logger.log(
          'Email content logged. In production, this would be sent via SMTP.',
        );
        return;
      }

      // In production, actually send the email
      const result: any = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email}`, result.messageId);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
      // Don't throw here as welcome email is not critical
    }
  }
}