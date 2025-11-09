import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_LOG_KEY, AuditLogOptions } from '../decorators/audit.decorator';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { AuditAction } from '@prisma/client';

/**
 * Interceptor that automatically logs operations based on @AuditLog decorator
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // No user context, skip audit logging
      return next.handle();
    }

    const method = context.getHandler().name;
    const action = this.determineAction(auditOptions.action || method);

    // Capture entity ID from request parameters
    const entityId =
      request.params.id ||
      request.params.entityId ||
      request.body?.id ||
      'unknown';

    return next.handle().pipe(
      tap({
        next: async (result) => {
          try {
            await this.logOperation(
              action,
              auditOptions,
              entityId,
              result,
              user,
              request,
            );
          } catch (error) {
            // Don't fail the request if audit logging fails
            console.error('Audit logging error:', error);
          }
        },
        error: (error) => {
          // Log failed operations as well
          this.logFailedOperation(
            action,
            auditOptions,
            entityId,
            error,
            user,
          ).catch((err) => console.error('Audit logging error:', err));
        },
      }),
    );
  }

  private async logOperation(
    action: AuditAction,
    options: AuditLogOptions,
    entityId: string,
    result: any,
    user: any,
    request: any,
  ): Promise<void> {
    const changes = this.buildChanges(action, options, result, request);

    await this.auditLogService.create({
      action,
      entityType: options.entityType,
      entityId: this.extractEntityId(entityId, result),
      changes: this.sanitizeChanges(changes, options.excludeFields),
      userId: user.id,
      companyId: user.companyId,
    });
  }

  private async logFailedOperation(
    action: AuditAction,
    options: AuditLogOptions,
    entityId: string,
    error: any,
    user: any,
  ): Promise<void> {
    await this.auditLogService.create({
      action,
      entityType: options.entityType,
      entityId,
      changes: {
        error: {
          message: error.message,
          status: error.status || 500,
        },
        failed: true,
      },
      userId: user.id,
      companyId: user.companyId,
    });
  }

  private determineAction(methodOrAction: string): AuditAction {
    const methodMap: Record<string, AuditAction> = {
      create: 'CREATE',
      update: 'UPDATE',
      remove: 'DELETE',
      delete: 'DELETE',
      findOne: 'VIEW',
      findAll: 'VIEW',
    };

    const normalized = methodOrAction.toLowerCase();

    if (normalized in methodMap) {
      return methodMap[normalized];
    }

    // Default to uppercase if it matches AuditAction
    const upperAction = methodOrAction.toUpperCase();
    if (
      ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'].includes(upperAction)
    ) {
      return upperAction as AuditAction;
    }

    return 'VIEW';
  }

  private buildChanges(
    action: AuditAction,
    options: AuditLogOptions,
    result: any,
    request: any,
  ): any {
    const changes: any = {};

    switch (action) {
      case 'CREATE':
        if (options.captureNewState !== false) {
          changes.new = result;
        }
        break;

      case 'UPDATE':
        if (options.captureOldState !== false) {
          changes.old = request.body._oldState || {};
        }
        if (options.captureNewState !== false) {
          changes.new = result;
        }
        break;

      case 'DELETE':
        if (options.captureOldState !== false) {
          changes.old = result;
        }
        break;

      case 'VIEW':
        // For VIEW actions, just log metadata
        changes.metadata = {
          method: request.method,
          query: request.query,
        };
        break;

      case 'EXPORT':
        changes.metadata = {
          format: request.query.format || 'csv',
          filters: request.query,
          recordCount: Array.isArray(result) ? result.length : 1,
        };
        break;
    }

    return changes;
  }

  private extractEntityId(paramId: string, result: any): string {
    if (paramId && paramId !== 'unknown') {
      return paramId;
    }

    if (result?.id) {
      return result.id;
    }

    if (Array.isArray(result) && result.length > 0 && result[0]?.id) {
      return result[0].id;
    }

    return 'unknown';
  }

  private sanitizeChanges(changes: any, excludeFields?: string[]): any {
    if (!changes || !excludeFields || excludeFields.length === 0) {
      return changes;
    }

    const sanitized = JSON.parse(JSON.stringify(changes));

    const removeFields = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }

      for (const field of excludeFields) {
        if (obj[field]) {
          obj[field] = '[REDACTED]';
        }
      }

      // Recursively sanitize nested objects
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
          removeFields(obj[key]);
        }
      }
    };

    removeFields(sanitized);
    return sanitized;
  }
}
