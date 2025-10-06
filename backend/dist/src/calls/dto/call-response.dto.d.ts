import { CallDirection, CallStatus, CallDisposition } from './create-call.dto';
export declare class CallResponseDto {
    id: string;
    accountId: string;
    accountPhoneId?: string;
    agentId: string;
    direction: CallDirection;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    status: CallStatus;
    disposition?: CallDisposition;
    notes?: string;
    followUpDate?: Date;
    amountPromised?: number;
    amountCollected?: number;
    recordingPath?: string;
    callerId?: string;
    campaignId?: string;
    createdAt: Date;
    updatedAt: Date;
    agent?: {
        id: string;
        firstName?: string;
        lastName?: string;
        email: string;
    };
    account?: {
        id: string;
        accountNumber: string;
        fullName: string;
    };
    accountPhone?: {
        id: string;
        phoneNumber: string;
        phoneType: string;
    };
}
