import { PrismaService } from '../prisma/prisma.service';
export interface BulkUploadResult {
    batchId: string;
    status: 'processing' | 'completed' | 'failed';
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    errors: BulkUploadError[];
    duplicates: number;
    message: string;
}
export interface BulkUploadError {
    row: number;
    field?: string;
    message: string;
    data?: any;
}
export interface BulkUploadOptions {
    batchName?: string;
    skipErrors?: boolean;
    updateExisting?: boolean;
}
export declare class BulkUploadService {
    private prisma;
    constructor(prisma: PrismaService);
    processUpload(file: Express.Multer.File, userId: string, options?: BulkUploadOptions): Promise<BulkUploadResult>;
    private parseFile;
    private parseCsvFile;
    private parseExcelFile;
    private processRecords;
    private validateAndTransformRecord;
    getBatchStatus(batchId: string): Promise<any>;
    getBatchHistory(userId?: string, page?: number, limit?: number): Promise<any>;
}
