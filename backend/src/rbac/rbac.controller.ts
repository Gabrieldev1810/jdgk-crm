import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Logger, UseGuards, UseInterceptors, Headers, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { RbacMinimalService } from './rbac-minimal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions, CommonPermissions } from '../auth/decorators/require-permissions.decorator';
import { AuditInterceptor, AuditLog } from '../common/interceptors/audit.interceptor';
import { SkipAuth } from '../auth/decorators/skip-auth.decorator';
import { PermissionCacheService } from '../common/services/permission-cache.service';
import { CreateDispositionDto, UpdateDispositionDto, CreateDispositionCategoryDto } from './dto/disposition.dto';

@ApiTags('RBAC')
@Controller('rbac')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class RbacController {
  private readonly logger = new Logger(RbacController.name);

  constructor(
    private readonly rbacService: RbacMinimalService,
    private readonly jwtService: JwtService,
    private readonly permissionCache: PermissionCacheService,
  ) {}

  @Get('debug/my-permissions')
  @SkipAuth()
  @ApiOperation({ summary: 'Debug: Check user permissions' })
  async debugMyPermissions(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      return { error: 'No authorization header' };
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      // Get permissions directly from cache service
      const permissions = await this.permissionCache.getUserPermissions(userId);
      
      return {
        userId,
        email: payload.email,
        role: payload.role,
        permissions: permissions.sort(),
        rbacPermissions: permissions.filter(p => p.startsWith('rbac.')),
        hasRbacView: permissions.includes('rbac.view')
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('roles')
  @RequirePermissions(['rbac.view'])
  @AuditLog({ action: 'VIEW_ROLES', resource: 'RBAC' })
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of all roles' })
  async getRoles() {
    return this.rbacService.getRoles();
  }

  @Get('permissions')
  @RequirePermissions(['rbac.view'])
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'List of all permissions' })
  async getPermissions() {
    return this.rbacService.getPermissions();
  }

  @Get('dispositions')
  @RequirePermissions(['calls.view'])
  @ApiOperation({ summary: 'Get all dispositions' })
  @ApiResponse({ status: 200, description: 'List of all dispositions with categories' })
  async getDispositions() {
    return this.rbacService.getDispositions();
  }

  @Post('dispositions')
  @RequirePermissions(['dispositions.create'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new disposition' })
  @ApiResponse({ status: 201, description: 'Disposition created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Disposition code already exists' })
  @ApiBody({ type: CreateDispositionDto })
  async createDisposition(@Body() createDispositionDto: CreateDispositionDto) {
    try {
      const disposition = await this.rbacService.createDisposition(createDispositionDto);
      this.logger.log(`Created disposition: ${disposition.name} (${disposition.code}) by user`);
      return {
        success: true,
        message: `Disposition ${disposition.name} created successfully`,
        data: disposition,
      };
    } catch (error) {
      this.logger.error(`Failed to create disposition: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Patch('dispositions/:id')
  @RequirePermissions(['dispositions.update'])
  @ApiOperation({ summary: 'Update a disposition' })
  @ApiResponse({ status: 200, description: 'Disposition updated successfully' })
  @ApiResponse({ status: 404, description: 'Disposition not found' })
  @ApiResponse({ status: 409, description: 'Disposition code already exists' })
  @ApiParam({ name: 'id', description: 'Disposition ID' })
  @ApiBody({ type: UpdateDispositionDto })
  async updateDisposition(
    @Param('id') id: string,
    @Body() updateDispositionDto: UpdateDispositionDto,
  ) {
    try {
      const disposition = await this.rbacService.updateDisposition(id, updateDispositionDto);
      this.logger.log(`Updated disposition: ${disposition.name} (${disposition.code}) by user`);
      return {
        success: true,
        message: `Disposition ${disposition.name} updated successfully`,
        data: disposition,
      };
    } catch (error) {
      this.logger.error(`Failed to update disposition ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete('dispositions/:id')
  @RequirePermissions(['dispositions.delete'])
  @ApiOperation({ summary: 'Delete a disposition' })
  @ApiResponse({ status: 200, description: 'Disposition deleted successfully' })
  @ApiResponse({ status: 404, description: 'Disposition not found' })
  @ApiParam({ name: 'id', description: 'Disposition ID' })
  async deleteDisposition(@Param('id') id: string) {
    try {
      const result = await this.rbacService.deleteDisposition(id);
      this.logger.log(`Deleted disposition with id: ${id} by user`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete disposition ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('disposition-categories')
  @RequirePermissions(['calls.view'])
  @ApiOperation({ summary: 'Get all disposition categories' })
  @ApiResponse({ status: 200, description: 'List of all disposition categories with dispositions' })
  async getDispositionCategories() {
    return this.rbacService.getDispositionCategories();
  }

  @Post('disposition-categories')
  @RequirePermissions(['dispositions.create'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new disposition category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  @ApiBody({ type: CreateDispositionCategoryDto })
  async createDispositionCategory(@Body() createCategoryDto: CreateDispositionCategoryDto) {
    try {
      const category = await this.rbacService.createDispositionCategory(createCategoryDto);
      this.logger.log(`Created disposition category: ${category.name} by user`);
      return {
        success: true,
        message: `Category ${category.name} created successfully`,
        data: category,
      };
    } catch (error) {
      this.logger.error(`Failed to create disposition category: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('audit-logs')
  @RequirePermissions(['rbac.view', 'audit.view'])
  @ApiOperation({ summary: 'Get recent audit logs' })
  @ApiResponse({ status: 200, description: 'List of recent audit logs' })
  async getAuditLogs() {
    return this.rbacService.getRecentAuditLogs();
  }

  @Post('seed/roles')
  @RequirePermissions(['rbac.manage', 'system.admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed basic roles and permissions' })
  @ApiResponse({ status: 200, description: 'Roles and permissions seeded successfully' })
  async seedRoles() {
    try {
      const result = await this.rbacService.seedBasicRoles();
      this.logger.log(`Seeded RBAC data: ${result.message}`);
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      this.logger.error(`Failed to seed roles: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('seed/dispositions')
  @RequirePermissions(['calls.manage', 'system.admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed basic disposition categories and dispositions' })
  @ApiResponse({ status: 200, description: 'Dispositions seeded successfully' })
  async seedDispositions() {
    try {
      const result = await this.rbacService.seedBasicDispositions();
      this.logger.log(`Seeded disposition data: ${result.categories} categories, ${result.dispositions} dispositions`);
      return {
        success: true,
        message: `Seeded ${result.categories} categories and ${result.dispositions} dispositions`,
        ...result,
      };
    } catch (error) {
      this.logger.error(`Failed to seed dispositions: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('seed/all')
  @RequirePermissions(['system.admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed all RBAC and disposition data' })
  @ApiResponse({ status: 200, description: 'All data seeded successfully' })
  async seedAll() {
    try {
      const [rolesResult, dispositionsResult] = await Promise.all([
        this.rbacService.seedBasicRoles(),
        this.rbacService.seedBasicDispositions(),
      ]);

      const message = `Seeded ${rolesResult.roles} roles, ${rolesResult.permissions} permissions, ${dispositionsResult.categories} disposition categories, and ${dispositionsResult.dispositions} dispositions`;
      
      this.logger.log(message);
      return {
        success: true,
        message,
        roles: rolesResult,
        dispositions: dispositionsResult,
      };
    } catch (error) {
      this.logger.error(`Failed to seed all data: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('roles')
  @RequirePermissions(['rbac.manage'])
  @AuditLog({ 
    action: 'CREATE_ROLE', 
    resource: 'RBAC',
    includeRequestBody: true,
    includeResponseBody: true,
    sensitiveFields: []
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  async createRole(@Body() createRoleDto: { name: string; description?: string; isActive?: boolean; permissions?: string[] }) {
    try {
      const result = await this.rbacService.createRole(createRoleDto);
      this.logger.log(`Created new role: ${createRoleDto.name} with ${createRoleDto.permissions?.length || 0} permissions`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create role: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put('roles/:id')
  @RequirePermissions(['rbac.manage'])
  @AuditLog({ 
    action: 'UPDATE_ROLE', 
    resource: 'RBAC',
    includeRequestBody: true,
    includeResponseBody: true
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: { name?: string; description?: string; isActive?: boolean; permissions?: string[] }
  ) {
    try {
      const result = await this.rbacService.updateRole(id, updateRoleDto);
      this.logger.log(`Updated role: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update role: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete('roles/:id')
  @RequirePermissions(['rbac.manage'])
  @AuditLog({ 
    action: 'DELETE_ROLE', 
    resource: 'RBAC',
    includeResponseBody: true
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  async deleteRole(@Param('id') id: string) {
    try {
      const result = await this.rbacService.deleteRole(id);
      this.logger.log(`Deleted role: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete role: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('permissions')
  @RequirePermissions(['rbac.manage', 'system.admin'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  async createPermission(@Body() createPermissionDto: { 
    code: string; 
    name: string; 
    category: string; 
    resource: string; 
    action: string;
    description?: string;
  }) {
    try {
      const result = await this.rbacService.createPermission(createPermissionDto);
      this.logger.log(`Created new permission: ${createPermissionDto.code}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create permission: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('admin/fix-permissions')
  @RequirePermissions(['system.admin'])
  @AuditLog({ 
    action: 'SYSTEM_FIX_ADMIN_PERMISSIONS', 
    resource: 'SYSTEM_ADMINISTRATION',
    includeResponseBody: true
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Emergency: Assign all permissions to Administrator role' })
  @ApiResponse({ status: 200, description: 'Administrator role updated with all permissions' })
  async fixAdminPermissions() {
    try {
      const result = await this.rbacService.makeAdministratorSuperAdmin();
      this.logger.log(`Fixed Administrator permissions: ${result.message}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fix admin permissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('debug/user-roles')
  @RequirePermissions(['rbac.view', 'users.view'])
  @ApiOperation({ summary: 'Debug: Get all user role assignments' })
  @ApiResponse({ status: 200, description: 'List of user role assignments' })
  async getUserRoleAssignments() {
    try {
      const result = await this.rbacService.getAllUserRoleAssignments();
      return result;
    } catch (error) {
      this.logger.error(`Failed to get user role assignments: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('admin/assign-admin-users')
  @RequirePermissions(['system.admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Emergency: Assign all admin users to Administrator role' })
  @ApiResponse({ status: 200, description: 'Admin users assigned to Administrator role' })
  async assignAdminUsersToAdministratorRole() {
    try {
      const result = await this.rbacService.assignAdminUsersToAdministratorRole();
      this.logger.log(`Assigned admin users to Administrator role: ${result.message}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to assign admin users: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('bootstrap/init-admin')
  @SkipAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bootstrap: Initialize admin access (no auth required)' })
  @ApiResponse({ status: 200, description: 'Admin access initialized' })
  async bootstrapAdmin() {
    try {
      // First, seed basic roles if they don't exist
      const seedResult = await this.rbacService.seedBasicRoles();
      
      // Then assign admin users to Administrator role
      const assignResult = await this.rbacService.assignAdminUsersToAdministratorRole();
      
      this.logger.log('Bootstrap admin access completed');
      return {
        success: true,
        message: 'Admin access bootstrapped successfully',
        seedResult,
        assignResult
      };
    } catch (error) {
      this.logger.error(`Failed to bootstrap admin: ${error.message}`, error.stack);
      throw error;
    }
  }
}