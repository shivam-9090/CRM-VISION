import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../prisma/prisma.service';
import { SanitizerService } from '../common/sanitizer.service';
import { NotFoundException } from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    company: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockSanitizerService = {
    sanitize: jest.fn((text) => text),
  };

  const mockCompany = {
    id: 'company-1',
    name: 'Test Company',
    description: 'A test company',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SanitizerService,
          useValue: mockSanitizerService,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCompanyDto = {
      name: 'Test Company',
      description: 'A test company',
    };

    it('should create a new company', async () => {
      mockPrismaService.company.create.mockResolvedValue(mockCompany);

      const result = await service.create(createCompanyDto);

      expect(result).toEqual(mockCompany);
      expect(mockPrismaService.company.create).toHaveBeenCalledWith({
        data: createCompanyDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all companies', async () => {
      const companies = [mockCompany];
      mockPrismaService.company.findMany.mockResolvedValue(companies);
      mockPrismaService.company.count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(result.data).toEqual(companies);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(50);
      expect(mockPrismaService.company.findMany).toHaveBeenCalled();
      expect(mockPrismaService.company.count).toHaveBeenCalled();
    });

    it('should return empty array if no companies found', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([]);
      mockPrismaService.company.count.mockResolvedValue(0);

      const result = await service.findAll();

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a company by id', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);

      const result = await service.findOne('company-1');

      expect(result).toEqual(mockCompany);
      expect(mockPrismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        include: {
          contacts: true,
          deals: true,
        },
      });
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateCompanyDto = {
      name: 'Updated Company',
      description: 'Updated description',
    };

    it('should update a company', async () => {
      const updatedCompany = { ...mockCompany, ...updateCompanyDto };
      mockPrismaService.company.update.mockResolvedValue(updatedCompany);

      const result = await service.update('company-1', updateCompanyDto);

      expect(result).toEqual(updatedCompany);
      expect(mockPrismaService.company.update).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        data: updateCompanyDto,
      });
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrismaService.company.update.mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(
        service.update('invalid-id', updateCompanyDto),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should delete a company', async () => {
      mockPrismaService.company.delete.mockResolvedValue(mockCompany);

      const result = await service.remove('company-1');

      expect(result).toEqual(mockCompany);
      expect(mockPrismaService.company.delete).toHaveBeenCalledWith({
        where: { id: 'company-1' },
      });
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrismaService.company.delete.mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(service.remove('invalid-id')).rejects.toThrow();
    });
  });
});
