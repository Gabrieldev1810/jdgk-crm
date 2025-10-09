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
    initiateCall(initiateCallDto: {
        phoneNumber: string;
        agentId: string;
        accountId: string;
    }): Promise<any>;
    hangupCall(callId: string): Promise<any>;
    getCallStatus(callId: string): Promise<any>;
    getRecording(id: string): Promise<any>;
    uploadRecording(id: string, recordingData: {
        recordingUrl: string;
    }): Promise<any>;
}
