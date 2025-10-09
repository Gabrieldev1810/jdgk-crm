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
exports.CallsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CallsService = class CallsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCallDto) {
        const account = await this.prisma.account.findUnique({
            where: { id: createCallDto.accountId },
        });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        const agent = await this.prisma.user.findUnique({
            where: { id: createCallDto.agentId },
        });
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found');
        }
        if (createCallDto.accountPhoneId) {
            const accountPhone = await this.prisma.accountPhone.findFirst({
                where: {
                    id: createCallDto.accountPhoneId,
                    accountId: createCallDto.accountId,
                },
            });
            if (!accountPhone) {
                throw new common_1.NotFoundException('Account phone not found or does not belong to account');
            }
        }
        const call = await this.prisma.call.create({
            data: {
                ...createCallDto,
                startTime: new Date(createCallDto.startTime),
                endTime: createCallDto.endTime ? new Date(createCallDto.endTime) : null,
                followUpDate: createCallDto.followUpDate ? new Date(createCallDto.followUpDate) : null,
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                account: {
                    select: {
                        id: true,
                        accountNumber: true,
                        fullName: true,
                    },
                },
                accountPhone: {
                    select: {
                        id: true,
                        phoneNumber: true,
                        phoneType: true,
                    },
                },
            },
        });
        await this.prisma.account.update({
            where: { id: createCallDto.accountId },
            data: {
                lastContactDate: new Date(createCallDto.startTime),
                contactAttempts: { increment: 1 },
            },
        });
        return call;
    }
    async findAll(query) {
        const { page = 1, limit = 20, search, startDate, endDate, ...filters } = query;
        const skip = (page - 1) * limit;
        const where = {
            ...filters,
            ...(startDate && {
                startTime: {
                    gte: new Date(startDate),
                },
            }),
            ...(endDate && {
                startTime: {
                    lte: new Date(endDate + 'T23:59:59.999Z'),
                },
            }),
            ...(search && {
                OR: [
                    {
                        account: {
                            fullName: {
                                contains: search,
                            },
                        },
                    },
                    {
                        account: {
                            accountNumber: {
                                contains: search,
                            },
                        },
                    },
                    {
                        accountPhone: {
                            phoneNumber: {
                                contains: search,
                            },
                        },
                    },
                ],
            }),
        };
        const [calls, total] = await Promise.all([
            this.prisma.call.findMany({
                where,
                skip,
                take: limit,
                orderBy: { startTime: 'desc' },
                include: {
                    agent: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    account: {
                        select: {
                            id: true,
                            accountNumber: true,
                            fullName: true,
                        },
                    },
                    accountPhone: {
                        select: {
                            id: true,
                            phoneNumber: true,
                            phoneType: true,
                        },
                    },
                },
            }),
            this.prisma.call.count({ where }),
        ]);
        return {
            data: calls,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const call = await this.prisma.call.findUnique({
            where: { id },
            include: {
                agent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                account: {
                    select: {
                        id: true,
                        accountNumber: true,
                        fullName: true,
                    },
                },
                accountPhone: {
                    select: {
                        id: true,
                        phoneNumber: true,
                        phoneType: true,
                    },
                },
            },
        });
        if (!call) {
            throw new common_1.NotFoundException('Call not found');
        }
        return call;
    }
    async findByAccount(accountId, query) {
        const account = await this.prisma.account.findUnique({
            where: { id: accountId },
        });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        return this.findAll({ ...query, accountId });
    }
    async update(id, updateCallDto) {
        const existingCall = await this.prisma.call.findUnique({
            where: { id },
        });
        if (!existingCall) {
            throw new common_1.NotFoundException('Call not found');
        }
        const call = await this.prisma.call.update({
            where: { id },
            data: {
                ...updateCallDto,
                ...(updateCallDto.startTime && { startTime: new Date(updateCallDto.startTime) }),
                ...(updateCallDto.endTime && { endTime: new Date(updateCallDto.endTime) }),
                ...(updateCallDto.followUpDate && { followUpDate: new Date(updateCallDto.followUpDate) }),
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                account: {
                    select: {
                        id: true,
                        accountNumber: true,
                        fullName: true,
                    },
                },
                accountPhone: {
                    select: {
                        id: true,
                        phoneNumber: true,
                        phoneType: true,
                    },
                },
            },
        });
        return call;
    }
    async remove(id) {
        const call = await this.prisma.call.findUnique({
            where: { id },
        });
        if (!call) {
            throw new common_1.NotFoundException('Call not found');
        }
        await this.prisma.call.delete({
            where: { id },
        });
        return { message: 'Call deleted successfully', id };
    }
    async getCallStatistics(accountId) {
        const where = accountId ? { accountId } : {};
        const [totalCalls, completedCalls, avgDurationResult, dispositions] = await Promise.all([
            this.prisma.call.count({ where }),
            this.prisma.call.count({
                where: { ...where, status: 'COMPLETED' }
            }),
            this.prisma.call.aggregate({
                where: { ...where, duration: { not: null } },
                _avg: { duration: true },
            }),
            this.prisma.call.groupBy({
                by: ['disposition'],
                where,
                _count: { disposition: true },
            }),
        ]);
        const avgDuration = avgDurationResult._avg.duration || 0;
        const successRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
        const dispositionBreakdown = dispositions.reduce((acc, item) => {
            acc[item.disposition || 'NO_DISPOSITION'] = item._count.disposition;
            return acc;
        }, {});
        return {
            totalCalls,
            completedCalls,
            avgDuration: Math.round(avgDuration),
            successRate: Math.round(successRate * 100) / 100,
            dispositionBreakdown,
        };
    }
    async initiateVicidialCall(phoneNumber, agentId, accountId) {
        try {
            const call = await this.prisma.call.create({
                data: {
                    accountId,
                    agentId,
                    direction: 'OUTBOUND',
                    status: 'IN_PROGRESS',
                    disposition: 'PENDING',
                    startTime: new Date(),
                },
                include: {
                    agent: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    account: {
                        select: {
                            id: true,
                            accountNumber: true,
                            fullName: true,
                        },
                    },
                },
            });
            return {
                success: true,
                message: 'Call initiated successfully',
                callId: call.id,
                vicidialCallId: `VICI_${Date.now()}`,
                data: call,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to initiate call: ${error.message}`);
        }
    }
    async hangupVicidialCall(callId) {
        try {
            const call = await this.prisma.call.findUnique({
                where: { id: callId },
            });
            if (!call) {
                throw new common_1.NotFoundException('Call not found');
            }
            const updatedCall = await this.prisma.call.update({
                where: { id: callId },
                data: {
                    status: 'COMPLETED',
                    endTime: new Date(),
                    duration: call.startTime ? Math.floor((new Date().getTime() - call.startTime.getTime()) / 1000) : 0,
                },
            });
            return {
                success: true,
                message: 'Call ended successfully',
                data: updatedCall,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to hangup call: ${error.message}`);
        }
    }
    async getVicidialCallStatus(callId) {
        try {
            const call = await this.prisma.call.findUnique({
                where: { id: callId },
                include: {
                    agent: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    account: {
                        select: {
                            id: true,
                            accountNumber: true,
                            fullName: true,
                        },
                    },
                },
            });
            if (!call) {
                throw new common_1.NotFoundException('Call not found');
            }
            return {
                success: true,
                message: 'Call status retrieved',
                data: {
                    ...call,
                    vicidialStatus: 'ACTIVE',
                    estimatedDuration: call.startTime ? Math.floor((new Date().getTime() - call.startTime.getTime()) / 1000) : 0,
                },
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to get call status: ${error.message}`);
        }
    }
    async getCallRecording(callId) {
        try {
            const call = await this.prisma.call.findUnique({
                where: { id: callId },
                select: { recordingPath: true, id: true },
            });
            if (!call) {
                throw new common_1.NotFoundException('Call not found');
            }
            if (!call.recordingPath) {
                throw new common_1.NotFoundException('Recording not found for this call');
            }
            return {
                success: true,
                message: 'Recording retrieved',
                recordingPath: call.recordingPath,
                callId: call.id,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to get recording: ${error.message}`);
        }
    }
    async updateCallRecording(callId, recordingUrl) {
        try {
            const call = await this.prisma.call.findUnique({
                where: { id: callId },
            });
            if (!call) {
                throw new common_1.NotFoundException('Call not found');
            }
            const updatedCall = await this.prisma.call.update({
                where: { id: callId },
                data: { recordingPath: recordingUrl },
                include: {
                    agent: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    account: {
                        select: {
                            id: true,
                            accountNumber: true,
                            fullName: true,
                        },
                    },
                },
            });
            return {
                success: true,
                message: 'Recording updated successfully',
                data: updatedCall,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to update recording: ${error.message}`);
        }
    }
};
exports.CallsService = CallsService;
exports.CallsService = CallsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CallsService);
//# sourceMappingURL=calls.service.js.map