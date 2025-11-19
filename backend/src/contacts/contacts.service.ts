import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SanitizerService } from '../common/sanitizer.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { Contact } from '@prisma/client';

@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaService,
    private sanitizer: SanitizerService,
  ) {}

  async create(createContactDto: CreateContactDto, companyId: string) {
    // ✅ Sanitize text inputs to prevent XSS
    const sanitizedData = {
      firstName: this.sanitizer.sanitizeText(createContactDto.firstName) || '',
      lastName: this.sanitizer.sanitizeText(createContactDto.lastName) || '',
      email: createContactDto.email, // Email is validated by DTO
      phone: createContactDto.phone
        ? this.sanitizer.sanitizeText(createContactDto.phone)
        : undefined,
      position: createContactDto.position
        ? this.sanitizer.sanitizeText(createContactDto.position)
        : undefined,
      companyId, // Force company ID from authenticated user
    };

    return this.prisma.contact.create({
      data: sanitizedData,
      include: {
        company: true,
      },
    });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto = {},
  ): Promise<PaginatedResponse<Contact>> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where: { companyId },
        include: {
          company: {
            select: { id: true, name: true }, // ✅ Only fetch needed fields
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count({ where: { companyId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string, companyId: string) {
    // ✅ OPTIMIZED: Paginate deals and optimize selects
    const [contact, dealCount] = await Promise.all([
      this.prisma.contact.findFirst({
        where: {
          id,
          companyId, // Ensure contact belongs to user's company
        },
        include: {
          company: {
            select: { id: true, name: true }, // ✅ Only needed fields
          },
          deals: {
            where: {
              companyId, // Also filter deals by company
            },
            select: {
              id: true,
              title: true,
              value: true,
              stage: true,
              priority: true,
              expectedCloseDate: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { updatedAt: 'desc' },
            take: 10, // ✅ Only fetch 10 most recent
          },
        },
      }),
      this.prisma.deal.count({
        where: { contactId: id, companyId },
      }),
    ]);

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    // Return with metadata
    return {
      ...contact,
      _meta: {
        totalDeals: dealCount,
        showingDeals: contact.deals?.length || 0,
      },
    };
  }

  async update(
    id: string,
    updateContactDto: UpdateContactDto,
    companyId: string,
  ) {
    try {
      // First verify the contact belongs to the company
      const existingContact = await this.prisma.contact.findFirst({
        where: { id, companyId },
      });

      if (!existingContact) {
        throw new NotFoundException(`Contact with ID ${id} not found`);
      }

      // ✅ Sanitize updated fields
      const sanitizedUpdate: any = {};
      if (updateContactDto.firstName !== undefined) {
        sanitizedUpdate.firstName =
          this.sanitizer.sanitizeText(updateContactDto.firstName) || '';
      }
      if (updateContactDto.lastName !== undefined) {
        sanitizedUpdate.lastName =
          this.sanitizer.sanitizeText(updateContactDto.lastName) || '';
      }
      if (updateContactDto.email !== undefined) {
        sanitizedUpdate.email = updateContactDto.email;
      }
      if (updateContactDto.phone !== undefined) {
        sanitizedUpdate.phone = updateContactDto.phone
          ? this.sanitizer.sanitizeText(updateContactDto.phone)
          : null;
      }
      if (updateContactDto.position !== undefined) {
        sanitizedUpdate.position = updateContactDto.position
          ? this.sanitizer.sanitizeText(updateContactDto.position)
          : null;
      }

      return await this.prisma.contact.update({
        where: { id },
        data: sanitizedUpdate,
        include: {
          company: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
  }

  async remove(id: string, companyId: string) {
    try {
      // First verify the contact belongs to the company
      const existingContact = await this.prisma.contact.findFirst({
        where: { id, companyId },
      });

      if (!existingContact) {
        throw new NotFoundException(`Contact with ID ${id} not found`);
      }

      return await this.prisma.contact.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
  }
}
