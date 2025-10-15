import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async create(createDealDto: CreateDealDto, userId: string) {
    return this.prisma.deal.create({
      data: createDealDto,
      include: {
        company: true,
        contact: true,
      },
    });
  }

  async findAll() {
    return this.prisma.deal.findMany({
      include: {
        company: true,
        contact: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
      },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  async update(id: string, updateDealDto: UpdateDealDto) {
    try {
      return await this.prisma.deal.update({
        where: { id },
        data: updateDealDto,
        include: {
          company: true,
          contact: true,
        },
      });
    } catch {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.deal.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }
  }
}