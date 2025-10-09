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
exports.AccountsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const accounts_service_1 = require("./accounts.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const audit_logging_service_1 = require("../common/services/audit-logging.service");
let AccountsController = class AccountsController {
    constructor(accountsService, auditService) {
        this.accountsService = accountsService;
        this.auditService = auditService;
    }
    async create(createAccountDto, req) {
        try {
            const newAccount = await this.accountsService.create(createAccountDto, req.user.id);
            await this.auditService.logAuditEvent({
                userId: req.user.id,
                userEmail: req.user.email,
                action: 'CREATE',
                resource: 'ACCOUNTS',
                resourceId: newAccount.id,
                details: {
                    accountNumber: newAccount.accountNumber,
                    fullName: newAccount.fullName,
                    email: newAccount.email,
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                success: true,
            });
            return newAccount;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to create account', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async findAll(filterDto, req) {
        try {
            return await this.accountsService.findAll(filterDto, req.user);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch accounts', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getStatistics(req) {
        try {
            return await this.accountsService.getStatistics(req.user);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async exportAccounts(queryParams, req) {
        try {
            const csvData = await this.accountsService.exportToCsv(queryParams, req.user.id);
            await this.auditService.logAuditEvent({
                userId: req.user.id,
                userEmail: req.user.email,
                action: 'EXPORT',
                resource: 'ACCOUNTS',
                success: true,
                details: {
                    format: 'CSV',
                    filters: queryParams,
                },
            });
            return {
                success: true,
                data: csvData,
                filename: `accounts_export_${new Date().toISOString().split('T')[0]}.csv`,
                contentType: 'text/csv',
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to export accounts', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(id, req) {
        try {
            return await this.accountsService.findOne(id, req.user);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Account not found', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async update(id, updateAccountDto, req) {
        try {
            const updatedAccount = await this.accountsService.update(id, updateAccountDto, req.user.id);
            await this.auditService.logAuditEvent({
                userId: req.user.id,
                userEmail: req.user.email,
                action: 'UPDATE',
                resource: 'ACCOUNTS',
                resourceId: id,
                details: {
                    updatedFields: Object.keys(updateAccountDto),
                    changes: updateAccountDto,
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                success: true,
            });
            return updatedAccount;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to update account', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async remove(id, req) {
        try {
            const accountToDelete = await this.accountsService.findOne(id, req.user);
            const result = await this.accountsService.remove(id, req.user.id);
            await this.auditService.logAuditEvent({
                userId: req.user.id,
                userEmail: req.user.email,
                action: 'DELETE',
                resource: 'ACCOUNTS',
                resourceId: id,
                details: {
                    deletedAccount: {
                        accountNumber: accountToDelete.accountNumber,
                        fullName: accountToDelete.fullName,
                        email: accountToDelete.email,
                    },
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                success: true,
            });
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to delete account', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async bulkUpload(file, req) {
        if (!file) {
            throw new common_1.HttpException('No file uploaded', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.accountsService.bulkUpload(file, req.user.id);
            await this.auditService.logAuditEvent({
                userId: req.user.id,
                userEmail: req.user.email,
                action: 'BULK_UPLOAD',
                resource: 'ACCOUNTS',
                details: {
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    recordsTotal: result.summary?.total || 0,
                    recordsProcessed: result.summary?.processed || 0,
                    recordsFailed: result.summary?.failed || 0,
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                success: true,
            });
            return result;
        }
        catch (error) {
            await this.auditService.logAuditEvent({
                userId: req.user.id,
                userEmail: req.user.email,
                action: 'BULK_UPLOAD_FAILED',
                resource: 'ACCOUNTS',
                details: {
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    errorMessage: error.message,
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                success: false,
                errorMessage: error.message,
            });
            throw new common_1.HttpException(error.message || 'Failed to process bulk upload', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async assignToAgent(id, agentId, req) {
        try {
            return await this.accountsService.assignToAgent(id, agentId, req.user.id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to assign account', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async addNote(id, note, req) {
        try {
            return await this.accountsService.addNote(id, note, req.user.id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to add note', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getCallHistory(id, req) {
        try {
            return await this.accountsService.getCallHistory(id, req.user);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch call history', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AccountsController = AccountsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "exportAccounts", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('bulk-upload'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "bulkUpload", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('agentId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "assignToAgent", null);
__decorate([
    (0, common_1.Post)(':id/add-note'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('note')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "addNote", null);
__decorate([
    (0, common_1.Get)(':id/call-history'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "getCallHistory", null);
exports.AccountsController = AccountsController = __decorate([
    (0, common_1.Controller)('accounts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService,
        audit_logging_service_1.AuditLoggingService])
], AccountsController);
//# sourceMappingURL=accounts.controller.js.map