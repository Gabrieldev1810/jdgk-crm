import { PrismaService } from '../prisma/prisma.service';
import { CreateCallDto, UpdateCallDto, CallQueryDto, CallResponseDto } from './dto';
export declare class CallsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createCallDto: CreateCallDto): Promise<CallResponseDto>;
    findAll(query: CallQueryDto): Promise<{
        data: CallResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<CallResponseDto>;
    findByAccount(accountId: string, query: Omit<CallQueryDto, 'accountId'>): Promise<{
        data: CallResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    update(id: string, updateCallDto: UpdateCallDto): Promise<CallResponseDto>;
    remove(id: string): Promise<{
        message: string;
        id: string;
    }>;
    getCallStatistics(accountId?: string): Promise<{
        totalCalls: number;
        completedCalls: number;
        avgDuration: number;
        successRate: number;
        dispositionBreakdown: Record<string, number>;
    }>;
}
