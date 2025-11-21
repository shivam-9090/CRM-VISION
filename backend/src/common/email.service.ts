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
      // If SMTP credentials are configured, use them regardless of environment
      if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
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
          `Email service initialized with SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} (User: ${process.env.SMTP_USER})`,
        );
        return;
      }

      // Fallback - log emails to console if no SMTP configured
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });

      this.logger.log(
        'Email service initialized (console logging mode - no SMTP configured)',
      );
    } catch (error) {
      this.logger.error('Failed to initialize email transporter', error);
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@crm-system.com',
        ...options,
      };

      // If SMTP is configured, always send real emails
      if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        const result: any = await this.transporter.sendMail(mailOptions);
        this.logger.log(`Email sent to ${options.to}`, result.messageId);
        return;
      }

      // Otherwise, just log in development
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log('Email (Development Mode - No SMTP):');
        this.logger.log(`To: ${options.to}`);
        this.logger.log(`Subject: ${options.subject}`);
        if (options.html) {
          this.logger.log(
            'HTML content available. Configure SMTP to send real emails.',
          );
        }
        return;
      }

      // In production without SMTP, throw error
      throw new Error('SMTP not configured');
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw new Error('Failed to send email');
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

      // Send the email via SMTP
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

      // Send the email via SMTP
      const result: any = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email}`, result.messageId);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
      // Don't throw here as welcome email is not critical
    }
  }

  async sendInvitationEmail(
    email: string,
    inviteUrl: string,
    role: string,
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@crm-system.com',
        to: email,
        subject: 'You have been invited to join a CRM System workspace',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">You've Been Invited!</h2>
            <p>Hello,</p>
            <p>You have been invited to join a workspace on CRM System as a <strong>${role}</strong>.</p>
            <p>Click the button below to accept the invitation and create your account:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
            <p><strong>This invitation will expire in 7 days.</strong></p>
          </div>
        `,
      };

      // Send the email via SMTP
      const result: any = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Invitation email sent to ${email}`, result.messageId);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}`, error);
      throw new Error('Failed to send invitation email');
    }
  }

  async sendVerificationCodeEmail(
    email: string,
    name: string,
    code: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Login Verification</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Hello ${name},</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
            You are attempting to log in to your CRM account. Please use the verification code below to complete your login:
          </p>
          
          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
              ${code}
            </div>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 25px 0;">
            <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
              ⚠️ <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>. If you didn't attempt to log in, please secure your account immediately.
            </p>
          </div>

          <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin-top: 25px;">
            <h3 style="color: #3730a3; margin: 0 0 10px 0; font-size: 14px;">🛡️ Security Tips:</h3>
            <ul style="color: #4c1d95; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Never share this code with anyone</li>
              <li>Our support team will never ask for this code</li>
              <li>This code is only valid for this login session</li>
            </ul>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 20px 0 0 0;">
            This email was sent to <strong>${email}</strong><br>
            CRM System - Secure Account Access<br>
            If you have questions, contact our support team.
          </p>
        </div>
      </div>
    `;

    const text = `
      Login Verification Code
      
      Hello ${name},
      
      You are attempting to log in to your CRM account at ${email}.
      
      Your verification code is: ${code}
      
      This code will expire in 10 minutes.
      
      Security Tips:
      - Never share this code with anyone
      - Our support team will never ask for this code
      - This code is only valid for this login session
      
      If you didn't attempt to log in, please secure your account immediately.
      
      ---
      CRM System
    `;

    // Use the sendEmail method which handles SMTP configuration check
    await this.sendEmail({
      to: email,
      subject: 'Login Verification Code - CRM System',
      html,
      text,
    });
  }
}
