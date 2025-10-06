export declare enum CallDirection {
    INBOUND = "INBOUND",
    OUTBOUND = "OUTBOUND"
}
export declare enum CallStatus {
    RINGING = "RINGING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    BUSY = "BUSY",
    NO_ANSWER = "NO_ANSWER",
    CANCELLED = "CANCELLED"
}
export declare enum CallDisposition {
    CONTACT_MADE = "CONTACT_MADE",
    LEFT_MESSAGE = "LEFT_MESSAGE",
    NO_ANSWER = "NO_ANSWER",
    BUSY = "BUSY",
    WRONG_NUMBER = "WRONG_NUMBER",
    DISCONNECTED = "DISCONNECTED",
    PROMISE_TO_PAY = "PROMISE_TO_PAY",
    PAYMENT_MADE = "PAYMENT_MADE",
    CALLBACK_REQUESTED = "CALLBACK_REQUESTED",
    DO_NOT_CALL = "DO_NOT_CALL",
    DISPUTE = "DISPUTE"
}
export declare class CreateCallDto {
    accountId: string;
    accountPhoneId?: string;
    agentId: string;
    direction: CallDirection;
    startTime: string;
    endTime?: string;
    duration?: number;
    status: CallStatus;
    disposition?: CallDisposition;
    notes?: string;
    followUpDate?: string;
    amountPromised?: number;
    amountCollected?: number;
    recordingPath?: string;
    callerId?: string;
    campaignId?: string;
}
