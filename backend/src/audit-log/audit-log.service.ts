import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

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
  private readonly logger = new Logger(AuditLogService.name);
  private readonly DEFAULT_RETENTION_DAYS = 365; // 1 year
  private readonly SENSITIVE_RETENTION_DAYS = 2555; // 7 years (compliance)

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
  async findAll(companyId: string, filters?: any): Promise<any[]> {
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
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Automatic retention policy - runs daily at 2 AM
   * Deletes audit logs older than retention period based on action type
   * Note: Requires @nestjs/schedule to be installed and ScheduleModule imported in AppModule
   */
  // @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldLogs(): Promise<{ deleted: number; message: string }> {
    try {
      const sensitiveActions: AuditAction[] = ['DELETE', 'EXPORT'];
      const now = new Date();
      
      // Delete sensitive logs older than 7 years
      const sensitiveCutoff = new Date(now.getTime() - this.SENSITIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const sensitiveDeleted = await this.prisma.auditLog.deleteMany({
        where: {
          action: { in: sensitiveActions },
          createdAt: { lt: sensitiveCutoff },
        },
      });

      // Delete regular logs older than 1 year
      const regularCutoff = new Date(now.getTime() - this.DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const regularDeleted = await this.prisma.auditLog.deleteMany({
        where: {
          action: { notIn: sensitiveActions },
          createdAt: { lt: regularCutoff },
        },
      });

      const totalDeleted = sensitiveDeleted.count + regularDeleted.count;
      
      this.logger.log(`Cleanup completed: ${totalDeleted} audit logs deleted (${sensitiveDeleted.count} sensitive, ${regularDeleted.count} regular)`);
      
      return {
        deleted: totalDeleted,
        message: `Successfully cleaned up ${totalDeleted} old audit logs`,
      };
    } catch (error) {
      this.logger.error('Failed to cleanup old audit logs', error);
      throw error;
    }
  }

  /**
   * Get audit statistics by action type
   */
  async getStatsByAction(companyId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const where: any = { companyId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const stats = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return stats.map(stat => ({
      action: stat.action,
      count: stat._count.id,
    }));
  }

  /**
   * Get audit statistics by entity type
   */
  async getStatsByEntity(companyId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const where: any = { companyId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const stats = await this.prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return stats.map(stat => ({
      entityType: stat.entityType,
      count: stat._count.id,
    }));
  }

  /**
   * Get audit statistics by user
   */
  async getStatsByUser(companyId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const where: any = { companyId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const stats = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Fetch user details
    const userIds = stats.map(stat => stat.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return stats.map(stat => ({
      userId: stat.userId,
      user: userMap.get(stat.userId),
      count: stat._count.id,
    }));
  }

  /**
   * Get complete audit trail for a specific entity
   */
  async getAuditTrail(entityType: string, entityId: string): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Export audit logs to JSON for archival/compliance
   */
  async exportLogs(companyId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Log the export action itself
    await this.create({
      action: 'EXPORT' as AuditAction,
      entityType: 'AuditLog',
      entityId: `${companyId}_${startDate.toISOString()}_${endDate.toISOString()}`,
      userId: 'system',
      companyId,
      changes: {
        exportedCount: logs.length,
        dateRange: { start: startDate, end: endDate },
      },
    });

    return logs;
  }

  /**
   * Find audit logs for a specific entity
   */
  async findByEntity(entityType: string, entityId: string, companyId: string) {
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
