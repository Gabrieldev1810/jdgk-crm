import { CallsService } from './calls.service';
import { CreateCallDto, UpdateCallDto, CallQueryDto, CallResponseDto } from './dto';
export declare class CallsController {
    private readonly callsService;
    constructor(callsService: CallsService);
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
    getStatistics(accountId?: string): Promise<{
        totalCalls: number;
        completedCalls: number;
        avgDuration: number;
        successRate: number;
        dispositionBreakdown: Record<string, number>;
    }>;
    findByAccount(accountId: string, query: Omit<CallQueryDto, 'accountId'>): Promise<{
        data: CallResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<CallResponseDto>;
    update(id: string, updateCallDto: UpdateCallDto): Promise<CallResponseDto>;
    remove(id: string): Promise<{
        message: string;
        id: string;
    }>;
}
