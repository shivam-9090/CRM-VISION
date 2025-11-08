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
      sanitizedData.name =
        this.sanitizer.sanitizeText(updateUserDto.name) || undefined;
    }

    if (updateUserDto.phone !== undefined) {
      sanitizedData.phone =
        this.sanitizer.sanitizeText(updateUserDto.phone) ?? undefined;
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
      throw new ConflictException(
        'An active invitation already exists for this email',
      );
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

  // ==================== EMPLOYEE MANAGEMENT METHODS ====================

  /**
   * Add a new employee to the company
   * Only MANAGER and ADMIN can add employees
   * @param addEmployeeDto - Employee details
   * @param companyId - Company ID
   * @returns Created employee user
   */
  async addEmployee(addEmployeeDto: InviteUserDto, companyId: string) {
    const { email, role, customPassword } = addEmployeeDto;

    // Validate email
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }

    // Force EMPLOYEE role (managers can't create other managers via this endpoint)
    const employeeRole = 'EMPLOYEE';

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists in the system',
      );
    }

    // Use custom password if provided, otherwise generate temporary password
    const plainPassword = customPassword || randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    // Create employee user
    const employee = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        plainPassword: plainPassword, // Store plain password for manager access
        name: addEmployeeDto.email.split('@')[0], // Temporary name from email
        role: employeeRole,
        companyId,
        isVerified: false, // Employee must verify email
        verificationToken: randomBytes(32).toString('hex'),
        verificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        isVerified: true,
      },
    });

    // Send welcome email with login credentials
    try {
      await this.emailService.sendInvitationEmail(
        email,
        `${process.env.FRONTEND_URL}/auth/login`,
        employeeRole,
      );
    } catch (error) {
      console.error('Failed to send employee welcome email:', error);
      // Don't throw - employee is still created
    }

    return {
      ...employee,
      temporaryPassword: plainPassword, // Return password for manager to share
      message: customPassword
        ? 'Employee added successfully with custom password.'
        : 'Employee added successfully. Please share the temporary password with them.',
    };
  }

  /**
   * Get all employees in the company (excludes MANAGER and ADMIN roles)
   * @param companyId - Company ID
   * @returns List of employees
   */
  async getEmployees(companyId: string) {
    const employees = await this.prisma.user.findMany({
      where: {
        companyId,
        role: 'EMPLOYEE', // Only get employees, not managers or admins
      },
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
        plainPassword: true, // Include plain password for manager access
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      employees,
      total: employees.length,
    };
  }

  /**
   * Update employee information
   * @param id - Employee ID
   * @param updateUserDto - Updated data
   * @param companyId - Company ID for authorization
   * @returns Updated employee
   */
  async updateEmployee(
    id: string,
    updateUserDto: UpdateUserDto,
    companyId: string,
  ) {
    // Verify employee exists and belongs to company
    const employee = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
        role: 'EMPLOYEE',
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found in your company');
    }

    // Sanitize inputs
    const sanitizedData: any = {};
    if (updateUserDto.name) {
      sanitizedData.name = this.sanitizer.sanitizeText(updateUserDto.name);
    }
    if (updateUserDto.phone) {
      sanitizedData.phone = this.sanitizer.sanitizeText(updateUserDto.phone);
    }
    // Prevent role changes through this endpoint
    delete updateUserDto.role;

    // Update employee
    const updated = await this.prisma.user.update({
      where: { id },
      data: sanitizedData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Remove employee from company
   * @param id - Employee ID
   * @param companyId - Company ID
   * @param currentUserId - Current user ID (can't delete self)
   * @returns void
   */
  async removeEmployee(
    id: string,
    companyId: string,
    currentUserId: string,
  ) {
    // Can't remove yourself
    if (id === currentUserId) {
      throw new BadRequestException('You cannot remove yourself');
    }

    // Verify employee exists and belongs to company
    const employee = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
        role: 'EMPLOYEE',
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found in your company');
    }

    // Delete employee
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Employee removed successfully' };
  }

  /**
   * Change user password
   * @param userId - User ID
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @returns Success message
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    // Get user with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new BadRequestException(
        'New password must be at least 6 characters long',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        plainPassword: null, // Clear plain password when user changes it
      },
    });

    return { message: 'Password changed successfully' };
  }
}
