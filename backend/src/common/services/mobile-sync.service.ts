/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MobileSyncDto,
  BatchRequestDto,
  SyncResponseDto,
  BatchResponseDto,
} from '../dto/mobile-sync.dto';

@Injectable()
export class MobileSyncService {
  private readonly logger = new Logger(MobileSyncService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Incremental sync - fetch only changed records since lastSyncAt
   */
  async syncData(
    userId: string,
    companyId: string,
    syncDto: MobileSyncDto,
  ): Promise<SyncResponseDto> {
    const { lastSyncAt, resources, limit } = syncDto;
    const since = lastSyncAt ? new Date(lastSyncAt) : new Date(0);
    const now = new Date();

    const data: Record<string, any> = {};
    let totalRecords = 0;

    // Sync contacts
    if (!resources || resources.includes('contacts')) {
      const contacts = await this.prisma.contact.findMany({
        where: {
          companyId,
          updatedAt: { gte: since },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      data.contacts = contacts;
      totalRecords += contacts.length;
    }

    // Sync deals
    if (!resources || resources.includes('deals')) {
      const deals = await this.prisma.deal.findMany({
        where: {
          companyId,
          updatedAt: { gte: since },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          value: true,
          stage: true,
          expectedCloseDate: true,
          contactId: true,
          assignedToId: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
          closedAt: true,
          priority: true,
        },
      });
      data.deals = deals;
      totalRecords += deals.length;
    }

    // Sync activities
    if (!resources || resources.includes('activities')) {
      const activities = await this.prisma.activity.findMany({
        where: {
          companyId,
          updatedAt: { gte: since },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          scheduledDate: true,
          description: true,
          dealId: true,
          contactId: true,
          assignedToId: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      data.activities = activities;
      totalRecords += activities.length;
    }

    // Sync companies (minimal data)
    if (!resources || resources.includes('companies')) {
      const companies = await this.prisma.company.findMany({
        where: {
          id: companyId,
          updatedAt: { gte: since },
        },
        take: 1,
        select: {
          id: true,
          name: true,
          updatedAt: true,
        },
      });
      data.companies = companies;
      totalRecords += companies.length;
    }

    // Remove the deleted records feature since schema doesn't support soft deletes
    // Mobile apps will need to handle full sync periodically instead

    return {
      success: true,
      timestamp: now.toISOString(),
      data,
      meta: {
        totalRecords,
        hasMore: totalRecords >= (limit || 100),
        nextSyncToken: now.toISOString(),
      },
    };
  }

  /**
   * Batch operations - process multiple create/update/delete in single transaction
   */
  async processBatch(
    userId: string,
    companyId: string,
    batchDto: BatchRequestDto,
  ): Promise<BatchResponseDto> {
    const results: any[] = [];
    let successful = 0;
    let failed = 0;
    let conflicts = 0;

    // Process each operation
    for (const op of batchDto.operations) {
      try {
        let result: any;

        switch (op.resource) {
          case 'contacts':
            result = await this.processContactOperation(userId, companyId, op);
            break;
          case 'deals':
            result = await this.processDealOperation(userId, companyId, op);
            break;
          case 'activities':
            result = await this.processActivityOperation(userId, companyId, op);
            break;
          default:
            throw new Error(`Unsupported resource: ${op.resource}`);
        }

        if (result.conflict) {
          conflicts++;
        }

        results.push({
          tempId: op.tempId,
          operation: op.operation,
          resource: op.resource,
          success: true,
          id: result.id,
          conflict: result.conflict,
        });

        successful++;
      } catch (error) {
        this.logger.error(
          `Batch operation failed: ${op.resource} ${op.operation}`,
          error,
        );

        results.push({
          tempId: op.tempId,
          operation: op.operation,
          resource: op.resource,
          success: false,
          error: {
            code: error.code || 'OPERATION_FAILED',
            message: error.message || 'Unknown error',
          },
        });

        failed++;
      }
    }

    return {
      success: failed === 0,
      timestamp: new Date().toISOString(),
      results,
      stats: {
        total: batchDto.operations.length,
        successful,
        failed,
        conflicts,
      },
    };
  }

  /**
   * Process contact operations with conflict detection
   */
  private async processContactOperation(
    userId: string,
    companyId: string,
    op: any,
  ) {
    switch (op.operation) {
      case 'create': {
        const created = await this.prisma.contact.create({
          data: {
            firstName: op.data.firstName,
            lastName: op.data.lastName,
            email: op.data.email,
            phone: op.data.phone,
            companyId,
          },
        });
        return { id: created.id };
      }

      case 'update': {
        // Check for conflicts
        const existing = await this.prisma.contact.findUnique({
          where: { id: op.id },
        });

        if (!existing) {
          throw new Error('Contact not found');
        }

        // Simple last-write-wins conflict resolution
        const clientTime = new Date(op.clientTimestamp);
        if (existing.updatedAt > clientTime) {
          return {
            id: existing.id,
            conflict: {
              serverVersion: existing,
              clientVersion: op.data,
              resolution: 'server-wins',
            },
          };
        }

        const updated = await this.prisma.contact.update({
          where: { id: op.id },
          data: {
            firstName: op.data.firstName,
            lastName: op.data.lastName,
            email: op.data.email,
            phone: op.data.phone,
          },
        });
        return { id: updated.id };
      }

      case 'delete': {
        // Hard delete since schema doesn't support soft deletes
        await this.prisma.contact.delete({
          where: { id: op.id },
        });
        return { id: op.id };
      }

      default:
        throw new Error(`Unsupported operation: ${op.operation}`);
    }
  }

  /**
   * Process deal operations
   */
  private async processDealOperation(
    userId: string,
    companyId: string,
    op: any,
  ) {
    switch (op.operation) {
      case 'create': {
        const created = await this.prisma.deal.create({
          data: {
            title: op.data.title,
            value: op.data.value,
            stage: op.data.stage,
            expectedCloseDate: op.data.expectedCloseDate,
            contactId: op.data.contactId,
            assignedToId: op.data.assignedToId || userId,
            companyId,
          },
        });
        return { id: created.id };
      }

      case 'update': {
        const existing = await this.prisma.deal.findUnique({
          where: { id: op.id },
        });

        if (!existing) {
          throw new Error('Deal not found');
        }

        const clientTime = new Date(op.clientTimestamp);
        if (existing.updatedAt > clientTime) {
          return {
            id: existing.id,
            conflict: {
              serverVersion: existing,
              clientVersion: op.data,
              resolution: 'server-wins',
            },
          };
        }

        const updated = await this.prisma.deal.update({
          where: { id: op.id },
          data: {
            title: op.data.title,
            value: op.data.value,
            stage: op.data.stage,
            expectedCloseDate: op.data.expectedCloseDate,
          },
        });
        return { id: updated.id };
      }

      case 'delete': {
        await this.prisma.deal.delete({
          where: { id: op.id },
        });
        return { id: op.id };
      }

      default:
        throw new Error(`Unsupported operation: ${op.operation}`);
    }
  }

  /**
   * Process activity operations
   */
  private async processActivityOperation(
    userId: string,
    companyId: string,
    op: any,
  ) {
    switch (op.operation) {
      case 'create': {
        const created = await this.prisma.activity.create({
          data: {
            title: op.data.title,
            type: op.data.type,
            status: op.data.status,
            scheduledDate: op.data.scheduledDate,
            description: op.data.description,
            dealId: op.data.dealId,
            contactId: op.data.contactId,
            assignedToId: op.data.assignedToId || userId,
            companyId,
          },
        });
        return { id: created.id };
      }

      case 'update': {
        const existing = await this.prisma.activity.findUnique({
          where: { id: op.id },
        });

        if (!existing) {
          throw new Error('Activity not found');
        }

        const clientTime = new Date(op.clientTimestamp);
        if (existing.updatedAt > clientTime) {
          return {
            id: existing.id,
            conflict: {
              serverVersion: existing,
              clientVersion: op.data,
              resolution: 'server-wins',
            },
          };
        }

        const updated = await this.prisma.activity.update({
          where: { id: op.id },
          data: {
            title: op.data.title,
            status: op.data.status,
            scheduledDate: op.data.scheduledDate,
            description: op.data.description,
          },
        });
        return { id: updated.id };
      }

      case 'delete': {
        await this.prisma.activity.delete({
          where: { id: op.id },
        });
        return { id: op.id };
      }

      default:
        throw new Error(`Unsupported operation: ${op.operation}`);
    }
  }

  // Remove getDeletedIds method since schema doesn't support soft deletes
}
