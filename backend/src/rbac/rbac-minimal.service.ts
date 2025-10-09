import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionCacheService } from '../common/services/permission-cache.service';

@Injectable()
export class RbacMinimalService {
  private readonly logger = new Logger(RbacMinimalService.name);

  constructor(
    private prisma: PrismaService,
    private permissionCache?: PermissionCacheService
  ) {}

  /**
   * Seed basic roles and permissions for the system
   */
  async seedBasicRoles() {
    try {
      // Create basic roles if they don't exist
      const roles = [
        { name: 'Administrator', description: 'Full system access', isSystem: true },
        { name: 'Manager', description: 'Manager level access', isSystem: false },
        { name: 'Agent', description: 'Agent level access', isSystem: false },
        { name: 'Supervisor', description: 'Supervisor level access', isSystem: false },
      ];

      const createdRoles = [];
      for (const roleData of roles) {
        const existing = await this.prisma.role.findFirst({
          where: { name: roleData.name },
        });

        if (!existing) {
          const role = await this.prisma.role.create({
            data: roleData,
          });
          createdRoles.push(role);
          this.logger.log(`Created role: ${role.name}`);
        }
      }

      // Create basic permissions
      const permissions = [
        { code: 'accounts.view', name: 'View Accounts', category: 'Account Management', resource: 'accounts', action: 'view' },
        { code: 'accounts.create', name: 'Create Account', category: 'Account Management', resource: 'accounts', action: 'create' },
        { code: 'accounts.update', name: 'Update Account', category: 'Account Management', resource: 'accounts', action: 'update' },
        { code: 'calls.view', name: 'View Calls', category: 'Call Management', resource: 'calls', action: 'view' },
        { code: 'calls.create', name: 'Create Call', category: 'Call Management', resource: 'calls', action: 'create' },
        { code: 'users.view', name: 'View Users', category: 'User Management', resource: 'users', action: 'view' },
        { code: 'users.manage', name: 'Manage Users', category: 'User Management', resource: 'users', action: 'manage' },
        { code: 'system.admin', name: 'System Administration', category: 'System', resource: 'system', action: 'admin', isSystem: true },
        
        // Dispositions permissions
        { code: 'dispositions.view', name: 'View Dispositions', category: 'Dispositions', resource: 'dispositions', action: 'view' },
        { code: 'dispositions.create', name: 'Create Disposition', category: 'Dispositions', resource: 'dispositions', action: 'create' },
        { code: 'dispositions.update', name: 'Update Disposition', category: 'Dispositions', resource: 'dispositions', action: 'update' },
        { code: 'dispositions.delete', name: 'Delete Disposition', category: 'Dispositions', resource: 'dispositions', action: 'delete' },
        
        // Upload Data permissions
        { code: 'uploads.view', name: 'View Uploads', category: 'Upload Data', resource: 'uploads', action: 'view' },
        { code: 'uploads.create', name: 'Upload Data', category: 'Upload Data', resource: 'uploads', action: 'create' },
        { code: 'uploads.manage', name: 'Manage Uploads', category: 'Upload Data', resource: 'uploads', action: 'manage' },
        { code: 'uploads.delete', name: 'Delete Upload Data', category: 'Upload Data', resource: 'uploads', action: 'delete' },
        
        // Reports and Audit Logs permissions
        { code: 'reports.view', name: 'View Reports', category: 'Reports and Audit Logs', resource: 'reports', action: 'view' },
        { code: 'reports.create', name: 'Create Reports', category: 'Reports and Audit Logs', resource: 'reports', action: 'create' },
        { code: 'reports.export', name: 'Export Reports', category: 'Reports and Audit Logs', resource: 'reports', action: 'export' },
        { code: 'audit.view', name: 'View Audit Logs', category: 'Reports and Audit Logs', resource: 'audit', action: 'view' },
        { code: 'audit.manage', name: 'Manage Audit Logs', category: 'Reports and Audit Logs', resource: 'audit', action: 'manage' },
        
        // Role Management permissions (needed for superadmin access)
        { code: 'roles.view', name: 'View Roles', category: 'Role Management', resource: 'roles', action: 'view' },
        { code: 'roles.manage', name: 'Manage Roles', category: 'Role Management', resource: 'roles', action: 'manage' },
        { code: 'roles.create', name: 'Create Roles', category: 'Role Management', resource: 'roles', action: 'create' },
        { code: 'roles.update', name: 'Update Roles', category: 'Role Management', resource: 'roles', action: 'update' },
        { code: 'roles.delete', name: 'Delete Roles', category: 'Role Management', resource: 'roles', action: 'delete' },
        
        // RBAC Management permissions (needed for RBAC endpoints)
        { code: 'rbac.view', name: 'View RBAC Data', category: 'RBAC Management', resource: 'rbac', action: 'view' },
        { code: 'rbac.manage', name: 'Manage RBAC Data', category: 'RBAC Management', resource: 'rbac', action: 'manage' },
        
        // System Settings permissions (needed for superadmin access)
        { code: 'system.settings', name: 'System Settings', category: 'System', resource: 'system', action: 'settings' },
        { code: 'system.config', name: 'System Configuration', category: 'System', resource: 'system', action: 'config' },
        
        // Integration permissions (needed for superadmin access)
        { code: 'integrations.view', name: 'View Integrations', category: 'Integrations', resource: 'integrations', action: 'view' },
        { code: 'integrations.manage', name: 'Manage Integrations', category: 'Integrations', resource: 'integrations', action: 'manage' },
      ];

      const createdPermissions = [];
      for (const permData of permissions) {
        const existing = await this.prisma.permission.findFirst({
          where: { code: permData.code },
        });

        if (!existing) {
          const permission = await this.prisma.permission.create({
            data: permData,
          });
          createdPermissions.push(permission);
          this.logger.log(`Created permission: ${permission.code}`);
        }
      }

      return {
        roles: createdRoles.length,
        permissions: createdPermissions.length,
        message: `Seeded ${createdRoles.length} roles and ${createdPermissions.length} permissions`,
      };

    } catch (error) {
      this.logger.error(`Failed to seed basic roles: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all roles
   */
  async getRoles() {
    try {
      const roles = await this.prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { userRoles: true, permissions: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Transform the result to match frontend expectations
      return roles.map(role => ({
        ...role,
        permissions: role.permissions.map(rp => rp.permission),
        userCount: role._count.userRoles,
      }));
    } catch (error) {
      this.logger.error(`Failed to get roles: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all permissions
   */
  async getPermissions() {
    try {
      return await this.prisma.permission.findMany({
        orderBy: [
          { category: 'asc' },
          { resource: 'asc' },
          { action: 'asc' },
        ],
      });
    } catch (error) {
      this.logger.error(`Failed to get permissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Basic audit logging functionality
   */
  async logAction(userId: string | null, action: string, entity: string, entityId?: string, details?: any) {
    try {
      // Handle system operations by setting actorId to null
      const actorId = userId === 'system' ? null : userId;
      
      // Validate that the user exists if actorId is provided
      if (actorId) {
        const userExists = await this.prisma.user.findUnique({
          where: { id: actorId },
          select: { id: true }
        });
        
        if (!userExists) {
          this.logger.warn(`User ${actorId} not found for audit log, setting actorId to null`);
          // Set to null if user doesn't exist
          return await this.logAction(null, action, entity, entityId, details);
        }
      }
      
      const auditLog = await this.prisma.auditLog?.create({
        data: {
          actorId,
          action,
          entity,
          entityId,
          newValue: details ? JSON.stringify(details) : null,
        },
      });

      this.logger.log(`Audit log created: ${action} on ${entity} by ${userId || 'system'}`);
      return auditLog;
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
      // Don't throw - audit logging shouldn't break the main functionality
      return null;
    }
  }

  /**
   * Get recent audit logs
   */
  async getRecentAuditLogs(limit: number = 50) {
    try {
      return await this.prisma.auditLog.findMany({
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to get audit logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Seed basic disposition categories and dispositions
   */
  async seedBasicDispositions() {
    try {
      // Create basic categories
      const categories = [
        { name: 'Successful', description: 'Successful contact outcomes', color: '#10B981', sortOrder: 1 },
        { name: 'No Contact', description: 'Unable to reach contact', color: '#F59E0B', sortOrder: 2 },
        { name: 'Unsuccessful', description: 'Contact made but unsuccessful', color: '#EF4444', sortOrder: 3 },
      ];

      const createdCategories = {};
      for (const catData of categories) {
        let category = await this.prisma.dispositionCategory.findFirst({
          where: { name: catData.name },
        });

        if (!category) {
          category = await this.prisma.dispositionCategory.create({
            data: catData,
          });
        }

        createdCategories[catData.name] = category.id;
      }

      // Create basic dispositions
      const dispositions = [
        { code: 'SALE', name: 'Sale', description: 'Successful sale completed', category: 'Successful', isSuccessful: true },
        { code: 'NO_ANSWER', name: 'No Answer', description: 'Phone rang but no answer', category: 'No Contact' },
        { code: 'NOT_INTERESTED', name: 'Not Interested', description: 'Customer not interested', category: 'Unsuccessful' },
        { code: 'CALLBACK', name: 'Callback Requested', description: 'Customer requested callback', category: 'Successful', requiresFollowUp: true },
      ];

      const createdDispositions = [];
      for (const dispData of dispositions) {
        const existing = await this.prisma.disposition.findFirst({
          where: { code: dispData.code },
        });

        if (!existing) {
          const disposition = await this.prisma.disposition.create({
            data: {
              code: dispData.code,
              name: dispData.name,
              description: dispData.description,
              categoryId: createdCategories[dispData.category],
              requiresFollowUp: dispData.requiresFollowUp || false,
              requiresPayment: false,
              requiresNotes: false,
              isSuccessful: dispData.isSuccessful || false,
              isActive: true,
              sortOrder: 0,
            },
          });
          createdDispositions.push(disposition);
        }
      }

      this.logger.log(`Seeded ${Object.keys(createdCategories).length} categories and ${createdDispositions.length} dispositions`);
      return {
        categories: Object.keys(createdCategories).length,
        dispositions: createdDispositions.length,
      };
    } catch (error) {
      this.logger.error(`Failed to seed dispositions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get dispositions with categories
   */
  async getDispositions() {
    try {
      return await this.prisma.disposition.findMany({
        include: {
          category: true,
        },
        where: { isActive: true },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { sortOrder: 'asc' },
        ],
      });
    } catch (error) {
      this.logger.error(`Failed to get dispositions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(data: { name: string; description?: string; isActive?: boolean; permissions?: string[] }) {
    try {
      // Create the role first
      const role = await this.prisma.role.create({
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive ?? true,
          isSystem: false,
        },
      });

      // If permissions are provided, create role-permission relationships
      if (data.permissions && data.permissions.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: data.permissions.map(permissionId => ({
            roleId: role.id,
            permissionId,
          })),
        });
      }

      // Fetch the complete role with permissions and counts
      const completeRole = await this.prisma.role.findUnique({
        where: { id: role.id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              userRoles: true,
              permissions: true,
            },
          },
        },
      });

      // Transform the result to match frontend expectations
      const result = {
        ...completeRole,
        permissions: completeRole.permissions.map(rp => rp.permission),
        userCount: completeRole._count.userRoles,
      };

      // Clear all cache since we created a new role (affects all users)
      if (this.permissionCache) {
        await this.permissionCache.clearAllCache();
      }

      // Skip audit logging for system operations to avoid foreign key constraint issues
      // TODO: Fix audit logging for system operations
      this.logger.log(`Created role: ${role.name} with ${data.permissions?.length || 0} permissions (audit logging temporarily disabled)`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create role: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a role
   */
  async updateRole(id: string, data: { name?: string; description?: string; isActive?: boolean; permissions?: string[] }) {
    try {
      // For now, use a simplified approach without permissions update
      // The main issue is the user needs admin permissions immediately
      const role = await this.prisma.role.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              userRoles: true,
              permissions: true,
            },
          },
        },
      });

      // Transform the result to match frontend expectations
      const transformedRole = {
        ...role,
        permissions: role.permissions.map(rp => rp.permission),
        userCount: role._count.userRoles,
      };

      this.logger.log(`Updated role: ${transformedRole.name} (permissions update not implemented yet)`);
      return transformedRole;
    } catch (error) {
      this.logger.error(`Failed to update role: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Assign all permissions to Administrator role (emergency fix)
   */
  async makeAdministratorSuperAdmin() {
    try {
      // Find Administrator role
      const adminRole = await this.prisma.role.findFirst({
        where: { name: 'Administrator' },
      });

      if (!adminRole) {
        throw new Error('Administrator role not found');
      }

      // Get all permissions
      const allPermissions = await this.prisma.permission.findMany({
        select: { id: true },
      });

      // Clear existing permissions for admin
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: adminRole.id },
      });

      // Assign all permissions to admin
      if (allPermissions.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: allPermissions.map(permission => ({
            roleId: adminRole.id,
            permissionId: permission.id,
          })),
        });
      }

      this.logger.log(`Assigned ${allPermissions.length} permissions to Administrator role`);
      
      return {
        success: true,
        message: `Administrator role now has ${allPermissions.length} permissions`,
        permissionCount: allPermissions.length,
      };
    } catch (error) {
      this.logger.error(`Failed to make Administrator super admin: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Debug method: Get all user role assignments
   */
  async getAllUserRoleAssignments() {
    try {
      const userRoles = await this.prisma.userRole.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true, // Legacy role field
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      return userRoles.map(ur => ({
        userId: ur.user.id,
        userEmail: ur.user.email,
        userName: `${ur.user.firstName} ${ur.user.lastName}`,
        legacyRole: ur.user.role,
        assignedRole: ur.role.name,
        roleId: ur.role.id,
        assignedAt: ur.assignedAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to get user role assignments: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Emergency: Assign all SUPER_ADMIN or ADMIN users to Administrator role
   */
  async assignAdminUsersToAdministratorRole() {
    try {
      // Find all users with legacy admin roles or specific admin emails
      const adminUsers = await this.prisma.user.findMany({
        where: {
          OR: [
            { role: 'SUPER_ADMIN' },
            { role: 'ADMIN' },
            { role: 'Administrator' },
            { email: { contains: 'admin' } },
            { email: 'admin@bank.com' },
            { email: 'admin@dialcraft.com' },
            { email: { startsWith: 'admin@' } },
          ],
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      // Find Administrator role
      const adminRole = await this.prisma.role.findFirst({
        where: { name: 'Administrator' },
      });

      if (!adminRole) {
        throw new Error('Administrator role not found');
      }

      let assignedCount = 0;
      for (const user of adminUsers) {
        // Check if user is already assigned to this role
        const existingAssignment = await this.prisma.userRole.findFirst({
          where: {
            userId: user.id,
            roleId: adminRole.id,
          },
        });

        if (!existingAssignment) {
          await this.prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: adminRole.id,
              assignedAt: new Date(),
            },
          });
          assignedCount++;
          this.logger.log(`Assigned user ${user.email} to Administrator role`);
        }
      }

      return {
        success: true,
        message: `Assigned ${assignedCount} admin users to Administrator role`,
        assignedUsers: adminUsers.map(u => u.email),
        assignedCount,
      };
    } catch (error) {
      this.logger.error(`Failed to assign admin users to Administrator role: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Assign RBAC permissions to Administrator role
   */
  async assignRbacPermissionsToAdmin() {
    try {
      // Find Administrator role
      const adminRole = await this.prisma.role.findFirst({
        where: { name: 'Administrator' }
      });

      if (!adminRole) {
        throw new Error('Administrator role not found');
      }

      // Find rbac permissions
      const rbacPermissions = await this.prisma.permission.findMany({
        where: {
          code: { in: ['rbac.view', 'rbac.manage'] }
        }
      });

      if (rbacPermissions.length === 0) {
        return { message: 'No RBAC permissions found to assign' };
      }

      // Check what permissions are already assigned
      const existingAssignments = await this.prisma.rolePermission.findMany({
        where: {
          roleId: adminRole.id,
          permissionId: { in: rbacPermissions.map(p => p.id) }
        }
      });

      // Filter out already assigned permissions
      const newPermissions = rbacPermissions.filter(p => 
        !existingAssignments.some(ea => ea.permissionId === p.id)
      );

      if (newPermissions.length === 0) {
        return { message: 'RBAC permissions already assigned to Administrator role' };
      }

      // Create new role-permission assignments
      await this.prisma.rolePermission.createMany({
        data: newPermissions.map(permission => ({
          roleId: adminRole.id,
          permissionId: permission.id,
          assignedBy: null, // System assignment
        }))
      });

      return {
        message: `Assigned ${newPermissions.length} RBAC permissions to Administrator role`,
        assignedPermissions: newPermissions.map(p => p.code)
      };
    } catch (error) {
      this.logger.error(`Failed to assign RBAC permissions to admin: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a role (only non-system roles)
   */
  async deleteRole(id: string) {
    try {
      // Check if role is system role
      const role = await this.prisma.role.findUnique({ where: { id } });
      if (!role) {
        throw new Error('Role not found');
      }
      if (role.isSystem) {
        throw new Error('Cannot delete system role');
      }

      // Delete the role
      await this.prisma.role.delete({ where: { id } });
      
      // Skip audit logging for system operations to avoid foreign key constraint issues
      // TODO: Fix audit logging for system operations
      this.logger.log(`Deleted role: ${role.name} (audit logging temporarily disabled)`);
      return { success: true, message: `Role '${role.name}' deleted successfully` };
    } catch (error) {
      this.logger.error(`Failed to delete role: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new permission
   */
  async createPermission(data: { 
    code: string; 
    name: string; 
    category: string; 
    resource: string; 
    action: string;
    description?: string;
  }) {
    try {
      const permission = await this.prisma.permission.create({
        data: {
          code: data.code,
          name: data.name,
          category: data.category,
          resource: data.resource,
          action: data.action,
          description: data.description,
          isSystem: false,
        },
      });

      // Skip audit logging for system operations to avoid foreign key constraint issues
      // TODO: Fix audit logging for system operations
      this.logger.log(`Created permission: ${permission.code} (audit logging temporarily disabled)`);
      return permission;
    } catch (error) {
      this.logger.error(`Failed to create permission: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new disposition
   */
  async createDisposition(data: any) {
    try {
      // Validate that the category exists
      const category = await this.prisma.dispositionCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error(`Category with id ${data.categoryId} not found`);
      }

      // Check if code already exists
      const existingDisposition = await this.prisma.disposition.findUnique({
        where: { code: data.code },
      });

      if (existingDisposition) {
        throw new Error(`Disposition with code ${data.code} already exists`);
      }

      const disposition = await this.prisma.disposition.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          requiresFollowUp: data.requiresFollowUp || false,
          requiresPayment: data.requiresPayment || false,
          requiresNotes: data.requiresNotes || false,
          isSuccessful: data.isSuccessful || false,
          sortOrder: data.sortOrder || 0,
          isActive: data.isActive !== false, // Default to true unless explicitly false
        },
        include: {
          category: true,
        },
      });

      this.logger.log(`Created disposition: ${disposition.name} (${disposition.code})`);
      return disposition;
    } catch (error) {
      this.logger.error(`Failed to create disposition: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a disposition
   */
  async updateDisposition(id: string, data: any) {
    try {
      // Check if disposition exists
      const existingDisposition = await this.prisma.disposition.findUnique({
        where: { id },
        include: { category: true },
      });

      if (!existingDisposition) {
        throw new Error(`Disposition with id ${id} not found`);
      }

      // If categoryId is being updated, validate it exists
      if (data.categoryId && data.categoryId !== existingDisposition.categoryId) {
        const category = await this.prisma.dispositionCategory.findUnique({
          where: { id: data.categoryId },
        });

        if (!category) {
          throw new Error(`Category with id ${data.categoryId} not found`);
        }
      }

      // If code is being updated, check for conflicts
      if (data.code && data.code !== existingDisposition.code) {
        const codeConflict = await this.prisma.disposition.findFirst({
          where: { 
            code: data.code,
            id: { not: id }
          },
        });

        if (codeConflict) {
          throw new Error(`Disposition with code ${data.code} already exists`);
        }
      }

      const updatedDisposition = await this.prisma.disposition.update({
        where: { id },
        data: {
          ...(data.code && { code: data.code }),
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.categoryId && { categoryId: data.categoryId }),
          ...(data.requiresFollowUp !== undefined && { requiresFollowUp: data.requiresFollowUp }),
          ...(data.requiresPayment !== undefined && { requiresPayment: data.requiresPayment }),
          ...(data.requiresNotes !== undefined && { requiresNotes: data.requiresNotes }),
          ...(data.isSuccessful !== undefined && { isSuccessful: data.isSuccessful }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          updatedAt: new Date(),
        },
        include: {
          category: true,
        },
      });

      this.logger.log(`Updated disposition: ${updatedDisposition.name} (${updatedDisposition.code})`);
      return updatedDisposition;
    } catch (error) {
      this.logger.error(`Failed to update disposition ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a disposition
   */
  async deleteDisposition(id: string) {
    try {
      // Check if disposition exists
      const existingDisposition = await this.prisma.disposition.findUnique({
        where: { id },
        include: { category: true },
      });

      if (!existingDisposition) {
        throw new Error(`Disposition with id ${id} not found`);
      }

      // TODO: Check if disposition is being used in any calls before deleting
      // For now, we'll allow deletion but log a warning
      this.logger.warn(`Deleting disposition: ${existingDisposition.name} (${existingDisposition.code}). Ensure it's not referenced in call records.`);

      await this.prisma.disposition.delete({
        where: { id },
      });

      this.logger.log(`Deleted disposition: ${existingDisposition.name} (${existingDisposition.code})`);
      return { success: true, message: `Disposition ${existingDisposition.name} deleted successfully` };
    } catch (error) {
      this.logger.error(`Failed to delete disposition ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new disposition category
   */
  async createDispositionCategory(data: any) {
    try {
      // Check if category name already exists
      const existingCategory = await this.prisma.dispositionCategory.findFirst({
        where: { name: data.name },
      });

      if (existingCategory) {
        throw new Error(`Disposition category with name "${data.name}" already exists`);
      }

      const category = await this.prisma.dispositionCategory.create({
        data: {
          name: data.name,
          description: data.description,
          color: data.color,
          icon: data.icon,
          sortOrder: data.sortOrder || 0,
          isActive: data.isActive !== false, // Default to true unless explicitly false
        },
        include: {
          dispositions: true,
        },
      });

      this.logger.log(`Created disposition category: ${category.name}`);
      return category;
    } catch (error) {
      this.logger.error(`Failed to create disposition category: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all disposition categories
   */
  async getDispositionCategories() {
    try {
      return await this.prisma.dispositionCategory.findMany({
        include: {
          dispositions: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to get disposition categories: ${error.message}`, error.stack);
      throw error;
    }
  }
}