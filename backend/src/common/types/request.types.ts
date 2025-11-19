import { Request } from 'express';

/**
 * User information attached to authenticated requests
 * Populated by JWT strategy after successful authentication
 */
export class AuthenticatedUser {
  /** User's unique identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's role (ADMIN, USER, MANAGER) */
  role: string;
  /** Company ID the user belongs to */
  companyId: string;
  /** User's full name */
  name: string;
}

/**
 * Extended Request type with authenticated user information
 * Use this in controller methods to get proper typing for req.user
 */
export type RequestWithUser = Request & {
  user: AuthenticatedUser;
};
