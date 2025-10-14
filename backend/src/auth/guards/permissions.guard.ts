import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

// Define role permissions mapping
const ROLE_PERMISSIONS = {
  [Role.ADMIN]: [
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'user:invite',
    'company:create',
    'company:read',
    'company:update',
    'company:delete',
    'contact:create',
    'contact:read',
    'contact:update',
    'contact:delete',
    'deal:create',
    'deal:read',
    'deal:update',
    'deal:delete',
  ],
  [Role.EMPLOYEE]: [
    'user:read',
    'company:read',
    'contact:create',
    'contact:read',
    'contact:update',
    'deal:create',
    'deal:read',
    'deal:update',
  ],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      return false;
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}