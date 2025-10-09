import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for an endpoint
 * 
 * @param permissions - Array of permission codes required to access the endpoint
 * 
 * Usage:
 * @RequirePermissions(['users.manage', 'roles.create'])
 * async createUser() { ... }
 * 
 * Security Principles:
 * - Least Privilege: Only users with ALL specified permissions can access
 * - Dynamic Validation: Permissions are validated against current database state
 * - Fail-Safe: If permission validation fails, access is denied
 */
export const RequirePermissions = (permissions: string[]) => {
  return SetMetadata(PERMISSIONS_KEY, permissions);
};

/**
 * Common permission sets for convenience
 */
export const CommonPermissions = {
  // User Management
  USER_VIEW: ['users.view'],
  USER_MANAGE: ['users.view', 'users.manage'],
  
  // Role Management (Super Admin only)
  ROLE_VIEW: ['roles.view'],
  ROLE_MANAGE: ['roles.view', 'roles.manage'],
  ROLE_CREATE: ['roles.create'],
  ROLE_DELETE: ['roles.delete'],
  
  // Account Management
  ACCOUNT_VIEW: ['accounts.view'],
  ACCOUNT_MANAGE: ['accounts.view', 'accounts.update'],
  ACCOUNT_CREATE: ['accounts.create'],
  
  // System Administration
  SYSTEM_ADMIN: ['system.admin'],
  SYSTEM_SETTINGS: ['system.settings'],
  
  // Audit & Reporting
  AUDIT_VIEW: ['audit.view'],
  REPORTS_VIEW: ['reports.view'],
  REPORTS_CREATE: ['reports.create', 'reports.view'],
  
  // Super Admin (all permissions)
  SUPER_ADMIN: ['system.admin', 'roles.manage', 'users.manage'],
} as const;