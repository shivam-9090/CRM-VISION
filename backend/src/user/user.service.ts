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
    const { email, customPassword } = addEmployeeDto;

    // Validate email
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }

    // Force EMPLOYEE role
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

    // Create employee user - AUTO VERIFIED (manager adds so trusted)
    const employee = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        plainPassword: plainPassword,
        name: addEmployeeDto.email.split('@')[0],
        role: employeeRole,
        companyId,
        isVerified: true, // AUTO VERIFIED - manager is trusted
        verificationToken: null,
        verificationExpiry: null,
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

    // Send welcome email (no verification needed)
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
                .content { padding: 40px; color: #333; }
                .content h2 { color: #667eea; font-size: 22px; margin-top: 0; }
                .box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px; }
                .box p { margin: 10px 0; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #e0e0e0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>👋 Welcome to CRM!</h1>
                </div>
                <div class="content">
                    <h2>Hi ${employee.name},</h2>
                    <p>Your manager has added you to the CRM system. You're ready to start using it!</p>
                    <div class="box">
                        <p><strong>Email:</strong> ${employee.email}</p>
                        <p><strong>Temporary Password:</strong> ${plainPassword}</p>
                        <p><strong>Login URL:</strong> <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login">Click here to login</a></p>
                    </div>
                    <p><strong>Next Steps:</strong></p>
                    <ol>
                        <li>Go to login page</li>
                        <li>Enter your email and temporary password</li>
                        <li>Change your password immediately</li>
                        <li>Start managing your tasks!</li>
                    </ol>
                    <p>Best regards,<br><strong>CRM Administration Team</strong></p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} CRM System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `;

      const text = `Welcome to CRM!\n\nHi ${employee.name},\n\nYour manager has added you to the CRM system.\n\nEmail: ${employee.email}\nTemporary Password: ${plainPassword}\nLogin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login\n\nChange your password immediately after first login.\n\nBest regards,\nCRM Administration Team`;

      await this.emailService.sendEmail({
        to: employee.email,
        subject: 'Welcome to CRM System - Login Credentials',
        html,
        text,
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return {
      ...employee,
      temporaryPassword: plainPassword,
      message: 'Employee added successfully! Welcome email sent to ' + email,
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
  async removeEmployee(id: string, companyId: string, currentUserId: string) {
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

  /**
   * Verify employee email address using token
   * @param token - Verification token from email
   * @returns Verified user info
   */
  async verifyEmail(token: string) {
    // Find user with this verification token
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired verification token. Please request a new one.',
      );
    }

    // Mark user as verified
    const verifiedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null, // Clear token after use
        verificationExpiry: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return {
      ...verifiedUser,
      message: 'Email verified successfully! You can now log in.',
    };
  }
}
