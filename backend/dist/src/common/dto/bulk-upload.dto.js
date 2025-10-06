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
exports.BulkUploadStatusDto = exports.BulkUploadErrorDto = exports.BulkUploadResultDto = exports.BulkUploadOptionsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class BulkUploadOptionsDto {
    constructor() {
        this.skipErrors = false;
        this.updateExisting = false;
    }
}
exports.BulkUploadOptionsDto = BulkUploadOptionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Skip rows with validation errors and continue processing',
        default: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BulkUploadOptionsDto.prototype, "skipErrors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Update existing accounts if duplicates found',
        default: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BulkUploadOptionsDto.prototype, "updateExisting", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Batch name for tracking uploads',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkUploadOptionsDto.prototype, "batchName", void 0);
class BulkUploadResultDto {
}
exports.BulkUploadResultDto = BulkUploadResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Upload batch ID for tracking' }),
    __metadata("design:type", String)
], BulkUploadResultDto.prototype, "batchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total rows processed' }),
    __metadata("design:type", Number)
], BulkUploadResultDto.prototype, "totalProcessed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of successful inserts' }),
    __metadata("design:type", Number)
], BulkUploadResultDto.prototype, "successCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of errors encountered' }),
    __metadata("design:type", Number)
], BulkUploadResultDto.prototype, "errorCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of duplicate records found' }),
    __metadata("design:type", Number)
], BulkUploadResultDto.prototype, "duplicateCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Processing status' }),
    __metadata("design:type", String)
], BulkUploadResultDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Processing start time' }),
    __metadata("design:type", Date)
], BulkUploadResultDto.prototype, "startedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Processing completion time' }),
    __metadata("design:type", Date)
], BulkUploadResultDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'File information' }),
    __metadata("design:type", Object)
], BulkUploadResultDto.prototype, "fileInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error details if any', required: false }),
    __metadata("design:type", Array)
], BulkUploadResultDto.prototype, "errors", void 0);
class BulkUploadErrorDto {
}
exports.BulkUploadErrorDto = BulkUploadErrorDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Row number where error occurred' }),
    __metadata("design:type", Number)
], BulkUploadErrorDto.prototype, "rowNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error message' }),
    __metadata("design:type", String)
], BulkUploadErrorDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Field that caused the error', required: false }),
    __metadata("design:type", String)
], BulkUploadErrorDto.prototype, "field", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Invalid value', required: false }),
    __metadata("design:type", Object)
], BulkUploadErrorDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Raw row data', required: false }),
    __metadata("design:type", Object)
], BulkUploadErrorDto.prototype, "rowData", void 0);
class BulkUploadStatusDto {
}
exports.BulkUploadStatusDto = BulkUploadStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Upload batch ID' }),
    __metadata("design:type", String)
], BulkUploadStatusDto.prototype, "batchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current processing status' }),
    __metadata("design:type", String)
], BulkUploadStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Progress percentage (0-100)' }),
    __metadata("design:type", Number)
], BulkUploadStatusDto.prototype, "progress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current processing message' }),
    __metadata("design:type", String)
], BulkUploadStatusDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Processed rows count' }),
    __metadata("design:type", Number)
], BulkUploadStatusDto.prototype, "processedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total rows to process' }),
    __metadata("design:type", Number)
], BulkUploadStatusDto.prototype, "totalCount", void 0);
//# sourceMappingURL=bulk-upload.dto.js.map