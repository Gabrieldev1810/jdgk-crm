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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let UsersService = class UsersService {
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    async findByEmail(email) {
        return this.prismaService.user.findUnique({
            where: { email },
        });
    }
    async findById(id) {
        return this.prismaService.user.findUnique({
            where: { id },
        });
    }
    async findAll(skip = 0, take = 50) {
        const users = await this.prismaService.user.findMany({
            skip: Number(skip) || 0,
            take: Number(take) || 50,
            orderBy: { createdAt: 'desc' },
        });
        return users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });
    }
    async createUser(createUserDto) {
        const { email, password, firstName, lastName, role } = createUserDto;
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await this.prismaService.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: role || 'AGENT',
            },
        });
        const { password: _, ...safeUser } = user;
        return safeUser;
    }
    async updateUser(id, updateUserDto) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updateData = { ...updateUserDto };
        if (updateUserDto.password) {
            updateData.password = await bcrypt.hash(updateUserDto.password, 12);
            updateData.passwordChangedAt = new Date();
        }
        const updatedUser = await this.prismaService.user.update({
            where: { id },
            data: updateData,
        });
        const { password: _, ...safeUser } = updatedUser;
        return safeUser;
    }
    async deleteUser(id) {
        await this.prismaService.user.delete({
            where: { id },
        });
    }
    async updateLastLogin(id) {
        await this.prismaService.user.update({
            where: { id },
            data: {
                lastLogin: new Date(),
            },
        });
    }
    async assignRoleToUser(userId, roleId, assignedById) {
        await this.prismaService.userRole.create({
            data: {
                userId,
                roleId,
                assignedById,
                isActive: true,
            },
        });
    }
    async removeRoleFromUser(userId, roleId) {
        await this.prismaService.userRole.updateMany({
            where: {
                userId,
                roleId,
            },
            data: {
                isActive: false,
            },
        });
    }
    async getUserRoles(userId) {
        const userRoles = await this.prismaService.userRole.findMany({
            where: {
                userId,
                isActive: true,
            },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        isActive: true,
                    },
                },
            },
        });
        return userRoles.map(ur => ur.role);
    }
    async updateUserRoles(userId, roleIds, assignedById) {
        await this.prismaService.userRole.updateMany({
            where: { userId },
            data: { isActive: false },
        });
        if (roleIds.length > 0) {
            await this.prismaService.userRole.createMany({
                data: roleIds.map(roleId => ({
                    userId,
                    roleId,
                    assignedById,
                    isActive: true,
                })),
            });
        }
    }
    async getUserPermissions(userId) {
        try {
            const permissions = await this.prismaService.$queryRaw `
        SELECT DISTINCT p.id, p.code, p.name, p.description, p.category, p.resource, p.action
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permissionId
        JOIN roles r ON rp.roleId = r.id
        JOIN user_roles ur ON r.id = ur.roleId
        WHERE ur.userId = ${userId}
          AND ur.isActive = 1
          AND r.isActive = 1
      `;
            return permissions;
        }
        catch (error) {
            throw new Error(`Failed to get user permissions: ${error.message}`);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map