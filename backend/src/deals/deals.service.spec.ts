import { Test, TestingModule } from '@nestjs/testing';
import { DealsService } from './deals.service';
import { PrismaService } from '../prisma/prisma.service';
import { SanitizerService } from '../common/sanitizer.service';
import { NotFoundException } from '@nestjs/common';
import { DealStage, Priority, LeadSource } from '@prisma/client';

describe('DealsService', () => {
  let service: DealsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    deal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockSanitizerService = {
    sanitize: jest.fn((text) => text),
  };
  const mockDeal = {
    id: 'deal-1',
    title: 'Test Deal',
    value: 10000,
    stage: DealStage.LEAD,
    leadSource: LeadSource.WEBSITE,
    leadScore: 75,
    priority: Priority.HIGH,
    contactId: 'contact-1',
    companyId: 'company-1',
    assignedToId: 'user-1',
    expectedCloseDate: new Date('2025-12-31'),
    notes: 'Test notes',
    createdAt: new Date(),
    updatedAt: new Date(),
    company: { id: 'company-1', name: 'Test Company' },
    contact: { id: 'contact-1', firstName: 'John', lastName: 'Doe' },
    assignedTo: { id: 'user-1', name: 'Test User', email: 'user@test.com' },
  };

  const mockUser = {
    id: 'user-1',
    companyId: 'company-1',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
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

    service = module.get<DealsService>(DealsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDealDto = {
      title: 'Test Deal',
      value: 10000,
      stage: DealStage.LEAD,
      leadSource: LeadSource.WEBSITE,
      priority: Priority.HIGH,
      contactId: 'contact-1',
      expectedCloseDate: '2025-12-31',
      notes: 'Test notes',
    };

    it('should create a new deal with auto-calculated leadScore', async () => {
      mockPrismaService.deal.create.mockResolvedValue(mockDeal);

      const result = await service.create(createDealDto, mockUser);

      expect(result).toEqual(mockDeal);
      expect(mockPrismaService.deal.create).toHaveBeenCalled();
      const createCall = mockPrismaService.deal.create.mock.calls[0][0];
      // Should have company relation
      expect(createCall.data.company).toEqual({ connect: { id: 'company-1' } });
      // Should have auto-calculated leadScore
      expect(createCall.data.leadScore).toBeGreaterThan(0);
    });

    it('should convert expectedCloseDate to Date object', async () => {
      mockPrismaService.deal.create.mockResolvedValue(mockDeal);

      await service.create(createDealDto, mockUser);

      const createCall = mockPrismaService.deal.create.mock.calls[0][0];
      expect(createCall.data.expectedCloseDate).toBeInstanceOf(Date);
    });

    it('should force companyId from authenticated user via relation', async () => {
      mockPrismaService.deal.create.mockResolvedValue(mockDeal);

      await service.create(createDealDto, mockUser);

      const createCall = mockPrismaService.deal.create.mock.calls[0][0];
      expect(createCall.data.company).toEqual({ connect: { id: 'company-1' } });
    });
  });

  describe('findAll', () => {
    it('should return all deals for a company', async () => {
      const deals = [mockDeal];
      mockPrismaService.deal.findMany.mockResolvedValue(deals);
      mockPrismaService.deal.count.mockResolvedValue(1);

      const result = await service.findAll('company-1');

      expect(result.data).toEqual(deals);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(50);
      expect(mockPrismaService.deal.findMany).toHaveBeenCalled();
      expect(mockPrismaService.deal.count).toHaveBeenCalledWith({
        where: { companyId: 'company-1' },
      });
    });

    it('should return empty array if no deals found', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);

      const result = await service.findAll('company-1');

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a deal by id', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(mockDeal);

      const result = await service.findOne('deal-1', 'company-1');

      expect(result).toEqual(mockDeal);
      expect(mockPrismaService.deal.findFirst).toHaveBeenCalledWith({
        where: { id: 'deal-1', companyId: 'company-1' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    });

    it('should throw NotFoundException if deal not found', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id', 'company-1')).rejects.toThrow(
        'Deal with ID invalid-id not found',
      );
    });
  });

  describe('update', () => {
    const updateDealDto = {
      title: 'Updated Deal',
      stage: DealStage.QUALIFIED,
    };

    it('should update a deal', async () => {
      const updatedDeal = { ...mockDeal, ...updateDealDto };
      mockPrismaService.deal.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.deal.findFirst.mockResolvedValue(updatedDeal);

      const result = await service.update('deal-1', updateDealDto, 'company-1');

      expect(result).toEqual(updatedDeal);
      expect(mockPrismaService.deal.updateMany).toHaveBeenCalledWith({
        where: { id: 'deal-1', companyId: 'company-1' },
        data: expect.objectContaining({
          title: 'Updated Deal',
          stage: DealStage.QUALIFIED,
        }),
      });
    });

    it('should set closedAt when deal is CLOSED_WON', async () => {
      const closeDealDto = { stage: DealStage.CLOSED_WON };
      mockPrismaService.deal.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.deal.findFirst.mockResolvedValue({
        ...mockDeal,
        stage: DealStage.CLOSED_WON,
        closedAt: new Date(),
      });

      await service.update('deal-1', closeDealDto, 'company-1');

      expect(mockPrismaService.deal.updateMany).toHaveBeenCalledWith({
        where: { id: 'deal-1', companyId: 'company-1' },
        data: expect.objectContaining({
          stage: DealStage.CLOSED_WON,
          closedAt: expect.any(Date),
        }),
      });
    });

    it('should set closedAt when deal is CLOSED_LOST', async () => {
      const closeDealDto = { stage: DealStage.CLOSED_LOST };
      mockPrismaService.deal.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.deal.findFirst.mockResolvedValue({
        ...mockDeal,
        stage: DealStage.CLOSED_LOST,
        closedAt: new Date(),
      });

      await service.update('deal-1', closeDealDto, 'company-1');

      expect(mockPrismaService.deal.updateMany).toHaveBeenCalledWith({
        where: { id: 'deal-1', companyId: 'company-1' },
        data: expect.objectContaining({
          stage: DealStage.CLOSED_LOST,
          closedAt: expect.any(Date),
        }),
      });
    });

    it('should clear closedAt when deal is reopened', async () => {
      const reopenDealDto = { stage: DealStage.PROPOSAL };
      mockPrismaService.deal.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.deal.findFirst.mockResolvedValue({
        ...mockDeal,
        stage: DealStage.PROPOSAL,
        closedAt: null,
      });

      await service.update('deal-1', reopenDealDto, 'company-1');

      expect(mockPrismaService.deal.updateMany).toHaveBeenCalledWith({
        where: { id: 'deal-1', companyId: 'company-1' },
        data: expect.objectContaining({
          stage: DealStage.PROPOSAL,
          closedAt: null,
        }),
      });
    });

    it('should throw NotFoundException if deal not found', async () => {
      mockPrismaService.deal.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update('invalid-id', updateDealDto, 'company-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a deal', async () => {
      mockPrismaService.deal.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove('deal-1', 'company-1');

      expect(result).toEqual({ message: 'Deal deleted successfully' });
      expect(mockPrismaService.deal.deleteMany).toHaveBeenCalledWith({
        where: { id: 'deal-1', companyId: 'company-1' },
      });
    });

    it('should throw NotFoundException if deal not found', async () => {
      mockPrismaService.deal.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove('invalid-id', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
