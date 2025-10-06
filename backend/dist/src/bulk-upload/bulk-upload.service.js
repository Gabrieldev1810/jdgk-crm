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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkUploadService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const stream_1 = require("stream");
let BulkUploadService = class BulkUploadService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processUpload(file, userId, options = {}) {
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            const uploadBatch = await this.prisma.uploadBatch.create({
                data: {
                    id: batchId,
                    filename: file.originalname,
                    originalFilename: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype || 'application/octet-stream',
                    status: 'PROCESSING',
                    totalRecords: 0,
                    processedRecords: 0,
                    successCount: 0,
                    errorCount: 0,
                    skipCount: 0,
                    duplicateCount: 0,
                    uploadedById: userId,
                    batchName: options.batchName || `Upload ${new Date().toLocaleDateString()}`,
                    skipErrors: options.skipErrors ?? false,
                    updateExisting: options.updateExisting ?? false,
                    processingStarted: new Date(),
                }
            });
            const records = await this.parseFile(file);
            await this.prisma.uploadBatch.update({
                where: { id: batchId },
                data: { totalRecords: records.length }
            });
            const result = await this.processRecords(records, batchId, userId, options);
            await this.prisma.uploadBatch.update({
                where: { id: batchId },
                data: {
                    status: result.failedRecords === result.totalRecords ? 'FAILED' : 'COMPLETED',
                    processedRecords: result.totalRecords,
                    successCount: result.successfulRecords,
                    errorCount: result.failedRecords,
                    duplicateCount: result.duplicates,
                    errorLog: JSON.stringify(result.errors),
                    processingCompleted: new Date(),
                }
            });
            return result;
        }
        catch (error) {
            await this.prisma.uploadBatch.update({
                where: { id: batchId },
                data: {
                    status: 'FAILED',
                    errorLog: JSON.stringify([{ row: 0, message: error.message }]),
                    processingCompleted: new Date(),
                }
            }).catch(() => { });
            throw new common_1.InternalServerErrorException(`Upload processing failed: ${error.message}`);
        }
    }
    async parseFile(file) {
        const records = [];
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            return this.parseCsvFile(file);
        }
        else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.originalname.endsWith('.xlsx') ||
            file.originalname.endsWith('.xls')) {
            return this.parseExcelFile(file);
        }
        else {
            throw new common_1.BadRequestException('Unsupported file type. Please upload CSV or Excel files.');
        }
    }
    async parseCsvFile(file) {
        return new Promise((resolve, reject) => {
            const records = [];
            const stream = stream_1.Readable.from(file.buffer);
            stream
                .pipe(csv())
                .on('data', (data) => records.push(data))
                .on('end', () => resolve(records))
                .on('error', (error) => reject(error));
        });
    }
    async parseExcelFile(file) {
        try {
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            return XLSX.utils.sheet_to_json(worksheet);
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to parse Excel file');
        }
    }
    async processRecords(records, batchId, userId, options) {
        const result = {
            batchId,
            status: 'processing',
            totalRecords: records.length,
            successfulRecords: 0,
            failedRecords: 0,
            errors: [],
            duplicates: 0,
            message: 'Processing records...'
        };
        const accountsToCreate = [];
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const rowNumber = i + 1;
            try {
                const validatedRecord = this.validateAndTransformRecord(record, rowNumber);
                if (validatedRecord.errors.length > 0) {
                    result.errors.push(...validatedRecord.errors);
                    if (!options.skipErrors) {
                        result.failedRecords++;
                        continue;
                    }
                }
                const existingAccount = await this.prisma.account.findUnique({
                    where: { accountNumber: validatedRecord.data.accountNumber }
                });
                if (existingAccount) {
                    result.duplicates++;
                    if (options.updateExisting) {
                        await this.prisma.account.update({
                            where: { accountNumber: validatedRecord.data.accountNumber },
                            data: {
                                firstName: validatedRecord.data.firstName,
                                lastName: validatedRecord.data.lastName,
                                fullName: validatedRecord.data.fullName,
                                email: validatedRecord.data.email,
                                address1: validatedRecord.data.address1,
                                address2: validatedRecord.data.address2,
                                city: validatedRecord.data.city,
                                state: validatedRecord.data.state,
                                zipCode: validatedRecord.data.zipCode,
                                country: validatedRecord.data.country,
                                originalAmount: validatedRecord.data.originalAmount,
                                currentBalance: validatedRecord.data.currentBalance,
                                amountPaid: validatedRecord.data.amountPaid,
                                interestRate: validatedRecord.data.interestRate,
                                status: validatedRecord.data.status,
                                priority: validatedRecord.data.priority,
                                preferredContactMethod: validatedRecord.data.preferredContactMethod,
                                bestTimeToCall: validatedRecord.data.bestTimeToCall,
                                timezone: validatedRecord.data.timezone,
                                language: validatedRecord.data.language,
                                daysPastDue: validatedRecord.data.daysPastDue,
                                doNotCall: validatedRecord.data.doNotCall,
                                disputeFlag: validatedRecord.data.disputeFlag,
                                bankruptcyFlag: validatedRecord.data.bankruptcyFlag,
                                deceasedFlag: validatedRecord.data.deceasedFlag,
                                notes: validatedRecord.data.notes,
                                source: validatedRecord.data.source,
                                batchId,
                                updatedAt: new Date(),
                            }
                        });
                        result.successfulRecords++;
                    }
                    else {
                        result.errors.push({
                            row: rowNumber,
                            message: `Account ${validatedRecord.data.accountNumber} already exists`
                        });
                        result.failedRecords++;
                    }
                }
                else {
                    accountsToCreate.push({
                        ...validatedRecord.data,
                        batchId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }
            catch (error) {
                result.errors.push({
                    row: rowNumber,
                    message: error.message,
                    data: record
                });
                result.failedRecords++;
            }
        }
        if (accountsToCreate.length > 0) {
            try {
                await this.prisma.account.createMany({
                    data: accountsToCreate,
                });
                result.successfulRecords += accountsToCreate.length;
            }
            catch (error) {
                result.errors.push({
                    row: 0,
                    message: `Bulk insert failed: ${error.message}`
                });
                result.failedRecords += accountsToCreate.length;
            }
        }
        result.status = result.failedRecords === 0 ? 'completed' : 'failed';
        result.message = `Processed ${result.totalRecords} records. ${result.successfulRecords} successful, ${result.failedRecords} failed.`;
        return result;
    }
    validateAndTransformRecord(record, rowNumber) {
        const errors = [];
        const data = {};
        if (!record.accountNumber && !record.account_number) {
            errors.push({ row: rowNumber, field: 'accountNumber', message: 'Account number is required' });
        }
        else {
            data.accountNumber = record.accountNumber || record.account_number;
        }
        if (!record.firstName && !record.first_name) {
            errors.push({ row: rowNumber, field: 'firstName', message: 'First name is required' });
        }
        else {
            data.firstName = record.firstName || record.first_name;
        }
        if (!record.lastName && !record.last_name) {
            errors.push({ row: rowNumber, field: 'lastName', message: 'Last name is required' });
        }
        else {
            data.lastName = record.lastName || record.last_name;
        }
        data.fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        const originalAmount = parseFloat(record.originalAmount || record.original_amount || '0');
        const currentBalance = parseFloat(record.currentBalance || record.current_balance || originalAmount || '0');
        if (isNaN(originalAmount) || originalAmount < 0) {
            errors.push({ row: rowNumber, field: 'originalAmount', message: 'Original amount must be a positive number' });
        }
        else {
            data.originalAmount = originalAmount;
        }
        if (isNaN(currentBalance) || currentBalance < 0) {
            errors.push({ row: rowNumber, field: 'currentBalance', message: 'Current balance must be a positive number' });
        }
        else {
            data.currentBalance = currentBalance;
        }
        data.email = record.email || null;
        data.address1 = record.address1 || record.address || null;
        data.address2 = record.address2 || null;
        data.city = record.city || null;
        data.state = record.state || null;
        data.zipCode = record.zipCode || record.zip_code || record.zip || null;
        data.country = record.country || 'US';
        data.amountPaid = parseFloat(record.amountPaid || record.amount_paid || '0') || 0;
        data.interestRate = parseFloat(record.interestRate || record.interest_rate || '0') || null;
        data.status = (record.status || 'NEW').toUpperCase();
        data.priority = (record.priority || 'MEDIUM').toUpperCase();
        data.preferredContactMethod = record.preferredContactMethod || record.preferred_contact_method || 'PHONE';
        data.bestTimeToCall = record.bestTimeToCall || record.best_time_to_call || null;
        data.timezone = record.timezone || 'EST';
        data.language = record.language || 'EN';
        data.daysPastDue = parseInt(record.daysPastDue || record.days_past_due || '0') || 0;
        data.doNotCall = Boolean(record.doNotCall || record.do_not_call || false);
        data.disputeFlag = Boolean(record.disputeFlag || record.dispute_flag || false);
        data.bankruptcyFlag = Boolean(record.bankruptcyFlag || record.bankruptcy_flag || false);
        data.deceasedFlag = Boolean(record.deceasedFlag || record.deceased_flag || false);
        data.notes = record.notes || null;
        data.source = record.source || 'BULK_UPLOAD';
        if (record.lastPaymentDate || record.last_payment_date) {
            const lastPaymentDate = new Date(record.lastPaymentDate || record.last_payment_date);
            if (!isNaN(lastPaymentDate.getTime())) {
                data.lastPaymentDate = lastPaymentDate;
                data.lastPaymentAmount = parseFloat(record.lastPaymentAmount || record.last_payment_amount || '0') || null;
            }
        }
        if (record.lastContactDate || record.last_contact_date) {
            const lastContactDate = new Date(record.lastContactDate || record.last_contact_date);
            if (!isNaN(lastContactDate.getTime())) {
                data.lastContactDate = lastContactDate;
            }
        }
        if (record.nextContactDate || record.next_contact_date) {
            const nextContactDate = new Date(record.nextContactDate || record.next_contact_date);
            if (!isNaN(nextContactDate.getTime())) {
                data.nextContactDate = nextContactDate;
            }
        }
        return { data, errors };
    }
    async getBatchStatus(batchId) {
        const batch = await this.prisma.uploadBatch.findUnique({
            where: { id: batchId },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        if (!batch) {
            throw new common_1.BadRequestException('Upload batch not found');
        }
        return {
            ...batch,
            errors: batch.errorLog ? JSON.parse(batch.errorLog) : []
        };
    }
    async getBatchHistory(userId, page = 1, limit = 10) {
        const where = userId ? { uploadedById: userId } : {};
        const offset = (page - 1) * limit;
        const [batches, total] = await Promise.all([
            this.prisma.uploadBatch.findMany({
                where,
                include: {
                    uploadedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.uploadBatch.count({ where })
        ]);
        return {
            batches: batches.map(batch => ({
                ...batch,
                errors: batch.errorLog ? JSON.parse(batch.errorLog) : []
            })),
            total,
            page,
            pages: Math.ceil(total / limit)
        };
    }
};
exports.BulkUploadService = BulkUploadService;
exports.BulkUploadService = BulkUploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BulkUploadService);
//# sourceMappingURL=bulk-upload.service.js.map