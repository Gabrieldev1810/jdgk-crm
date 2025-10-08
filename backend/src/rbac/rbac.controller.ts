import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RbacMinimalService } from './rbac-minimal.service';

@ApiTags('RBAC')
@Controller('rbac')
export class RbacController {
  private readonly logger = new Logger(RbacController.name);

  constructor(private readonly rbacService: RbacMinimalService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of all roles' })
  async getRoles() {
    return this.rbacService.getRoles();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'List of all permissions' })
  async getPermissions() {
    return this.rbacService.getPermissions();
  }

  @Get('dispositions')
  @ApiOperation({ summary: 'Get all dispositions' })
  @ApiResponse({ status: 200, description: 'List of all dispositions with categories' })
  async getDispositions() {
    return this.rbacService.getDispositions();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get recent audit logs' })
  @ApiResponse({ status: 200, description: 'List of recent audit logs' })
  async getAuditLogs() {
    return this.rbacService.getRecentAuditLogs();
  }

  @Post('seed/roles')
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
}