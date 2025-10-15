import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto) {
    return this.prisma.contact.create({
      data: createContactDto,
      include: {
        company: true,
      },
    });
  }

  async findAll() {
    return this.prisma.contact.findMany({
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        company: true,
        deals: {
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

  async update(id: string, updateContactDto: UpdateContactDto) {
    try {
      return await this.prisma.contact.update({
        where: { id },
        data: updateContactDto,
        include: {
          company: true,
        },
      });
    } catch {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.contact.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
  }
}