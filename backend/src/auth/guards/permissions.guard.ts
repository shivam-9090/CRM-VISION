import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import {
  DEFAULT_ROLE_PERMISSIONS,
  hasPermission,
} from '../constants/permissions.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
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
      return false;
    }

    // Get user's permissions from database (stored in JSON field)
    let userPermissions: string[] = [];

    // If user has custom permissions in database, use those
    if (user.permissions && Array.isArray(user.permissions)) {
      userPermissions = user.permissions;
    } else {
      // Otherwise, use default role-based permissions
      userPermissions = DEFAULT_ROLE_PERMISSIONS[user.role as Role] || [];
    }

    // Check if user has at least one of the required permissions
    return hasPermission(userPermissions, requiredPermissions);
  }
}