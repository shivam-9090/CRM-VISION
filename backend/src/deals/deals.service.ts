import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { FilterDealDto } from './dto/filter-deal.dto';
import { DealStage, Deal, Prisma, LeadSource, Priority } from '@prisma/client';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  // ✅ Reusable include config - prevents code duplication & over-fetching
  private getDealIncludes(): Prisma.DealInclude {
    return {
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
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    };
  }

  // ✅ Auto-calculate lead score based on deal attributes
  private calculateLeadScore(deal: Partial<Deal> | any): number {
    let score = 0;

    // Value-based scoring (30 points max)
    if (deal.value) {
      const value = typeof deal.value === 'number' ? deal.value : Number(deal.value);
      if (value > 10000) score += 30;
      else if (value > 5000) score += 20;
      else if (value > 1000) score += 10;
      else score += 5;
    }

    // Lead source quality (25 points max)
    const sourceScores: Record<string, number> = {
      REFERRAL: 25,
      LINKEDIN: 20,
      WEBSITE: 15,
      GOOGLE_ADS: 15,
      FACEBOOK: 10,
      COLD_CALL: 5,
      OTHER: 5,
    };
    score += sourceScores[deal.leadSource as string] || 5;

    // Stage progression (35 points max)
    const stageScores: Record<string, number> = {
      LEAD: 5,
      QUALIFIED: 15,
      NEGOTIATION: 25,
      CLOSED_WON: 40,
      CLOSED_LOST: 0,
    };
    score += stageScores[deal.stage as string] || 5;

    // Priority boost (10 points max)
    const priorityBoosts: Record<string, number> = {
      URGENT: 10,
      HIGH: 7,
      MEDIUM: 4,
      LOW: 0,
    };
    score += priorityBoosts[deal.priority as string] || 0;

    return Math.min(Math.max(score, 0), 100);
  }

  async create(createDealDto: CreateDealDto, user: any) {
    // Calculate lead score automatically
    const leadScore = this.calculateLeadScore(createDealDto);

    // Build deal data object conditionally
    const dealData: Prisma.DealCreateInput = {
      title: createDealDto.title,
      value: createDealDto.value,
      stage: createDealDto.stage,
      priority: createDealDto.priority || 'MEDIUM',
      leadSource: createDealDto.leadSource,
      leadScore,
      notes: createDealDto.notes,
      expectedCloseDate: createDealDto.expectedCloseDate
        ? new Date(createDealDto.expectedCloseDate)
        : undefined,
      company: {
        connect: { id: user.companyId },
      },
    };

    // Add optional relations only if provided
    if (createDealDto.contactId) {
      dealData.contact = { connect: { id: createDealDto.contactId } };
    }
    if (createDealDto.assignedToId) {
      dealData.assignedTo = { connect: { id: createDealDto.assignedToId } };
    }

    return this.prisma.deal.create({
      data: dealData,
      include: this.getDealIncludes(),
    });
  }

  // ✅ Optimized with filtering & search
  async findAll(
    companyId: string,
    filters: FilterDealDto = {},
  ): Promise<PaginatedResponse<Deal>> {
    const { page = 1, limit = 50, stage, priority, assignedToId, search } = filters;
    const skip = (page - 1) * limit;

    // Build where clause with filters
    const where: Prisma.DealWhereInput = { companyId };

    if (stage) where.stage = stage;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        include: this.getDealIncludes(),
        orderBy: [
          { priority: 'desc' },
          { leadScore: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.deal.count({ where }),
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
    const deal = await this.prisma.deal.findFirst({
      where: {
        id,
        companyId, // Ensure deal belongs to user's company
      },
      include: this.getDealIncludes(),
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  // ✅ Optimized update - single query with updateMany
  async update(id: string, updateDealDto: UpdateDealDto, companyId: string) {
    try {
      // Prepare update data
      const dataToUpdate: Prisma.DealUpdateInput = {};

      if (updateDealDto.title !== undefined) dataToUpdate.title = updateDealDto.title;
      if (updateDealDto.value !== undefined) dataToUpdate.value = updateDealDto.value;
      if (updateDealDto.priority !== undefined) dataToUpdate.priority = updateDealDto.priority;
      if (updateDealDto.leadSource !== undefined) dataToUpdate.leadSource = updateDealDto.leadSource;
      if (updateDealDto.notes !== undefined) dataToUpdate.notes = updateDealDto.notes;
      if (updateDealDto.lastContactDate !== undefined) {
        dataToUpdate.lastContactDate = updateDealDto.lastContactDate
          ? new Date(updateDealDto.lastContactDate)
          : null;
      }

      // Handle date conversion
      if (updateDealDto.expectedCloseDate !== undefined) {
        dataToUpdate.expectedCloseDate = updateDealDto.expectedCloseDate
          ? new Date(updateDealDto.expectedCloseDate)
          : null;
      }

      // Auto-handle closed deals
      if (updateDealDto.stage) {
        dataToUpdate.stage = updateDealDto.stage;
        if (
          updateDealDto.stage === DealStage.CLOSED_WON ||
          updateDealDto.stage === DealStage.CLOSED_LOST
        ) {
          dataToUpdate.closedAt = new Date();
        } else {
          dataToUpdate.closedAt = null;
        }
      }

      // Update contact if changed
      if (updateDealDto.contactId) {
        dataToUpdate.contact = { connect: { id: updateDealDto.contactId } };
      }

      // Update assignedTo if changed
      if (updateDealDto.assignedToId !== undefined) {
        if (updateDealDto.assignedToId) {
          dataToUpdate.assignedTo = { connect: { id: updateDealDto.assignedToId } };
        } else {
          dataToUpdate.assignedTo = { disconnect: true };
        }
      }

      // Recalculate lead score if relevant fields changed
      if (
        updateDealDto.value !== undefined ||
        updateDealDto.stage !== undefined ||
        updateDealDto.priority !== undefined ||
        updateDealDto.leadSource !== undefined
      ) {
        // ✅ FIX BUG #2: Calculate from update data directly to avoid race condition
        // Fetch current deal only if we don't have all required fields
        const needsCurrentData = 
          updateDealDto.value === undefined ||
          updateDealDto.stage === undefined ||
          updateDealDto.priority === undefined ||
          updateDealDto.leadSource === undefined;

        let scoreData = updateDealDto;
        if (needsCurrentData) {
          const currentDeal = await this.prisma.deal.findUnique({
            where: { id },
            select: { value: true, stage: true, priority: true, leadSource: true },
          });
          if (currentDeal) {
            scoreData = { ...currentDeal, ...updateDealDto };
          }
        }
        
        dataToUpdate.leadScore = this.calculateLeadScore(scoreData);
      }

      // ✅ Single query with company check
      const updated = await this.prisma.deal.updateMany({
        where: { id, companyId },
        data: dataToUpdate,
      });

      if (updated.count === 0) {
        throw new NotFoundException(`Deal with ID ${id} not found`);
      }

      // Return updated deal
      return this.findOne(id, companyId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }
  }

  // ✅ Optimized delete - single query with deleteMany
  async remove(id: string, companyId: string) {
    try {
      const deleted = await this.prisma.deal.deleteMany({
        where: { id, companyId },
      });

      if (deleted.count === 0) {
        throw new NotFoundException(`Deal with ID ${id} not found`);
      }

      return { message: 'Deal deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }
  }

  // ✅ NEW: Pipeline statistics
  async getPipelineStats(companyId: string) {
    const stats = await this.prisma.deal.groupBy({
      by: ['stage'],
      where: { companyId },
      _count: { _all: true },
      _sum: { value: true },
      _avg: { leadScore: true },
    });

    return stats.map((stat) => ({
      stage: stat.stage,
      count: stat._count._all,
      totalValue: stat._sum.value ? Number(stat._sum.value) : 0,
      avgLeadScore: Math.round(stat._avg.leadScore || 0),
    }));
  }

  // ✅ NEW: My deals statistics
  async getMyDealsStats(userId: string, companyId: string) {
    const [total, won, lost, inProgress] = await Promise.all([
      this.prisma.deal.count({
        where: { assignedToId: userId, companyId },
      }),
      this.prisma.deal.count({
        where: { assignedToId: userId, companyId, stage: 'CLOSED_WON' },
      }),
      this.prisma.deal.count({
        where: { assignedToId: userId, companyId, stage: 'CLOSED_LOST' },
      }),
      this.prisma.deal.count({
        where: {
          assignedToId: userId,
          companyId,
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
      }),
    ]);

    return {
      total,
      won,
      lost,
      inProgress,
      winRate: total > 0 ? Number(((won / total) * 100).toFixed(1)) : 0,
    };
  }

  // ✅ NEW: Get deal details with full information
  async getDealDetails(id: string, companyId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, companyId },
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
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    // Get recent activities for this deal's contact
    const recentActivities = await this.prisma.activity.findMany({
      where: {
        companyId,
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        scheduledDate: true,
      },
      orderBy: {
        scheduledDate: 'desc',
      },
      take: 10,
    });

    return {
      ...deal,
      recentActivities,
    };
  }

  // ✅ NEW: Bulk delete deals with role-based restrictions
  async bulkDelete(dealIds: string[], companyId: string, userId: string, userRole: string) {
    // ✅ FIX SEC #2: Employees can only delete their assigned deals
    const where: Prisma.DealWhereInput = {
      id: { in: dealIds },
      companyId,
    };

    if (userRole === 'EMPLOYEE') {
      where.assignedToId = userId;
    }

    const deleted = await this.prisma.deal.deleteMany({
      where,
    });

    return {
      message: `Successfully deleted ${deleted.count} deal(s)`,
      count: deleted.count,
    };
  }

  // ✅ NEW: Bulk update deals with role-based restrictions
  async bulkUpdate(
    dealIds: string[],
    updateData: Partial<UpdateDealDto>,
    companyId: string,
    userId: string,
    userRole: string,
  ) {
    const dataToUpdate: any = {};

    if (updateData.stage) dataToUpdate.stage = updateData.stage;
    if (updateData.priority) dataToUpdate.priority = updateData.priority;
    
    // ✅ FIX: Use flat field instead of nested relation (updateMany doesn't support relations)
    if (updateData.assignedToId) {
      dataToUpdate.assignedToId = updateData.assignedToId;
    }

    // Handle closedAt for stage changes
    if (updateData.stage === 'CLOSED_WON' || updateData.stage === 'CLOSED_LOST') {
      dataToUpdate.closedAt = new Date();
    } else if (updateData.stage) {
      dataToUpdate.closedAt = null;
    }

    // ✅ FIX SEC #2: Employees can only update their assigned deals
    const where: Prisma.DealWhereInput = {
      id: { in: dealIds },
      companyId,
    };

    if (userRole === 'EMPLOYEE') {
      where.assignedToId = userId;
    }

    const updated = await this.prisma.deal.updateMany({
      where,
      data: dataToUpdate,
    });

    return {
      message: `Successfully updated ${updated.count} deal(s)`,
      count: updated.count,
    };
  }

  // ✅ NEW: Export deals to CSV
  async exportToCsv(companyId: string, filters: FilterDealDto = {}) {
    // Build where clause (same as findAll but without pagination)
    const where: Prisma.DealWhereInput = { companyId };

    if (filters.stage) where.stage = filters.stage;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const deals = await this.prisma.deal.findMany({
      where,
      include: this.getDealIncludes(),
      orderBy: { createdAt: 'desc' },
    });

    // CSV Header
    const headers = [
      'ID',
      'Title',
      'Value',
      'Stage',
      'Priority',
      'Lead Source',
      'Lead Score',
      'Company',
      'Contact',
      'Assigned To',
      'Expected Close Date',
      'Closed At',
      'Last Contact Date',
      'Notes',
      'Created At',
    ];

    // ✅ FIX: Helper function to properly escape CSV fields
    const escapeCsvField = (value: string | null | undefined): string => {
      if (!value) return '';
      // Escape quotes and wrap in quotes
      return `"${value.replace(/"/g, '""')}"`;
    };

    // CSV Rows
    const rows = deals.map((deal) => [
      deal.id,
      escapeCsvField(deal.title),
      deal.value ? deal.value.toString() : '',
      deal.stage,
      deal.priority || '',
      deal.leadSource || '',
      deal.leadScore || '',
      escapeCsvField(deal.company?.name),
      deal.contact ? escapeCsvField(`${deal.contact.firstName} ${deal.contact.lastName}`) : '',
      escapeCsvField(deal.assignedTo?.name),
      deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : '',
      deal.closedAt ? new Date(deal.closedAt).toISOString().split('T')[0] : '',
      deal.lastContactDate ? new Date(deal.lastContactDate).toISOString().split('T')[0] : '',
      escapeCsvField(deal.notes),
      new Date(deal.createdAt).toISOString().split('T')[0],
    ]);

    // Combine headers and rows
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return csv;
  }
}