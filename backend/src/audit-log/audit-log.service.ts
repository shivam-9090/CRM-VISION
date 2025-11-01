import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

interface AuditLogOptions {
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: any;
  userId: string;
  companyId: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async create(options: AuditLogOptions) {
    return this.prisma.auditLog.create({
      data: {
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        changes: options.changes || null,
        userId: options.userId,
        companyId: options.companyId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Log a CREATE action
   */
  async logCreate(
    entityType: string,
    entityId: string,
    entity: any,
    userId: string,
    companyId: string,
  ) {
    return this.create({
      action: 'CREATE',
      entityType,
      entityId,
      changes: {
        new: entity,
      },
      userId,
      companyId,
    });
  }

  /**
   * Log an UPDATE action
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    oldData: any,
    newData: any,
    userId: string,
    companyId: string,
  ) {
    // Calculate the changes
    const changes = this.calculateChanges(oldData, newData);

    if (Object.keys(changes).length === 0) {
      return null; // No changes to log
    }

    return this.create({
      action: 'UPDATE',
      entityType,
      entityId,
      changes: {
        old: changes.old,
        new: changes.new,
      },
      userId,
      companyId,
    });
  }

  /**
   * Log a DELETE action
   */
  async logDelete(
    entityType: string,
    entityId: string,
    entity: any,
    userId: string,
    companyId: string,
  ) {
    return this.create({
      action: 'DELETE',
      entityType,
      entityId,
      changes: {
        old: entity,
      },
      userId,
      companyId,
    });
  }

  /**
   * Find all audit logs with filtering
   */
  async findAll(
    companyId: string,
    filters?: {
      entityType?: string;
      entityId?: string;
      userId?: string;
      action?: AuditAction;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: any = { companyId };

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters?.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to 100 most recent logs
    });
  }

  /**
   * Find audit logs for a specific entity
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    companyId: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
        companyId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Calculate changes between old and new data
   */
  private calculateChanges(oldData: any, newData: any) {
    const changes: { old: any; new: any } = { old: {}, new: {} };

    // Get all keys from both objects
    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {}),
    ]);

    // Exclude metadata fields
    const excludeFields = [
      'id',
      'createdAt',
      'updatedAt',
      'companyId',
      'userId',
    ];

    for (const key of allKeys) {
      if (excludeFields.includes(key)) continue;

      const oldValue = oldData?.[key];
      const newValue = newData?.[key];

      // Skip if values are the same
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;

      changes.old[key] = oldValue;
      changes.new[key] = newValue;
    }

    return changes;
  }
}
