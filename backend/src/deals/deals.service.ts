import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { DealStage } from '@prisma/client';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async create(createDealDto: CreateDealDto, user: any) {
    // Ensure the deal is created under the user's company
    const dealData = {
      ...createDealDto,
      companyId: user.companyId, // Force company ID from authenticated user
    };

    return this.prisma.deal.create({
      data: dealData,
      include: {
        company: true,
        contact: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.deal.findMany({
      where: {
        companyId, // Filter by company
      },
      include: {
        company: true,
        contact: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { leadScore: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string, companyId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id,
        companyId, // Ensure deal belongs to user's company
      },
      include: {
        company: true,
        contact: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  async update(id: string, updateDealDto: UpdateDealDto, companyId: string) {
    try {
      // First verify the deal belongs to the company
      const existingDeal = await this.prisma.deal.findFirst({
        where: { id, companyId },
      });

      if (!existingDeal) {
        throw new NotFoundException(`Deal with ID ${id} not found`);
      }

      // Auto-set closedAt when deal is closed
      let dataToUpdate = updateDealDto;
      
      if (updateDealDto.stage) {
        if (
          updateDealDto.stage === DealStage.CLOSED_WON ||
          updateDealDto.stage === DealStage.CLOSED_LOST
        ) {
          // Set closedAt when deal is closed
          dataToUpdate = { ...updateDealDto, closedAt: new Date().toISOString() };
        } else {
          // Clear closedAt if deal is reopened (set to null in database)
          dataToUpdate = { ...updateDealDto, closedAt: null as any };
        }
      }

      return await this.prisma.deal.update({
        where: { id },
        data: dataToUpdate,
        include: {
          company: true,
          contact: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }
  }

  async remove(id: string, companyId: string) {
    try {
      // First verify the deal belongs to the company
      const existingDeal = await this.prisma.deal.findFirst({
        where: { id, companyId },
      });

      if (!existingDeal) {
        throw new NotFoundException(`Deal with ID ${id} not found`);
      }

      return await this.prisma.deal.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }
  }
}