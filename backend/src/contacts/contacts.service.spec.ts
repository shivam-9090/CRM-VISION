import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../prisma/prisma.service';
import { SanitizerService } from '../common/sanitizer.service';
import { NotFoundException } from '@nestjs/common';

describe('ContactsService', () => {
  let service: ContactsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    contact: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockSanitizerService = {
    sanitize: jest.fn((text) => text),
  };

  const mockContact = {
    id: 'contact-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
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
        ContactsService,
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

    service = module.get<ContactsService>(ContactsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createContactDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      companyId: 'company-1',
    };

    it('should create a new contact', async () => {
      mockPrismaService.contact.create.mockResolvedValue(mockContact);

      const result = await service.create(createContactDto, 'company-1');

      expect(result).toEqual(mockContact);
      expect(mockPrismaService.contact.create).toHaveBeenCalledWith({
        data: { ...createContactDto, companyId: 'company-1' },
        include: { company: true },
      });
    });

    it('should override companyId with the authenticated users company', async () => {
      const dtoWithDifferentCompany = {
        ...createContactDto,
        companyId: 'different-company',
      };

      mockPrismaService.contact.create.mockResolvedValue(mockContact);

      await service.create(dtoWithDifferentCompany, 'company-1');

      expect(mockPrismaService.contact.create).toHaveBeenCalledWith({
        data: { ...dtoWithDifferentCompany, companyId: 'company-1' },
        include: { company: true },
      });
    });
  });

  describe('findAll', () => {
    it('should return all contacts for a company', async () => {
      const contacts = [mockContact];
      mockPrismaService.contact.findMany.mockResolvedValue(contacts);
      mockPrismaService.contact.count.mockResolvedValue(1);

      const result = await service.findAll('company-1');

      expect(result.data).toEqual(contacts);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(50);
      expect(mockPrismaService.contact.findMany).toHaveBeenCalled();
      expect(mockPrismaService.contact.count).toHaveBeenCalledWith({
        where: { companyId: 'company-1' },
      });
    });

    it('should return empty array if no contacts found', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      mockPrismaService.contact.count.mockResolvedValue(0);

      const result = await service.findAll('company-1');

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a contact by id', async () => {
      const contactWithDeals = {
        ...mockContact,
        deals: [],
      };
      mockPrismaService.contact.findFirst.mockResolvedValue(contactWithDeals);

      const result = await service.findOne('contact-1', 'company-1');

      expect(result).toEqual(contactWithDeals);
      expect(mockPrismaService.contact.findFirst).toHaveBeenCalledWith({
        where: { id: 'contact-1', companyId: 'company-1' },
        include: {
          company: true,
          deals: {
            where: { companyId: 'company-1' },
            include: { company: true },
          },
        },
      });
    });

    it('should throw NotFoundException if contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id', 'company-1')).rejects.toThrow(
        'Contact with ID invalid-id not found',
      );
    });

    it('should throw NotFoundException if contact belongs to different company', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('contact-1', 'different-company'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateContactDto = {
      firstName: 'Jane',
      email: 'jane@example.com',
    };

    it('should update a contact', async () => {
      const updatedContact = { ...mockContact, ...updateContactDto };
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContact);
      mockPrismaService.contact.update.mockResolvedValue(updatedContact);

      const result = await service.update(
        'contact-1',
        updateContactDto,
        'company-1',
      );

      expect(result).toEqual(updatedContact);
      expect(mockPrismaService.contact.update).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
        data: updateContactDto,
        include: { company: true },
      });
    });

    it('should throw NotFoundException if contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', updateContactDto, 'company-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if contact belongs to different company', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.update('contact-1', updateContactDto, 'different-company'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a contact', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContact);
      mockPrismaService.contact.delete.mockResolvedValue(mockContact);

      const result = await service.remove('contact-1', 'company-1');

      expect(result).toEqual(mockContact);
      expect(mockPrismaService.contact.delete).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
      });
    });

    it('should throw NotFoundException if contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id', 'company-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if contact belongs to different company', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('contact-1', 'different-company'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
