import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InviteDto } from './dto/invite.dto';
import { Role } from '@prisma/client';
import { RegisterWithInviteDto } from './dto/register-with-invite.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto, res: Response) {
    const { email, password, name, role, companyId } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with 12 rounds
    const hashedPassword = await bcrypt.hash(password, 12);

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

      return { user };
    });

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
    const { email, password } = loginDto;

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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

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
}