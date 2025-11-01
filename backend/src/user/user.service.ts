import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, InviteUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { SanitizerService } from '../common/sanitizer.service';
import { EmailService } from '../common/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sanitizer: SanitizerService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Get all users in a specific company
   * @param companyId - Company ID to filter users
   * @returns List of users (without passwords)
   */
  async findAllByCompany(companyId: string) {
    const users = await this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        isVerified: true,
        twoFactorEnabled: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  /**
   * Get a single user by ID
   * @param id - User ID
   * @param companyId - Company ID for authorization
   * @returns User details (without password)
   */
  async findOne(id: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        lastLoginIp: true,
        isVerified: true,
        twoFactorEnabled: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   * @param id - User ID
   * @param updateUserDto - Update data
   * @param companyId - Company ID for authorization
   * @returns Updated user
   */
  async update(id: string, updateUserDto: UpdateUserDto, companyId: string) {
    // Check if user exists and belongs to the company
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Sanitize text inputs
    const sanitizedData: any = {};

    if (updateUserDto.name !== undefined) {
      sanitizedData.name = this.sanitizer.sanitizeText(updateUserDto.name) || undefined;
    }

    if (updateUserDto.phone !== undefined) {
      sanitizedData.phone = this.sanitizer.sanitizeText(updateUserDto.phone) ?? undefined;
    }

    if (updateUserDto.role !== undefined) {
      sanitizedData.role = updateUserDto.role;
    }

    // Handle email change
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException('Email already in use');
      }

      sanitizedData.email = updateUserDto.email;
      // Reset verification status on email change
      sanitizedData.isVerified = false;
    }

    // Handle password change
    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      sanitizedData.password = hashedPassword;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: sanitizedData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        isVerified: true,
        twoFactorEnabled: true,
      },
    });

    return updatedUser;
  }

  /**
   * Delete a user (soft delete by removing from company)
   * @param id - User ID
   * @param companyId - Company ID for authorization
   * @param currentUserId - ID of user performing deletion (cannot delete self)
   */
  async remove(id: string, companyId: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has assigned deals
    const assignedDealsCount = await this.prisma.deal.count({
      where: { assignedToId: id },
    });

    if (assignedDealsCount > 0) {
      throw new BadRequestException(
        `Cannot delete user with ${assignedDealsCount} assigned deals. Please reassign them first.`,
      );
    }

    // Soft delete: set companyId to null (or hard delete based on requirements)
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  /**
   * Invite a new user to the company
   * @param inviteUserDto - Invitation data
   * @param companyId - Company ID
   * @returns Invitation details
   */
  async inviteUser(inviteUserDto: InviteUserDto, companyId: string) {
    const { email, role } = inviteUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if invitation already exists
    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        email,
        companyId,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ConflictException('An active invitation already exists for this email');
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const invite = await this.prisma.invite.create({
      data: {
        email,
        companyId,
        role,
        token,
        expiresAt,
      },
    });

    // Send invitation email
    const inviteUrl = `${process.env.FRONTEND_URL}/auth/accept-invite?token=${token}`;
    
    try {
      await this.emailService.sendInvitationEmail(email, inviteUrl, role);
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Don't throw error - invitation is still created
    }

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      inviteUrl, // For testing/manual sharing
    };
  }

  /**
   * Get user profile (current user)
   * @param userId - User ID from JWT
   * @returns User profile with company details
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        isVerified: true,
        twoFactorEnabled: true,
        company: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
