import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RbacMinimalService {
  private readonly logger = new Logger(RbacMinimalService.name);

  constructor(private prisma: PrismaService) {}

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
  async logAction(userId: string, action: string, entity: string, entityId?: string, details?: any) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          actorId: userId,
          action,
          entity,
          entityId,
          newValue: details ? JSON.stringify(details) : null,
        },
      });

      this.logger.log(`Audit log created: ${action} on ${entity} by user ${userId}`);
      return auditLog;
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
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

      await this.logAction('system', 'CREATE', 'role', role.id, { name: role.name, permissions: data.permissions?.length || 0 });
      this.logger.log(`Created role: ${role.name} with ${data.permissions?.length || 0} permissions`);
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
      // Update the role basic information
      const role = await this.prisma.role.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
        },
        include: {
          _count: {
            select: {
              userRoles: true,
              permissions: true,
            },
          },
        },
      });

      await this.logAction('system', 'UPDATE', 'role', role.id, { name: role.name, changes: data });
      this.logger.log(`Updated role: ${role.name}`);
      return role;
    } catch (error) {
      this.logger.error(`Failed to update role: ${error.message}`, error.stack);
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
      
      await this.logAction('system', 'DELETE', 'role', id, { name: role.name });
      this.logger.log(`Deleted role: ${role.name}`);
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

      await this.logAction('system', 'CREATE', 'permission', permission.id, { code: permission.code });
      this.logger.log(`Created permission: ${permission.code}`);
      return permission;
    } catch (error) {
      this.logger.error(`Failed to create permission: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new disposition
   * TODO: Implement after fixing Prisma schema issues
   */
  async createDisposition(data: any) {
    throw new Error('Not implemented - Prisma schema issue needs to be resolved');
  }

  /**
   * Update a disposition
   * TODO: Implement after fixing Prisma schema issues
   */
  async updateDisposition(id: string, data: any) {
    throw new Error('Not implemented - Prisma schema issue needs to be resolved');
  }

  /**
   * Delete a disposition
   * TODO: Implement after fixing Prisma schema issues
   */
  async deleteDisposition(id: string) {
    throw new Error('Not implemented - Prisma schema issue needs to be resolved');
  }

  /**
   * Create a new disposition category
   * TODO: Implement after fixing Prisma schema issues
   */
  async createDispositionCategory(data: any) {
    throw new Error('Not implemented - Prisma schema issue needs to be resolved');
  }

  /**
   * Get all disposition categories
   * TODO: Implement after fixing Prisma schema issues
   */
  async getDispositionCategories() {
    throw new Error('Not implemented - Prisma schema issue needs to be resolved');
  }
}