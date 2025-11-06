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

  // Email Permissions
  EMAIL_SEND: 'email:send',
  EMAIL_SEND_BULK: 'email:send:bulk',
  EMAIL_VIEW: 'email:view',
  EMAIL_MANAGE: 'email:manage',
  EMAIL_ALL: 'email:*',

  // Attachment Permissions
  ATTACHMENT_CREATE: 'attachment:create',
  ATTACHMENT_READ: 'attachment:read',
  ATTACHMENT_UPDATE: 'attachment:update',
  ATTACHMENT_DELETE: 'attachment:delete',
  ATTACHMENT_ALL: 'attachment:*',

  // Notification Permissions
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_CREATE: 'notification:create',
  NOTIFICATION_UPDATE: 'notification:update',
  NOTIFICATION_DELETE: 'notification:delete',
  NOTIFICATION_ALL: 'notification:*',

  // Search Permissions
  SEARCH_ALL: 'search:all',
  SEARCH_CONTACTS: 'search:contacts',
  SEARCH_DEALS: 'search:deals',
  SEARCH_COMPANIES: 'search:companies',
  SEARCH_ACTIVITIES: 'search:activities',

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
    PERMISSIONS.COMPANY_UPDATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_INVITE,
    PERMISSIONS.COMMENT_ALL,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.DATA_EXPORT,
    PERMISSIONS.DATA_IMPORT,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.EMAIL_SEND,
    PERMISSIONS.EMAIL_SEND_BULK,
    PERMISSIONS.EMAIL_VIEW,
    PERMISSIONS.ATTACHMENT_ALL,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_UPDATE,
    PERMISSIONS.SEARCH_ALL,
  ],

  SALES: [
    PERMISSIONS.DEAL_CREATE,
    PERMISSIONS.DEAL_READ,
    PERMISSIONS.DEAL_UPDATE,
    PERMISSIONS.DEAL_EXPORT,
    PERMISSIONS.CONTACT_CREATE,
    PERMISSIONS.CONTACT_READ,
    PERMISSIONS.CONTACT_UPDATE,
    PERMISSIONS.CONTACT_EXPORT,
    PERMISSIONS.ACTIVITY_ALL,
    PERMISSIONS.COMPANY_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.COMMENT_ALL,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.DATA_EXPORT,
    PERMISSIONS.DATA_IMPORT,
    PERMISSIONS.EMAIL_SEND,
    PERMISSIONS.EMAIL_VIEW,
    PERMISSIONS.ATTACHMENT_CREATE,
    PERMISSIONS.ATTACHMENT_READ,
    PERMISSIONS.ATTACHMENT_DELETE,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_UPDATE,
    PERMISSIONS.SEARCH_ALL,
  ],

  EMPLOYEE: [
    PERMISSIONS.DEAL_READ,
    PERMISSIONS.DEAL_CREATE,
    PERMISSIONS.CONTACT_READ,
    PERMISSIONS.ACTIVITY_CREATE,
    PERMISSIONS.ACTIVITY_READ,
    PERMISSIONS.ACTIVITY_UPDATE,
    PERMISSIONS.COMPANY_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.DATA_IMPORT,
    PERMISSIONS.EMAIL_SEND,
    PERMISSIONS.ATTACHMENT_CREATE,
    PERMISSIONS.ATTACHMENT_READ,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_UPDATE,
    PERMISSIONS.SEARCH_CONTACTS,
    PERMISSIONS.SEARCH_DEALS,
    PERMISSIONS.SEARCH_COMPANIES,
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
