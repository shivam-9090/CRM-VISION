import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SanitizerService } from '../common/sanitizer.service';
import { RedisService } from '../redis/redis.service';
import type Redis from 'ioredis';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { FilterDealDto } from './dto/filter-deal.dto';
import { DealStage, Deal, Prisma, LeadSource, Priority } from '@prisma/client';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class DealsService {
  private readonly redis: Redis;

  constructor(
    private prisma: PrismaService,
    private sanitizer: SanitizerService,
    private redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient();
  }

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

  // ✅ Invalidate Redis cache after mutations
  private async invalidateCache(
    companyId: string,
    userId?: string,
  ): Promise<void> {
    try {
      const keys = [`pipeline:stats:${companyId}`];
      if (userId) {
        keys.push(`user:stats:${userId}:${companyId}`);
      }
      await this.redis.del(...keys);
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
      // Continue without throwing - cache invalidation failure shouldn't break the app
    }
  }

  // ✅ Auto-calculate lead score based on deal attributes
  private calculateLeadScore(deal: Partial<Deal>): number {
    let score = 0;

    // Value-based scoring (30 points max)
    if (deal.value) {
      // Convert Prisma Decimal to number
      const value =
        typeof deal.value === 'number'
          ? deal.value
          : Number(deal.value.toString());
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
      PROPOSAL: 25,
      NEGOTIATION: 35,
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
    // ✅ Sanitize text inputs to prevent XSS
    const sanitizedTitle =
      this.sanitizer.sanitizeText(createDealDto.title) || '';
    const sanitizedNotes =
      this.sanitizer.sanitizeRichText(createDealDto.notes) || undefined;

    // Calculate lead score automatically
    const leadScore = this.calculateLeadScore(createDealDto as any);

    // Build deal data object conditionally
    const dealData: Prisma.DealCreateInput = {
      title: sanitizedTitle,
      value: createDealDto.value,
      stage: createDealDto.stage,
      priority: createDealDto.priority || 'MEDIUM',
      leadSource: createDealDto.leadSource,
      leadScore,
      notes: sanitizedNotes,
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

    const newDeal = await this.prisma.deal.create({
      data: dealData,
      include: this.getDealIncludes(),
    });

    // ✅ Invalidate Redis cache after creating deal
    await this.invalidateCache(user.companyId, createDealDto.assignedToId);

    return newDeal;
  }

  // ✅ Optimized with filtering & search
  async findAll(
    companyId: string,
    filters: FilterDealDto = {},
  ): Promise<PaginatedResponse<Deal>> {
    const {
      page = 1,
      limit = 50,
      stage,
      priority,
      assignedToId,
      search,
    } = filters;
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

      // ✅ Sanitize text inputs
      if (updateDealDto.title !== undefined) {
        const sanitizedTitle = this.sanitizer.sanitizeText(updateDealDto.title);
        dataToUpdate.title = sanitizedTitle ?? undefined;
      }
      if (updateDealDto.notes !== undefined) {
        const sanitizedNotes = this.sanitizer.sanitizeRichText(
          updateDealDto.notes,
        );
        dataToUpdate.notes = sanitizedNotes ?? undefined;
      }

      if (updateDealDto.value !== undefined)
        dataToUpdate.value = updateDealDto.value;
      if (updateDealDto.priority !== undefined)
        dataToUpdate.priority = updateDealDto.priority;
      if (updateDealDto.leadSource !== undefined)
        dataToUpdate.leadSource = updateDealDto.leadSource;
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
          dataToUpdate.assignedTo = {
            connect: { id: updateDealDto.assignedToId },
          };
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
        const currentDeal = await this.prisma.deal.findUnique({
          where: { id },
        });
        if (currentDeal) {
          const mergedDeal = { ...currentDeal, ...updateDealDto };
          dataToUpdate.leadScore = this.calculateLeadScore(mergedDeal as any);
        }
      }

      // ✅ Single query with company check
      const updated = await this.prisma.deal.updateMany({
        where: { id, companyId },
        data: dataToUpdate,
      });

      if (updated.count === 0) {
        throw new NotFoundException(`Deal with ID ${id} not found`);
      }

      // ✅ Invalidate Redis cache after update
      await this.invalidateCache(companyId, updateDealDto.assignedToId);

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
      // Get deal info before deletion for cache invalidation
      const deal = await this.prisma.deal.findFirst({
        where: { id, companyId },
        select: { assignedToId: true },
      });

      const deleted = await this.prisma.deal.deleteMany({
        where: { id, companyId },
      });

      if (deleted.count === 0) {
        throw new NotFoundException(`Deal with ID ${id} not found`);
      }

      // ✅ Invalidate Redis cache after delete
      await this.invalidateCache(companyId, deal?.assignedToId || undefined);

      return { message: 'Deal deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }
  }

  // ✅ NEW: Pipeline statistics with Redis caching
  async getPipelineStats(companyId: string) {
    const cacheKey = `pipeline:stats:${companyId}`;

    try {
      // Try to get from cache (silently fail if Redis unavailable)
      if (this.redis?.status === 'ready') {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      // Silently continue without cache on error
    }

    const stats = await this.prisma.deal.groupBy({
      by: ['stage'],
      where: { companyId },
      _count: { _all: true },
      _sum: { value: true },
      _avg: { leadScore: true },
    });

    const result = stats.map((stat) => ({
      stage: stat.stage,
      count: stat._count._all,
      totalValue: stat._sum.value ? Number(stat._sum.value) : 0,
      avgLeadScore: Math.round(stat._avg.leadScore || 0),
    }));

    try {
      // Cache for 2 minutes (silently fail if Redis unavailable)
      if (this.redis?.status === 'ready') {
        await this.redis.setex(cacheKey, 120, JSON.stringify(result));
      }
    } catch (error) {
      // Silently continue without caching on error
    }

    return result;
  }

  // ✅ NEW: My deals statistics with Redis caching
  async getMyDealsStats(userId: string, companyId: string) {
    const cacheKey = `user:stats:${userId}:${companyId}`;

    try {
      // Try to get from cache (silently fail if Redis unavailable)
      if (this.redis?.status === 'ready') {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch {
      // Silently continue without cache on error
    }

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

    const result = {
      total,
      won,
      lost,
      inProgress,
      winRate: total > 0 ? Number(((won / total) * 100).toFixed(1)) : 0,
    };

    try {
      // Cache for 5 minutes (silently fail if Redis unavailable)
      if (this.redis?.status === 'ready') {
        await this.redis.setex(cacheKey, 300, JSON.stringify(result));
      }
    } catch {
      // Silently continue without caching on error
    }

    return result;
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

  // ✅ NEW: Bulk delete deals
  async bulkDelete(dealIds: string[], companyId: string) {
    const deleted = await this.prisma.deal.deleteMany({
      where: {
        id: { in: dealIds },
        companyId,
      },
    });

    return {
      message: `Successfully deleted ${deleted.count} deal(s)`,
      count: deleted.count,
    };
  }

  // ✅ NEW: Bulk update deals
  async bulkUpdate(
    dealIds: string[],
    updateData: Partial<UpdateDealDto>,
    companyId: string,
  ) {
    const dataToUpdate: any = {};

    if (updateData.stage) dataToUpdate.stage = updateData.stage;
    if (updateData.priority) dataToUpdate.priority = updateData.priority;
    if (updateData.assignedToId) {
      dataToUpdate.assignedTo = { connect: { id: updateData.assignedToId } };
    }

    // Handle closedAt for stage changes
    if (
      updateData.stage === 'CLOSED_WON' ||
      updateData.stage === 'CLOSED_LOST'
    ) {
      dataToUpdate.closedAt = new Date();
    } else if (updateData.stage) {
      dataToUpdate.closedAt = null;
    }

    const updated = await this.prisma.deal.updateMany({
      where: {
        id: { in: dealIds },
        companyId,
      },
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

    // CSV Rows
    const rows = deals.map((deal) => [
      deal.id,
      `"${deal.title}"`,
      deal.value ? deal.value.toString() : '',
      deal.stage,
      deal.priority || '',
      deal.leadSource || '',
      deal.leadScore || '',
      deal.company?.name || '',
      deal.contact
        ? `"${deal.contact.firstName} ${deal.contact.lastName}"`
        : '',
      deal.assignedTo?.name || '',
      deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
        : '',
      deal.closedAt ? new Date(deal.closedAt).toISOString().split('T')[0] : '',
      deal.lastContactDate
        ? new Date(deal.lastContactDate).toISOString().split('T')[0]
        : '',
      deal.notes ? `"${deal.notes.replace(/"/g, '""')}"` : '',
      new Date(deal.createdAt).toISOString().split('T')[0],
    ]);

    // Combine headers and rows
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
      '\n',
    );

    return csv;
  }
}
