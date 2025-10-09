import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrivilegeEscalationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validates if a user can assign/revoke roles to/from target user
   * Prevents privilege escalation by ensuring users cannot grant roles higher than their own
   */
  async validateRoleAssignment(
    assignerId: string, 
    targetUserId: string, 
    roleIdsToAssign: string[]
  ): Promise<void> {
    // Prevent self-assignment for security
    if (assignerId === targetUserId) {
      throw new BadRequestException('Users cannot modify their own role assignments');
    }

    // Get assigner's current roles and permissions
    const assignerRoles = await this.getUserActiveRoles(assignerId);
    const assignerPermissions = await this.getUserPermissions(assignerId);
    
    // Check if assigner has user management permission
    const hasUserManagement = assignerPermissions.some(p => 
      p.code === 'users.manage' || p.code === 'rbac.assign_roles'
    );
    
    if (!hasUserManagement) {
      throw new ForbiddenException('Insufficient permissions to assign roles');
    }

    // Get roles being assigned
    const rolesToAssign = await this.prisma.role.findMany({
      where: { 
        id: { in: roleIdsToAssign },
        isActive: true
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    // Validate each role assignment
    for (const role of rolesToAssign) {
      await this.validateSingleRoleAssignment(assignerId, assignerRoles, assignerPermissions, role);
    }
  }

  /**
   * Validates if a user can grant/revoke permissions to/from a role
   * Prevents users from granting permissions they don't have
   */
  async validatePermissionGrant(
    granterId: string,
    roleId: string,
    permissionIdsToGrant: string[]
  ): Promise<void> {
    // Get granter's permissions
    const granterPermissions = await this.getUserPermissions(granterId);
    
    // Check if granter has role management permission
    const hasRoleManagement = granterPermissions.some(p => 
      p.code === 'rbac.manage_roles' || p.code === 'rbac.assign_permissions'
    );
    
    if (!hasRoleManagement) {
      throw new ForbiddenException('Insufficient permissions to manage role permissions');
    }

    // Get permissions being granted
    const permissionsToGrant = await this.prisma.permission.findMany({
      where: { id: { in: permissionIdsToGrant } }
    });

    // Validate each permission grant
    for (const permission of permissionsToGrant) {
      const hasPermission = granterPermissions.some(p => p.id === permission.id);
      
      if (!hasPermission) {
        throw new ForbiddenException(
          `Cannot grant permission '${permission.code}' that you don't possess`
        );
      }

      // Additional check for system permissions
      if (permission.code.startsWith('rbac.') && !this.hasSystemAdminRole(granterPermissions)) {
        throw new ForbiddenException(
          `Cannot grant system permission '${permission.code}' without system admin role`
        );
      }
    }
  }

  /**
   * Validates role modification (updating role permissions)
   * Ensures users can only modify roles with permissions they have
   */
  async validateRoleModification(
    modifierId: string,
    roleId: string,
    newPermissionIds: string[]
  ): Promise<void> {
    // Get modifier's permissions
    const modifierPermissions = await this.getUserPermissions(modifierId);
    
    // Check role management permission
    const canManageRoles = modifierPermissions.some(p => 
      p.code === 'rbac.manage_roles'
    );
    
    if (!canManageRoles) {
      throw new ForbiddenException('Insufficient permissions to modify roles');
    }

    // Get the role being modified
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      throw new BadRequestException('Role not found');
    }

    // Prevent modification of system roles by non-system admins
    if (role.isSystem && !this.hasSystemAdminRole(modifierPermissions)) {
      throw new ForbiddenException('Cannot modify system roles without system admin privileges');
    }

    // Validate new permissions
    const newPermissions = await this.prisma.permission.findMany({
      where: { id: { in: newPermissionIds } }
    });

    for (const permission of newPermissions) {
      const hasPermission = modifierPermissions.some(p => p.id === permission.id);
      
      if (!hasPermission) {
        throw new ForbiddenException(
          `Cannot assign permission '${permission.code}' to role that you don't possess`
        );
      }
    }
  }

  /**
   * Private helper methods
   */
  private async validateSingleRoleAssignment(
    assignerId: string,
    assignerRoles: any[],
    assignerPermissions: any[],
    roleToAssign: any
  ): Promise<void> {
    // System roles can only be assigned by system admins
    if (roleToAssign.isSystem && !this.hasSystemAdminRole(assignerPermissions)) {
      throw new ForbiddenException(
        `Cannot assign system role '${roleToAssign.name}' without system admin privileges`
      );
    }

    // Check if assigner has all permissions that the role grants
    for (const rolePermission of roleToAssign.permissions) {
      const hasPermission = assignerPermissions.some(p => 
        p.id === rolePermission.permission.id
      );
      
      if (!hasPermission) {
        throw new ForbiddenException(
          `Cannot assign role '${roleToAssign.name}' containing permission '${rolePermission.permission.code}' that you don't possess`
        );
      }
    }
  }

  private async getUserActiveRoles(userId: string): Promise<any[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { 
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        role: true
      }
    });

    return userRoles.map(ur => ur.role);
  }

  private async getUserPermissions(userId: string): Promise<any[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { 
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              },
              where: {
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: new Date() } }
                ]
              }
            }
          }
        }
      }
    });

    // Flatten permissions from all roles
    const permissions = userRoles.flatMap(ur =>
      ur.role.permissions.map(rp => rp.permission)
    );

    // Remove duplicates
    const uniquePermissions = permissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    );

    return uniquePermissions;
  }

  private hasSystemAdminRole(permissions: any[]): boolean {
    return permissions.some(p => 
      p.code === 'rbac.system_admin' || 
      p.code === 'system.admin' ||
      p.code === 'rbac.manage_system_roles'
    );
  }
}