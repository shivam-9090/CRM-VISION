/**
 * Granular Permissions System
 *
 * Permission format: {resource}:{action}
 * Resources: deal, contact, activity, company, user, comment, analytics
 * Actions: create, read, update, delete, export, import, invite
 *
 * Special permissions:
 * - *:* = Full admin access (all permissions)
 * - {resource}:* = All actions on a resource
 */

export const PERMISSIONS = {
  // Deal Permissions
  DEAL_CREATE: 'deal:create',
  DEAL_READ: 'deal:read',
  DEAL_UPDATE: 'deal:update',
  DEAL_DELETE: 'deal:delete',
  DEAL_EXPORT: 'deal:export',
  DEAL_ALL: 'deal:*',

  // Contact Permissions
  CONTACT_CREATE: 'contact:create',
  CONTACT_READ: 'contact:read',
  CONTACT_UPDATE: 'contact:update',
  CONTACT_DELETE: 'contact:delete',
  CONTACT_EXPORT: 'contact:export',
  CONTACT_ALL: 'contact:*',

  // Activity Permissions
  ACTIVITY_CREATE: 'activity:create',
  ACTIVITY_READ: 'activity:read',
  ACTIVITY_UPDATE: 'activity:update',
  ACTIVITY_DELETE: 'activity:delete',
  ACTIVITY_EXPORT: 'activity:export',
  ACTIVITY_ALL: 'activity:*',

  // Company Permissions
  COMPANY_CREATE: 'company:create',
  COMPANY_READ: 'company:read',
  COMPANY_UPDATE: 'company:update',
  COMPANY_DELETE: 'company:delete',
  COMPANY_ALL: 'company:*',

  // User Permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_INVITE: 'user:invite',
  USER_ALL: 'user:*',

  // Comment Permissions
  COMMENT_CREATE: 'comment:create',
  COMMENT_READ: 'comment:read',
  COMMENT_UPDATE: 'comment:update',
  COMMENT_DELETE: 'comment:delete',
  COMMENT_ALL: 'comment:*',

  // Analytics Permissions
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',
  ANALYTICS_ALL: 'analytics:*',

  // Import/Export Permissions
  DATA_EXPORT: 'data:export',
  DATA_IMPORT: 'data:import',
  DATA_ALL: 'data:*',

  // Audit Log Permissions
  AUDIT_READ: 'audit:read',
  AUDIT_ALL: 'audit:*',

  // Full Admin Permission
  ADMIN_ALL: '*:*',
} as const;

/**
 * Default permission sets for roles
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  ADMIN: [PERMISSIONS.ADMIN_ALL], // Admin has all permissions

  MANAGER: [
    PERMISSIONS.DEAL_ALL,
    PERMISSIONS.CONTACT_ALL,
    PERMISSIONS.ACTIVITY_ALL,
    PERMISSIONS.COMPANY_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.COMMENT_ALL,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.DATA_EXPORT,
    PERMISSIONS.DATA_IMPORT, // Allow managers to import data
    PERMISSIONS.AUDIT_READ,
  ],

  SALES: [
    PERMISSIONS.DEAL_CREATE,
    PERMISSIONS.DEAL_READ,
    PERMISSIONS.DEAL_UPDATE,
    PERMISSIONS.DEAL_EXPORT, // Allow sales team to export their deals
    PERMISSIONS.CONTACT_CREATE,
    PERMISSIONS.CONTACT_READ,
    PERMISSIONS.CONTACT_UPDATE,
    PERMISSIONS.CONTACT_EXPORT, // Allow sales team to export their contacts
    PERMISSIONS.ACTIVITY_ALL,
    PERMISSIONS.COMPANY_READ,
    PERMISSIONS.USER_READ, // Allow users to read their own profile
    PERMISSIONS.COMMENT_ALL,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.DATA_EXPORT, // Allow exporting data (for CSV exports)
    PERMISSIONS.DATA_IMPORT, // Allow sales team to import deals/contacts
  ],

  EMPLOYEE: [
    PERMISSIONS.DEAL_READ,
    PERMISSIONS.DEAL_CREATE, // Allow employees to create deals
    PERMISSIONS.CONTACT_READ,
    PERMISSIONS.ACTIVITY_CREATE,
    PERMISSIONS.ACTIVITY_READ,
    PERMISSIONS.ACTIVITY_UPDATE,
    PERMISSIONS.COMPANY_READ,
    PERMISSIONS.USER_READ, // Allow users to read their own profile
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.DATA_IMPORT, // Allow employees to import data
  ],
};

/**
 * Check if a permission matches a required permission
 * Supports wildcard permissions like "deal:*" or "*:*"
 */
export function permissionMatches(
  userPermission: string,
  requiredPermission: string,
): boolean {
  // Exact match
  if (userPermission === requiredPermission) {
    return true;
  }

  // Full admin access
  if (userPermission === PERMISSIONS.ADMIN_ALL) {
    return true;
  }

  // Resource wildcard (e.g., "deal:*" matches "deal:create")
  const [userResource, userAction] = userPermission.split(':');
  const [reqResource, reqAction] = requiredPermission.split(':');

  if (userResource === reqResource && userAction === '*') {
    return true;
  }

  // All resources wildcard (e.g., "*:read" matches "deal:read")
  if (userResource === '*' && userAction === reqAction) {
    return true;
  }

  return false;
}

/**
 * Check if user has required permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string | string[],
): boolean {
  const required = Array.isArray(requiredPermission)
    ? requiredPermission
    : [requiredPermission];

  // User must have at least one of the required permissions
  return required.some((reqPerm) =>
    userPermissions.some((userPerm) => permissionMatches(userPerm, reqPerm)),
  );
}
