import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto, companyId: string) {
    // Ensure contact is created under the user's company
    const contactData = {
      ...createContactDto,
      companyId, // Force company ID from authenticated user
    };

    return this.prisma.contact.create({
      data: contactData,
      include: {
        company: true,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.contact.findMany({
      where: {
        companyId, // Filter by company
      },
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, companyId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        companyId, // Ensure contact belongs to user's company
      },
      include: {
        company: true,
        deals: {
          where: {
            companyId, // Also filter deals by company
          },
          include: {
            company: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto, companyId: string) {
    try {
      // First verify the contact belongs to the company
      const existingContact = await this.prisma.contact.findFirst({
        where: { id, companyId },
      });

      if (!existingContact) {
        throw new NotFoundException(`Contact with ID ${id} not found`);
      }

      return await this.prisma.contact.update({
        where: { id },
        data: updateContactDto,
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