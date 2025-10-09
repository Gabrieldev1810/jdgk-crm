/**
 * User object attached to request after authentication
 */
export interface RequestUser {
  id: string;
  email: string;
  permissions: string[];
}

/**
 * Extend Express Request to include authenticated user with permissions
 */
declare global {
  namespace Express {
    interface Request {
      authUser?: RequestUser; // Use authUser to avoid conflicts with existing user property
    }
  }
}