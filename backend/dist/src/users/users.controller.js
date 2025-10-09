"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const audit_logging_service_1 = require("../common/services/audit-logging.service");
let UsersController = class UsersController {
    constructor(usersService, auditService) {
        this.usersService = usersService;
        this.auditService = auditService;
    }
    async findAll(req, skip, take) {
        const users = await this.usersService.findAll(skip, take);
        await this.auditService.logDataAccessEvent('VIEW', req.user.id, 'USERS', users.map(u => u.id), {
            pagination: { skip, take },
            resultCount: users.length,
        }, req.ip, req.get('User-Agent'));
        return users;
    }
    async findOne(id) {
        return this.usersService.findById(id);
    }
    async createUser(createUserDto, req) {
        const newUser = await this.usersService.createUser(createUserDto);
        await this.auditService.logUserManagementEvent('USER_CREATED', req.user.id, newUser.id, {
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
        }, req.ip, req.get('User-Agent'));
        return newUser;
    }
    async updateUser(id, updateUserDto, req) {
        const originalUser = await this.usersService.findById(id);
        const updatedUser = await this.usersService.updateUser(id, updateUserDto);
        await this.auditService.logUserManagementEvent('USER_UPDATED', req.user.id, id, {
            originalData: {
                email: originalUser?.email,
                firstName: originalUser?.firstName,
                lastName: originalUser?.lastName,
                role: originalUser?.role,
                isActive: originalUser?.isActive,
            },
            updatedData: updateUserDto,
            changes: Object.keys(updateUserDto),
        }, req.ip, req.get('User-Agent'));
        return updatedUser;
    }
    async deleteUser(id, req) {
        const userToDelete = await this.usersService.findById(id);
        await this.usersService.deleteUser(id);
        await this.auditService.logUserManagementEvent('USER_DELETED', req.user.id, id, {
            deletedUser: {
                email: userToDelete?.email,
                firstName: userToDelete?.firstName,
                lastName: userToDelete?.lastName,
                role: userToDelete?.role,
            },
        }, req.ip, req.get('User-Agent'));
        return { message: 'User deleted successfully' };
    }
    async getUserRoles(id) {
        return this.usersService.getUserRoles(id);
    }
    async assignRoleToUser(userId, roleId, req) {
        await this.usersService.assignRoleToUser(userId, roleId, req.user.id);
        await this.auditService.logRbacEvent('USER_ROLE_ASSIGNED', req.user.id, 'USER', userId, {
            roleId: roleId,
            assignedToUserId: userId,
        }, req.ip, req.get('User-Agent'));
        return { message: 'Role assigned successfully' };
    }
    async removeRoleFromUser(userId, roleId, req) {
        await this.usersService.removeRoleFromUser(userId, roleId);
        await this.auditService.logRbacEvent('USER_ROLE_REVOKED', req.user.id, 'USER', userId, {
            roleId: roleId,
            removedFromUserId: userId,
        }, req.ip, req.get('User-Agent'));
        return { message: 'Role removed successfully' };
    }
    async updateUserRoles(userId, roleIds, req) {
        await this.usersService.updateUserRoles(userId, roleIds, req.user.id);
        return { message: 'User roles updated successfully' };
    }
    async getUserPermissions(id) {
        return this.usersService.getUserPermissions(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get all users (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of users' }),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create new user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'User already exists' }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUser", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get user roles' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User roles retrieved successfully' }),
    (0, common_1.Get)(':id/roles'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserRoles", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Assign role to user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role assigned successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Post)(':id/roles/:roleId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('roleId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "assignRoleToUser", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Remove role from user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role removed successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Delete)(':id/roles/:roleId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('roleId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "removeRoleFromUser", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update user roles (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User roles updated successfully' }),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Patch)(':id/roles'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('roleIds')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUserRoles", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get user permissions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User permissions retrieved successfully' }),
    (0, common_1.Get)(':id/permissions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserPermissions", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        audit_logging_service_1.AuditLoggingService])
], UsersController);
//# sourceMappingURL=users.controller.js.map