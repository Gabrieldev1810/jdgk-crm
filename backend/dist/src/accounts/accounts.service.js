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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AccountsService = class AccountsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createAccountDto, userId) {
        try {
            const account = await this.prisma.account.create({
                data: {
                    accountNumber: createAccountDto.accountNumber,
                    firstName: createAccountDto.firstName,
                    lastName: createAccountDto.lastName,
                    fullName: `${createAccountDto.firstName} ${createAccountDto.lastName}`,
                    email: createAccountDto.email,
                    originalAmount: createAccountDto.originalAmount || 0,
                    currentBalance: createAccountDto.currentBalance || 0,
                    assignedAgentId: userId,
                },
                include: {
                    assignedAgent: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    }
                }
            });
            return account;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to create account: ${error.message}`);
        }
    }
    async findAll(filterDto, user) {
        const { page = 1, limit = 10, search, status, } = filterDto;
        const skip = (page - 1) * limit;
        const take = parseInt(limit);
        const where = {};
        if (user.role === 'AGENT') {
            where.assignedAgentId = user.id;
        }
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { accountNumber: { contains: search } },
            ];
        }
        if (status) {
            where.status = status;
        }
        const [accounts, total] = await Promise.all([
            this.prisma.account.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    assignedAgent: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    }
                }
            }),
            this.prisma.account.count({ where })
        ]);
        return {
            accounts,
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                totalPages: Math.ceil(total / take)
            }
        };
    }
    async findOne(id, user) {
        const account = await this.prisma.account.findUnique({
            where: { id },
            include: {
                assignedAgent: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        if (user.role === 'AGENT' && account.assignedAgentId !== user.id) {
            throw new common_1.BadRequestException('Access denied to this account');
        }
        return account;
    }
    async update(id, updateAccountDto, userId) {
        const existingAccount = await this.prisma.account.findUnique({
            where: { id }
        });
        if (!existingAccount) {
            throw new common_1.NotFoundException('Account not found');
        }
        try {
            const account = await this.prisma.account.update({
                where: { id },
                data: {
                    ...updateAccountDto,
                    updatedAt: new Date(),
                }
            });
            return account;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to update account: ${error.message}`);
        }
    }
    async remove(id, userId) {
        const existingAccount = await this.prisma.account.findUnique({
            where: { id }
        });
        if (!existingAccount) {
            throw new common_1.NotFoundException('Account not found');
        }
        try {
            const account = await this.prisma.account.update({
                where: { id },
                data: {
                    status: 'DELETED',
                    updatedAt: new Date(),
                }
            });
            return { message: 'Account deleted successfully', id };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to delete account: ${error.message}`);
        }
    }
    async getStatistics(user) {
        const where = {};
        if (user.role === 'AGENT') {
            where.assignedAgentId = user.id;
        }
        const [totalAccounts, activeAccounts, newAccounts, ptpAccounts, paidAccounts,] = await Promise.all([
            this.prisma.account.count({ where }),
            this.prisma.account.count({ where: { ...where, status: 'ACTIVE' } }),
            this.prisma.account.count({ where: { ...where, status: 'NEW' } }),
            this.prisma.account.count({ where: { ...where, status: 'PTP' } }),
            this.prisma.account.count({ where: { ...where, status: 'PAID' } }),
        ]);
        return {
            totalAccounts,
            accountsByStatus: {
                active: activeAccounts,
                new: newAccounts,
                ptp: ptpAccounts,
                paid: paidAccounts
            }
        };
    }
    async assignToAgent(accountId, agentId, userId) {
        const agent = await this.prisma.user.findUnique({
            where: { id: agentId }
        });
        if (!agent || agent.role !== 'AGENT') {
            throw new common_1.BadRequestException('Invalid agent specified');
        }
        const account = await this.prisma.account.update({
            where: { id: accountId },
            data: {
                assignedAgentId: agentId,
                updatedAt: new Date(),
            },
            include: {
                assignedAgent: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });
        return account;
    }
    async addNote(accountId, note, userId) {
        return {
            message: 'Note added successfully',
            accountId,
            note,
            userId,
            createdAt: new Date()
        };
    }
    async getCallHistory(accountId, user) {
        await this.findOne(accountId, user);
        return [];
    }
    async bulkUpload(file, userId) {
        if (!file.buffer) {
            throw new common_1.BadRequestException('Invalid file');
        }
        return {
            message: 'Bulk upload feature coming soon',
            summary: {
                total: 0,
                processed: 0,
                failed: 0
            }
        };
    }
    async exportToCsv(filterDto, userId) {
        try {
            const where = {};
            if (filterDto.search) {
                where.OR = [
                    { firstName: { contains: filterDto.search, mode: 'insensitive' } },
                    { lastName: { contains: filterDto.search, mode: 'insensitive' } },
                    { email: { contains: filterDto.search, mode: 'insensitive' } },
                    { accountNumber: { contains: filterDto.search, mode: 'insensitive' } },
                ];
            }
            if (filterDto.status) {
                where.status = filterDto.status;
            }
            if (filterDto.priority) {
                where.priority = filterDto.priority;
            }
            if (filterDto.agentId) {
                where.assignedAgentId = filterDto.agentId;
            }
            const accounts = await this.prisma.account.findMany({
                where,
                include: {
                    assignedAgent: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            const csvHeaders = [
                'Account Number',
                'First Name',
                'Last Name',
                'Email',
                'Original Amount',
                'Current Balance',
                'Status',
                'Priority',
                'Days Past Due',
                'Assigned Agent',
                'Created Date',
                'Last Updated'
            ];
            const csvRows = accounts.map(account => [
                account.accountNumber || '',
                account.firstName || '',
                account.lastName || '',
                account.email || '',
                account.originalAmount?.toString() || '0',
                account.currentBalance?.toString() || '0',
                account.status || '',
                account.priority || '',
                account.daysPastDue?.toString() || '0',
                account.assignedAgent ? `${account.assignedAgent.firstName} ${account.assignedAgent.lastName}` : '',
                account.createdAt ? new Date(account.createdAt).toISOString().split('T')[0] : '',
                account.updatedAt ? new Date(account.updatedAt).toISOString().split('T')[0] : ''
            ]);
            const escapeCsvField = (field) => {
                if (field.includes(',') || field.includes('"') || field.includes('\n')) {
                    return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
            };
            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.map(escapeCsvField).join(','))
            ].join('\n');
            return csvContent;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to export accounts: ${error.message}`);
        }
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map