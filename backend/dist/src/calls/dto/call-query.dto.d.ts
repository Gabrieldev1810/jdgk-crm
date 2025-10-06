import { CallDirection, CallStatus, CallDisposition } from './create-call.dto';
export declare class CallQueryDto {
    accountId?: string;
    agentId?: string;
    direction?: CallDirection;
    status?: CallStatus;
    disposition?: CallDisposition;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    search?: string;
}
