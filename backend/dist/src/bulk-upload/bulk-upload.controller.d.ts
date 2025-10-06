import { Request } from 'express';
import { BulkUploadService, BulkUploadOptions } from './bulk-upload.service';
export declare class BulkUploadController {
    private readonly bulkUploadService;
    constructor(bulkUploadService: BulkUploadService);
    uploadFile(file: Express.Multer.File, options: BulkUploadOptions, req: Request & {
        user: any;
    }): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        data: import("./bulk-upload.service").BulkUploadResult;
        error?: undefined;
    } | {
        success: boolean;
        message: any;
        error: any;
        data?: undefined;
    }>;
    getBatchStatus(batchId: string): Promise<{
        success: boolean;
        data: any;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
    getBatchHistory(req: Request & {
        user: any;
    }, page?: number, limit?: number, all?: string): Promise<{
        success: boolean;
        data: any;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
    getTemplate(): {
        success: boolean;
        message: string;
        data: {
            requiredFields: string[];
            optionalFields: string[];
            sampleCSV: string;
            fieldDescriptions: {
                accountNumber: string;
                firstName: string;
                lastName: string;
                originalAmount: string;
                currentBalance: string;
                status: string;
                priority: string;
                email: string;
            };
        };
    };
}
