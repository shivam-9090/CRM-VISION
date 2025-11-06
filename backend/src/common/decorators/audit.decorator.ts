import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

/**
 * Decorator to enable automatic audit logging for a method
 * 
 * @param entityType - The type of entity being operated on (e.g., 'User', 'Company', 'Deal')
 * @param options - Additional audit options
 * 
 * @example
 * ```typescript
 * @AuditLog('User')
 * async updateUser(id: string, dto: UpdateUserDto) {
 *   // ... update logic
 * }
 * ```
 */
export interface AuditLogOptions {
  /**
   * Entity type being audited (e.g., 'User', 'Deal', 'Contact')
   */
  entityType: string;

  /**
   * Custom action name (if different from method name)
   */
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT';

  /**
   * Whether to capture the full entity state before the operation
   * Default: true for UPDATE/DELETE, false for CREATE
   */
  captureOldState?: boolean;

  /**
   * Whether to capture the full entity state after the operation
   * Default: true for CREATE/UPDATE, false for DELETE
   */
  captureNewState?: boolean;

  /**
   * Fields to exclude from audit logging (e.g., password fields)
   */
  excludeFields?: string[];

  /**
   * Whether this is a sensitive operation that should always be logged
   */
  sensitive?: boolean;
}

export const AuditLog = (
  entityTypeOrOptions: string | AuditLogOptions,
) => {
  const options: AuditLogOptions =
    typeof entityTypeOrOptions === 'string'
      ? { entityType: entityTypeOrOptions }
      : entityTypeOrOptions;

  return SetMetadata(AUDIT_LOG_KEY, options);
};
