import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SanitizerService } from '../common/sanitizer.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { Company } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private sanitizer: SanitizerService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto) {
    // ✅ Sanitize text inputs to prevent XSS
    const sanitizedData = {
      name: this.sanitizer.sanitizeText(createCompanyDto.name) || '',
      industry: this.sanitizer.sanitizeText(createCompanyDto.industry) || '',
      size: this.sanitizer.sanitizeText(createCompanyDto.size) || '',
      website: createCompanyDto.website,
      phone: createCompanyDto.phone
        ? this.sanitizer.sanitizeText(createCompanyDto.phone)
        : undefined,
      email: createCompanyDto.email,
      address: createCompanyDto.address
        ? this.sanitizer.sanitizeText(createCompanyDto.address)
        : undefined,
    };

    return this.prisma.company.create({
      data: sanitizedData,
    });
  }

  async findAll(
    pagination: PaginationDto = {},
  ): Promise<PaginatedResponse<Company>> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.company.count(),
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

  async findUserCompany(companyId: string) {
    // ✅ OPTIMIZED: Fetch paginated contacts/deals with counts
    const [company, contactCount, dealCount] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        include: {
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10, // ✅ Only fetch 10 most recent
          },
          deals: {
            select: {
              id: true,
              title: true,
              value: true,
              stage: true,
              priority: true,
              expectedCloseDate: true,
            },
            orderBy: { updatedAt: 'desc' },
            take: 10, // ✅ Only fetch 10 most recent
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.contact.count({ where: { companyId } }),
      this.prisma.deal.count({ where: { companyId } }),
    ]);

    if (!company) {
      throw new NotFoundException(`Company not found`);
    }

    // Return with metadata
    return [
      {
        ...company,
        _meta: {
          totalContacts: contactCount,
          totalDeals: dealCount,
          showingContacts: company.contacts?.length || 0,
          showingDeals: company.deals?.length || 0,
        },
      },
    ];
  }

  async findOne(id: string) {
    // ✅ OPTIMIZED: Fetch paginated contacts/deals with counts
    const [company, contactCount, dealCount] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id },
        include: {
          contacts: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10, // ✅ Only fetch 10 most recent
          },
          deals: {
            select: {
              id: true,
              title: true,
              value: true,
              stage: true,
              priority: true,
              expectedCloseDate: true,
            },
            orderBy: { updatedAt: 'desc' },
            take: 10, // ✅ Only fetch 10 most recent
          },
        },
      }),
      this.prisma.contact.count({ where: { companyId: id } }),
      this.prisma.deal.count({ where: { companyId: id } }),
    ]);

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // Return with metadata
    return {
      ...company,
      _meta: {
        totalContacts: contactCount,
        totalDeals: dealCount,
        showingContacts: company.contacts?.length || 0,
        showingDeals: company.deals?.length || 0,
      },
    };
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    // Sanitize text fields
    const sanitizedData: Partial<UpdateCompanyDto> = {};

    if (updateCompanyDto.name !== undefined) {
      sanitizedData.name =
        this.sanitizer.sanitizeText(updateCompanyDto.name) || undefined;
    }
    if (updateCompanyDto.industry !== undefined) {
      sanitizedData.industry =
        this.sanitizer.sanitizeText(updateCompanyDto.industry) ?? undefined;
    }
    if (updateCompanyDto.size !== undefined) {
      sanitizedData.size =
        this.sanitizer.sanitizeText(updateCompanyDto.size) ?? undefined;
    }
    if (updateCompanyDto.phone !== undefined) {
      sanitizedData.phone =
        this.sanitizer.sanitizeText(updateCompanyDto.phone) ?? undefined;
    }
    if (updateCompanyDto.address !== undefined) {
      sanitizedData.address =
        this.sanitizer.sanitizeText(updateCompanyDto.address) ?? undefined;
    }
    // Website and email are not sanitized (validated by DTOs)
    if (updateCompanyDto.website !== undefined) {
      sanitizedData.website = updateCompanyDto.website;
    }
    if (updateCompanyDto.email !== undefined) {
      sanitizedData.email = updateCompanyDto.email;
    }

    try {
      return await this.prisma.company.update({
        where: { id },
        data: sanitizedData,
      });
    } catch (error) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.company.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
  }
}
