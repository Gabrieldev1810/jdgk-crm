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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkUploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const bulk_upload_service_1 = require("./bulk-upload.service");
const multer = require("multer");
let BulkUploadController = class BulkUploadController {
    constructor(bulkUploadService) {
        this.bulkUploadService = bulkUploadService;
    }
    async uploadFile(file, options, req) {
        if (!file) {
            return {
                success: false,
                message: 'No file uploaded',
            };
        }
        try {
            const result = await this.bulkUploadService.processUpload(file, req.user.id, options);
            return {
                success: true,
                message: 'File processed successfully',
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message,
                error: error.name,
            };
        }
    }
    async getBatchStatus(batchId) {
        try {
            const batch = await this.bulkUploadService.getBatchStatus(batchId);
            return {
                success: true,
                data: batch,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
    async getBatchHistory(req, page = 1, limit = 10, all) {
        try {
            const userId = all === 'true' ? undefined : req.user.id;
            const history = await this.bulkUploadService.getBatchHistory(userId, page, limit);
            return {
                success: true,
                data: history,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
    getTemplate() {
        return {
            success: true,
            message: 'CSV template structure',
            data: {
                requiredFields: [
                    'accountNumber',
                    'firstName',
                    'lastName',
                    'originalAmount',
                    'currentBalance'
                ],
                optionalFields: [
                    'email',
                    'address1',
                    'address2',
                    'city',
                    'state',
                    'zipCode',
                    'country',
                    'amountPaid',
                    'interestRate',
                    'lastPaymentDate',
                    'lastPaymentAmount',
                    'status',
                    'priority',
                    'preferredContactMethod',
                    'bestTimeToCall',
                    'timezone',
                    'language',
                    'daysPastDue',
                    'lastContactDate',
                    'nextContactDate',
                    'doNotCall',
                    'disputeFlag',
                    'bankruptcyFlag',
                    'deceasedFlag',
                    'notes',
                    'source'
                ],
                sampleCSV: `accountNumber,firstName,lastName,email,originalAmount,currentBalance,status,priority
ACC001,John,Doe,john.doe@email.com,1000.00,850.00,ACTIVE,HIGH
ACC002,Jane,Smith,jane.smith@email.com,2500.00,2200.00,NEW,MEDIUM`,
                fieldDescriptions: {
                    accountNumber: 'Unique account identifier (required)',
                    firstName: 'Customer first name (required)',
                    lastName: 'Customer last name (required)',
                    originalAmount: 'Original debt amount (required, number)',
                    currentBalance: 'Current outstanding balance (required, number)',
                    status: 'Account status (NEW, ACTIVE, CLOSED, DISPUTED, PAID)',
                    priority: 'Collection priority (LOW, MEDIUM, HIGH, URGENT)',
                    email: 'Customer email address',
                }
            }
        };
    }
};
exports.BulkUploadController = BulkUploadController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
        fileFilter: (req, file, callback) => {
            const allowedTypes = [
                'text/csv',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            const allowedExtensions = ['.csv', '.xls', '.xlsx'];
            const hasValidType = allowedTypes.includes(file.mimetype);
            const hasValidExtension = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));
            if (hasValidType || hasValidExtension) {
                callback(null, true);
            }
            else {
                callback(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], BulkUploadController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)('batch/:batchId'),
    __param(0, (0, common_1.Param)('batchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BulkUploadController.prototype, "getBatchStatus", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('all')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String]),
    __metadata("design:returntype", Promise)
], BulkUploadController.prototype, "getBatchHistory", null);
__decorate([
    (0, common_1.Get)('template'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BulkUploadController.prototype, "getTemplate", null);
exports.BulkUploadController = BulkUploadController = __decorate([
    (0, common_1.Controller)('bulk-upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [bulk_upload_service_1.BulkUploadService])
], BulkUploadController);
//# sourceMappingURL=bulk-upload.controller.js.map