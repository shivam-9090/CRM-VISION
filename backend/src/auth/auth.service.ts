import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InviteDto } from './dto/invite.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, role, companyName, industry } = registerDto;

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
      // Create company first
      const company = await prisma.company.create({
        data: {
          name: companyName,
          industry,
          size: 'SMALL', // Default size
        },
      });

      // Create user with company
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || Role.ADMIN,
          companyId: company.id,
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

      return { user, company };
    });

    const payload = { id: result.user.id, role: result.user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: result.user,
    };
  }

  async login(loginDto: LoginDto) {
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

    return {
      access_token,
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
    };
  }

  generateInviteToken(inviteDto: InviteDto) {
    const { email, companyId, role } = inviteDto;

    const payload = {
      email,
      companyId,
      role,
      type: 'invite',
    };

    return this.jwtService.sign(payload, { expiresIn: '24h' });
  }

  validateInviteToken(token: string) {
    try {
      const payload = this.jwtService.verify(token) as any;
      if (payload.type !== 'invite') {
        throw new UnauthorizedException('Invalid invite token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired invite token');
    }
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