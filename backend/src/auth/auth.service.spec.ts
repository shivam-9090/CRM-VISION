import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

// Mock bcrypt at module level
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    company: {
      create: jest.fn(),
    },
    invite: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
    // Reset bcrypt mocks to clear state between tests
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: Role.ADMIN,
    };

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: Role.ADMIN,
      companyId: 'company-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      company: {
        id: 'company-1',
        name: "Test User's Company",
      },
    };

    it('should successfully register a new user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          company: { create: jest.fn().mockResolvedValue({ id: 'company-1' }) },
          user: { create: jest.fn().mockResolvedValue(mockUser) },
        });
      });
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.register(registerDto, mockResponse);

      // Response body only contains user (token is in cookie)
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(result).not.toHaveProperty('access_token');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        'mock-jwt-token',
        expect.any(Object),
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto, mockResponse)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto, mockResponse)).rejects.toThrow(
        'User with this email already exists',
      );
    });

    it('should create a new company if companyId is not provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      
      const createCompanyMock = jest.fn().mockResolvedValue({ id: 'new-company-1' });
      const createUserMock = jest.fn().mockResolvedValue(mockUser);
      
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          company: { create: createCompanyMock },
          user: { create: createUserMock },
        });
      });
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      await service.register(registerDto, mockResponse);

      expect(createCompanyMock).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      password: '$2a$12$hashedpassword',
      name: 'Test User',
      role: Role.ADMIN,
      companyId: 'company-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      company: {
        id: 'company-1',
        name: "Test User's Company",
      },
    };

    it('should successfully login with valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockImplementation(() => Promise.resolve(true));
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(loginDto, mockResponse);

      // Response body only contains user (token is in cookie)
      expect(result).toHaveProperty('user');
      expect(result).not.toHaveProperty('access_token');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        'mock-jwt-token',
        expect.any(Object),
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, mockResponse)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginDto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, mockResponse)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('generateInviteToken', () => {
    it('should generate an invite token', async () => {
      const inviteDto = {
        email: 'invite@example.com',
        companyId: 'company-1',
        role: Role.EMPLOYEE,
      };

      mockPrismaService.invite.create.mockResolvedValue({
        id: 'invite-1',
        email: inviteDto.email,
        companyId: inviteDto.companyId,
        role: inviteDto.role,
        token: 'generated-hex-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const token = await service.generateInviteToken(inviteDto);

      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes as hex = 64 chars
      expect(mockPrismaService.invite.create).toHaveBeenCalledWith({
        data: {
          email: inviteDto.email,
          companyId: inviteDto.companyId,
          role: inviteDto.role,
          token: expect.any(String),
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  describe('validateInviteToken', () => {
    it('should validate a valid invite token', async () => {
      const mockInvite = {
        id: 'invite-1',
        email: 'invite@example.com',
        companyId: 'company-1',
        role: Role.EMPLOYEE,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future date
        createdAt: new Date(),
      };

      mockPrismaService.invite.findUnique.mockResolvedValue(mockInvite);

      const result = await service.validateInviteToken('valid-token');

      expect(result).toEqual(mockInvite);
      expect(mockPrismaService.invite.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockPrismaService.invite.findUnique.mockResolvedValue(null);

      await expect(
        service.validateInviteToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.validateInviteToken('invalid-token'),
      ).rejects.toThrow('Invalid invite token');
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const expiredInvite = {
        id: 'invite-1',
        email: 'invite@example.com',
        companyId: 'company-1',
        role: Role.EMPLOYEE,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000), // Past date
        createdAt: new Date(),
      };

      mockPrismaService.invite.findUnique.mockResolvedValue(expiredInvite);
      mockPrismaService.invite.delete.mockResolvedValue(expiredInvite);

      await expect(
        service.validateInviteToken('expired-token'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.validateInviteToken('expired-token'),
      ).rejects.toThrow('Invite token has expired');

      expect(mockPrismaService.invite.delete).toHaveBeenCalledWith({
        where: { token: 'expired-token' },
      });
    });
  });

  describe('validateUser', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: Role.ADMIN,
      companyId: 'company-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      company: {
        id: 'company-1',
        name: "Test User's Company",
      },
    };

    it('should validate and return user data', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser({ id: '1' });

      expect(result).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser({ id: 'invalid' })).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateUser({ id: 'invalid' })).rejects.toThrow(
        'User not found',
      );
    });
  });
});
