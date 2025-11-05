import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import type { RequestWithUser } from '../common/types/request.types';
import { AuditAction } from '@prisma/client';

@Controller('audit-logs')
@UseGuards(AuthGuard, PermissionsGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Permissions(PERMISSIONS.AUDIT_READ)
  findAll(
    @Request() req: RequestWithUser,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};

    if (entityType) filters.entityType = entityType;
    if (entityId) filters.entityId = entityId;
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.auditLogService.findAll(req.user.companyId, filters);
  }

  @Get('entity')
  @Permissions(PERMISSIONS.AUDIT_READ)
  findByEntity(
    @Request() req: RequestWithUser,
    @Query('type') entityType: string,
    @Query('id') entityId: string,
  ) {
    if (!entityType || !entityId) {
      throw new Error('entityType and entityId are required');
    }

    return this.auditLogService.findByEntity(
      entityType,
      entityId,
      req.user.companyId,
    );
  }
}