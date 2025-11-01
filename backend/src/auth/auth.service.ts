import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InviteDto } from './dto/invite.dto';
import { RegisterWithInviteDto } from './dto/register-with-invite.dto';
import { randomBytes } from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto, res: Response) {
    const { email, password, name, role, companyId, phone } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with 12 rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user and company in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      let userCompanyId = companyId;

      // If no company ID provided, create a new company
      if (!userCompanyId) {
        const company = await prisma.company.create({
          data: {
            name: `${name}'s Company`,
            description: 'Auto-created company',
          },
        });
        userCompanyId = company.id;
      }

      // Create user with company
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role,
          companyId: userCompanyId,
          phone: phone || null,
          isVerified: false,
          verificationToken,
          verificationExpiry,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          companyId: true,
          phone: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return { user };
    });

    // Send verification email
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
      await this.emailService.sendEmail({
        to: email,
        subject: 'Verify Your Email - CRM System',
        text: `Please verify your email by clicking this link: ${verificationUrl}`,
        html: `
          <h2>Welcome to CRM System!</h2>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails - user can request new verification
    }

    const payload = { id: result.user.id, role: result.user.role };
    const access_token = this.jwtService.sign(payload);

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      user: result.user,
      token: access_token,
    };
  }

  async registerWithInvite(registerWithInviteDto: RegisterWithInviteDto, res: Response) {
    const { token, password, name } = registerWithInviteDto;

    const invite = await this.validateInviteToken(token);

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: invite.email,
        password: hashedPassword,
        name,
        role: invite.role,
        companyId: invite.companyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.prisma.invite.delete({ where: { token } });

    const payload = { id: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    });

    return { user };
  }

  async login(loginDto: LoginDto, res: Response) {
    const { email, password, twoFactorToken } = loginDto;

    // Find user with company information
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;

      // Lock account if max attempts reached
      if (newFailedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedAttempts,
            lockedUntil: lockUntil,
          },
        });
        throw new UnauthorizedException(
          `Account locked for 15 minutes due to ${this.MAX_LOGIN_ATTEMPTS} failed login attempts.`,
        );
      }

      // Update failed attempts
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
        },
      });

      const remainingAttempts = this.MAX_LOGIN_ATTEMPTS - newFailedAttempts;
      throw new UnauthorizedException(
        `Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lockout.`,
      );
    }

    // Check for 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        // Password is correct, but 2FA token is required
        return {
          requiresTwoFactor: true,
          message: 'Please provide your 2FA token',
        };
      }

      // Verify 2FA token
      const is2FAValid = await this.verifyTwoFactorToken(
        user.id,
        twoFactorToken,
      );
      if (!is2FAValid) {
        throw new UnauthorizedException('Invalid 2FA token');
      }
    }

    // Reset failed attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const payload = { id: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        company: user.company,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token: access_token,
    };
  }

  logout(res: Response) {
    res.clearCookie('token');
    return { message: 'Logged out successfully' };
  }

  async generateInviteToken(inviteDto: InviteDto) {
    const { email, companyId, role } = inviteDto;

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.invite.create({
      data: {
        email,
        companyId,
        role,
        token,
        expiresAt,
      },
    });

    return token;
  }

  async validateInviteToken(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
    });

    if (!invite) {
      throw new UnauthorizedException('Invalid invite token');
    }

    if (invite.expiresAt < new Date()) {
      await this.prisma.invite.delete({ where: { token } });
      throw new UnauthorizedException('Invite token has expired');
    }

    return invite;
  }

  async validateUser(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      company: user.company,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async forgotPassword(email: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If an account with that email exists, we have sent a password reset link.' };
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database (you'll need to add these fields to User model)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't fail the request if email fails - for better UX
    }

    return { message: 'If an account with that email exists, we have sent a password reset link.' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Find user with valid reset token
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password has been reset successfully' };
  }

  async verifyEmail(token: string) {
    // Find user with valid verification token
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    // Mark email as verified
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    });

    return {
      message: 'Email verified successfully',
      email: user.email,
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return {
        message: 'If an account exists, a verification email has been sent',
      };
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpiry,
      },
    });

    // Send verification email
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
      await this.emailService.sendEmail({
        to: email,
        subject: 'Verify Your Email - CRM System',
        text: `Please verify your email by clicking this link: ${verificationUrl}`,
        html: `
          <h2>Email Verification</h2>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new BadRequestException(
        'Failed to send verification email. Please try again later.',
      );
    }

    return {
      message: 'Verification email sent successfully',
    };
  }

  async enableTwoFactor(userId: string) {
    // Generate secret for TOTP
    const secret = speakeasy.generateSecret({
      name: `CRM System (${userId})`,
      length: 32,
    });

    // Store the secret temporarily (not enabled until verified)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false, // Not enabled until verified
      },
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message:
        'Scan the QR code with your authenticator app and verify to enable 2FA',
    };
  }

  async verifyAndEnableTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException(
        '2FA setup not initiated. Please enable 2FA first.',
      );
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return {
      message: '2FA enabled successfully',
      enabled: true,
    };
  }

  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  async disableTwoFactor(userId: string, password: string) {
    // Verify password before disabling
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Disable 2FA and remove secret
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return {
      message: '2FA disabled successfully',
      enabled: false,
    };
  }
}