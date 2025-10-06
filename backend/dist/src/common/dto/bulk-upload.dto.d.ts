export declare class BulkUploadOptionsDto {
    skipErrors?: boolean;
    updateExisting?: boolean;
    batchName?: string;
}
export declare class BulkUploadResultDto {
    batchId: string;
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    duplicateCount: number;
    status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
    startedAt: Date;
    completedAt: Date;
    fileInfo: {
        originalName: string;
        size: number;
        mimeType: string;
    };
    errors?: BulkUploadErrorDto[];
}
export declare class BulkUploadErrorDto {
    rowNumber: number;
    message: string;
    field?: string;
    value?: any;
    rowData?: Record<string, any>;
}
export declare class BulkUploadStatusDto {
    batchId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress: number;
    message: string;
    processedCount: number;
    totalCount: number;
}
