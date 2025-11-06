import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import {
  DEFAULT_ROLE_PERMISSIONS,
  hasPermission,
} from '../constants/permissions.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      this.logger.warn('PermissionsGuard: request missing user or role, denying access');
      return false;
    }

    // Get user's permissions from database (stored in JSON field)
    // Merge role defaults with any explicit user permissions so that:
    // - Users with no custom permissions inherit role defaults
    // - Users with custom permissions get the union of custom + role defaults
    const rolePerms: string[] = DEFAULT_ROLE_PERMISSIONS[user.role as Role] || [];
    let userPermissions: string[] = [];

    if (Array.isArray(user.permissions) && user.permissions.length > 0) {
      // Merge and dedupe explicit user permissions with role defaults
      userPermissions = Array.from(new Set([...user.permissions, ...rolePerms]));
    } else {
      // No explicit permissions stored for this user -> use role defaults
      userPermissions = rolePerms;
    }

    const allowed = hasPermission(userPermissions, requiredPermissions);
    if (!allowed) {
      // Log more context for debugging: user id, role and their permissions
      this.logger.warn(
        `Access denied - userId=${user.id || 'unknown'} role=${user.role} userPermissions=${JSON.stringify(
          userPermissions,
        )} required=${JSON.stringify(requiredPermissions)}`,
      );
    }

    return allowed;
  }
}
