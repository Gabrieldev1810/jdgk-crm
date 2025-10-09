import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Query, Body, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLoggingService } from '../common/services/audit-logging.service';
import { PermissionCacheService } from '../common/services/permission-cache.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private usersService: UsersService,
    private auditService: AuditLoggingService,
    private permissionCacheService: PermissionCacheService,
  ) {}

  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  async findAll(
    @Request() req,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const users = await this.usersService.findAll(skip, take);
    
    // Log data access
    await this.auditService.logDataAccessEvent(
      'VIEW',
      req.user.id,
      'USERS',
      users.map(u => u.id),
      {
        pagination: { skip, take },
        resultCount: users.length,
      },
      req.ip,
      req.get('User-Agent')
    );

    return users;
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }



  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        password: { type: 'string', minLength: 6 },
        role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'AGENT'] },
        quotaTarget: { type: 'number', minimum: 0 }
      },
      required: ['email', 'firstName', 'lastName', 'password', 'role']
    }
  })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto, @Request() req) {
    const newUser = await this.usersService.createUser(createUserDto);
    
    // Log user creation
    await this.auditService.logUserManagementEvent(
      'USER_CREATED',
      req.user.id,
      newUser.id,
      {
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
      req.ip,
      req.get('User-Agent')
    );

    return newUser;
  }

  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    // Get original user data for audit comparison
    const originalUser = await this.usersService.findById(id);
    
    const updatedUser = await this.usersService.updateUser(id, updateUserDto);
    
    // Log user update with changes
    await this.auditService.logUserManagementEvent(
      'USER_UPDATED',
      req.user.id,
      id,
      {
        originalData: {
          email: originalUser?.email,
          firstName: originalUser?.firstName,
          lastName: originalUser?.lastName,
          role: originalUser?.role,
          isActive: originalUser?.isActive,
        },
        updatedData: updateUserDto,
        changes: Object.keys(updateUserDto),
      },
      req.ip,
      req.get('User-Agent')
    );

    return updatedUser;
  }

  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    // Get user data before deletion for audit log
    const userToDelete = await this.usersService.findById(id);
    
    await this.usersService.deleteUser(id);
    
    // Log user deletion
    await this.auditService.logUserManagementEvent(
      'USER_DELETED',
      req.user.id,
      id,
      {
        deletedUser: {
          email: userToDelete?.email,
          firstName: userToDelete?.firstName,
          lastName: userToDelete?.lastName,
          role: userToDelete?.role,
        },
      },
      req.ip,
      req.get('User-Agent')
    );

    return { message: 'User deleted successfully' };
  }

  @ApiOperation({ summary: 'Get user roles' })
  @ApiResponse({ status: 200, description: 'User roles retrieved successfully' })
  @Get(':id/roles')
  async getUserRoles(@Param('id') id: string) {
    return this.usersService.getUserRoles(id);
  }

  @ApiOperation({ summary: 'Assign role to user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post(':id/roles/:roleId')
  async assignRoleToUser(
    @Param('id') userId: string,
    @Param('roleId') roleId: string,
    @Request() req
  ) {
    await this.usersService.assignRoleToUser(userId, roleId, req.user.id);
    
    // Log role assignment
    await this.auditService.logRbacEvent(
      'USER_ROLE_ASSIGNED',
      req.user.id,
      'USER',
      userId,
      {
        roleId: roleId,
        assignedToUserId: userId,
      },
      req.ip,
      req.get('User-Agent')
    );

    return { message: 'Role assigned successfully' };
  }

  @ApiOperation({ summary: 'Remove role from user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete(':id/roles/:roleId')
  async removeRoleFromUser(
    @Param('id') userId: string,
    @Param('roleId') roleId: string,
    @Request() req
  ) {
    await this.usersService.removeRoleFromUser(userId, roleId);
    
    // Log role removal
    await this.auditService.logRbacEvent(
      'USER_ROLE_REVOKED',
      req.user.id,
      'USER',
      userId,
      {
        roleId: roleId,
        removedFromUserId: userId,
      },
      req.ip,
      req.get('User-Agent')
    );

    return { message: 'Role removed successfully' };
  }

  @ApiOperation({ summary: 'Update user roles (Admin only)' })
  @ApiResponse({ status: 200, description: 'User roles updated successfully' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id/roles')
  async updateUserRoles(
    @Param('id') userId: string,
    @Body('roleIds') roleIds: string[],
    @Request() req
  ) {
    await this.usersService.updateUserRoles(userId, roleIds, req.user.id);
    return { message: 'User roles updated successfully' };
  }

  @ApiOperation({ summary: 'Get user permissions' })
  @ApiResponse({ status: 200, description: 'User permissions retrieved successfully' })
  @Get(':id/permissions')
  async getUserPermissions(@Param('id') id: string) {
    return this.usersService.getUserPermissions(id);
  }

  @ApiOperation({ summary: 'Refresh user permissions cache' })
  @ApiResponse({ status: 200, description: 'User permissions cache refreshed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Post(':id/refresh-permissions')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async refreshUserPermissions(@Param('id') userId: string, @Request() req) {
    try {
      // Verify user exists
      const user = await this.usersService.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          timestamp: new Date().toISOString()
        };
      }

      // Invalidate user permission cache
      await this.permissionCacheService.invalidateUserCache(
        userId, 
        'Manual refresh via admin interface'
      );

      // Get fresh permissions from database
      const freshPermissions = await this.usersService.getUserPermissions(userId);

      // Log the action
      await this.auditService.logAuditEvent({
        userId: req.user.id,
        action: 'REFRESH_PERMISSIONS',
        resource: 'USER_PERMISSIONS',
        resourceId: userId,
        details: {
          targetUser: user.email,
          permissionCount: freshPermissions.length
        },
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return {
        success: true,
        message: 'User permissions refreshed successfully',
        user: {
          id: user.id,
          email: user.email
        },
        permissions: freshPermissions.map(p => p.code),
        permissionCount: freshPermissions.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to refresh permissions: ' + error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}