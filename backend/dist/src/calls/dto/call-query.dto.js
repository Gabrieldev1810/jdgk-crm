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
exports.CallQueryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const create_call_dto_1 = require("./create-call.dto");
class CallQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.CallQueryDto = CallQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Account ID to filter by' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CallQueryDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Agent ID to filter by' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CallQueryDto.prototype, "agentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: create_call_dto_1.CallDirection, description: 'Call direction filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_call_dto_1.CallDirection),
    __metadata("design:type", String)
], CallQueryDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: create_call_dto_1.CallStatus, description: 'Call status filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_call_dto_1.CallStatus),
    __metadata("design:type", String)
], CallQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: create_call_dto_1.CallDisposition, description: 'Call disposition filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_call_dto_1.CallDisposition),
    __metadata("design:type", String)
], CallQueryDto.prototype, "disposition", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Start date filter (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CallQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'End date filter (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CallQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CallQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CallQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search term for account name or phone' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CallQueryDto.prototype, "search", void 0);
//# sourceMappingURL=call-query.dto.js.map