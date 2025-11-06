import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { SanitizerService } from '../common/sanitizer.service';
import { NotFoundException } from '@nestjs/common';
import { ActivityType, ActivityStatus } from '@prisma/client';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockSanitizerService = {
    sanitize: jest.fn((text) => text), // Pass through by default
  };

  const mockActivity = {
    id: 'activity-1',
    title: 'Test Meeting',
    type: ActivityType.MEETING,
    status: ActivityStatus.SCHEDULED,
    description: 'Quarterly review meeting',
    scheduledDate: new Date('2025-11-01T10:00:00Z'),
    companyId: 'company-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    company: {
      id: 'company-1',
      name: 'Test Company',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
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

    service = module.get<ActivitiesService>(ActivitiesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createActivityDto = {
      title: 'Test Meeting',
      type: ActivityType.MEETING,
      status: ActivityStatus.SCHEDULED,
      description: 'Quarterly review meeting',
      scheduledDate: '2025-11-01T10:00:00Z',
    };

    it('should create a new activity', async () => {
      mockPrismaService.activity.create.mockResolvedValue(mockActivity);

      const result = await service.create(createActivityDto, 'company-1');

      expect(result).toEqual(mockActivity);
      expect(mockPrismaService.activity.create).toHaveBeenCalledWith({
        data: {
          ...createActivityDto,
          scheduledDate: new Date(createActivityDto.scheduledDate),
          companyId: 'company-1',
        },
        include: {
          company: {
            select: { id: true, name: true },
          },
        },
      });
    });

    it('should convert scheduledDate to Date object', async () => {
      mockPrismaService.activity.create.mockResolvedValue(mockActivity);

      await service.create(createActivityDto, 'company-1');

      const createCall = mockPrismaService.activity.create.mock.calls[0][0];
      expect(createCall.data.scheduledDate).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('should return all activities for a company', async () => {
      const activities = [mockActivity];
      mockPrismaService.activity.findMany.mockResolvedValue(activities);
      mockPrismaService.activity.count.mockResolvedValue(1);

      const result = await service.findAll('company-1');

      expect(result.data).toEqual(activities);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(50);
      expect(mockPrismaService.activity.findMany).toHaveBeenCalled();
      expect(mockPrismaService.activity.count).toHaveBeenCalled();
    });

    it('should filter by activity type when provided', async () => {
      const activities = [mockActivity];
      mockPrismaService.activity.findMany.mockResolvedValue(activities);
      mockPrismaService.activity.count.mockResolvedValue(1);

      const result = await service.findAll('company-1', {}, 'MEETING');

      expect(result.data).toEqual(activities);
      expect(mockPrismaService.activity.findMany).toHaveBeenCalled();
      expect(mockPrismaService.activity.count).toHaveBeenCalled();
    });

    it('should return all activities when companyId not provided', async () => {
      const activities = [mockActivity];
      mockPrismaService.activity.findMany.mockResolvedValue(activities);
      mockPrismaService.activity.count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(result.data).toEqual(activities);
      expect(mockPrismaService.activity.findMany).toHaveBeenCalled();
      expect(mockPrismaService.activity.count).toHaveBeenCalled();
    });

    it('should return empty array if no activities found', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([]);
      mockPrismaService.activity.count.mockResolvedValue(0);

      const result = await service.findAll('company-1');

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return an activity by id', async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue(mockActivity);

      const result = await service.findOne('activity-1', 'company-1');

      expect(result).toEqual(mockActivity);
      expect(mockPrismaService.activity.findFirst).toHaveBeenCalledWith({
        where: { id: 'activity-1', companyId: 'company-1' },
        include: {
          company: {
            select: { id: true, name: true },
          },
        },
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id', 'company-1')).rejects.toThrow(
        'Activity not found',
      );
    });

    it('should work without companyId filter', async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue(mockActivity);

      await service.findOne('activity-1');

      expect(mockPrismaService.activity.findFirst).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
        include: {
          company: {
            select: { id: true, name: true },
          },
        },
      });
    });
  });

  describe('update', () => {
    const updateActivityDto = {
      title: 'Updated Meeting',
      status: ActivityStatus.COMPLETED,
    };

    it('should update an activity', async () => {
      const updatedActivity = { ...mockActivity, ...updateActivityDto };
      mockPrismaService.activity.findFirst.mockResolvedValue(mockActivity);
      mockPrismaService.activity.update.mockResolvedValue(updatedActivity);

      const result = await service.update(
        'activity-1',
        updateActivityDto,
        'company-1',
      );

      expect(result).toEqual(updatedActivity);
      expect(mockPrismaService.activity.update).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
        data: updateActivityDto,
        include: {
          company: {
            select: { id: true, name: true },
          },
        },
      });
    });

    it('should convert scheduledDate to Date object when provided', async () => {
      const updateWithDate = {
        ...updateActivityDto,
        scheduledDate: '2025-12-01T14:00:00Z',
      };
      mockPrismaService.activity.findFirst.mockResolvedValue(mockActivity);
      mockPrismaService.activity.update.mockResolvedValue(mockActivity);

      await service.update('activity-1', updateWithDate, 'company-1');

      const updateCall = mockPrismaService.activity.update.mock.calls[0][0];
      expect(updateCall.data.scheduledDate).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', updateActivityDto, 'company-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should work without companyId filter', async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue(mockActivity);
      mockPrismaService.activity.update.mockResolvedValue(mockActivity);

      await service.update('activity-1', updateActivityDto);

      expect(mockPrismaService.activity.findFirst).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
      });
    });
  });

  describe('remove', () => {
    it('should delete an activity', async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue(mockActivity);
      mockPrismaService.activity.delete.mockResolvedValue(mockActivity);

      const result = await service.remove('activity-1', 'company-1');

      expect(result).toEqual(mockActivity);
      expect(mockPrismaService.activity.delete).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should work without companyId filter', async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue(mockActivity);
      mockPrismaService.activity.delete.mockResolvedValue(mockActivity);

      await service.remove('activity-1');

      expect(mockPrismaService.activity.findFirst).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
      });
    });
  });
});
