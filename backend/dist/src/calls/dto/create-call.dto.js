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
exports.CreateCallDto = exports.CallDisposition = exports.CallStatus = exports.CallDirection = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var CallDirection;
(function (CallDirection) {
    CallDirection["INBOUND"] = "INBOUND";
    CallDirection["OUTBOUND"] = "OUTBOUND";
})(CallDirection || (exports.CallDirection = CallDirection = {}));
var CallStatus;
(function (CallStatus) {
    CallStatus["RINGING"] = "RINGING";
    CallStatus["IN_PROGRESS"] = "IN_PROGRESS";
    CallStatus["COMPLETED"] = "COMPLETED";
    CallStatus["FAILED"] = "FAILED";
    CallStatus["BUSY"] = "BUSY";
    CallStatus["NO_ANSWER"] = "NO_ANSWER";
    CallStatus["CANCELLED"] = "CANCELLED";
})(CallStatus || (exports.CallStatus = CallStatus = {}));
var CallDisposition;
(function (CallDisposition) {
    CallDisposition["CONTACT_MADE"] = "CONTACT_MADE";
    CallDisposition["LEFT_MESSAGE"] = "LEFT_MESSAGE";
    CallDisposition["NO_ANSWER"] = "NO_ANSWER";
    CallDisposition["BUSY"] = "BUSY";
    CallDisposition["WRONG_NUMBER"] = "WRONG_NUMBER";
    CallDisposition["DISCONNECTED"] = "DISCONNECTED";
    CallDisposition["PROMISE_TO_PAY"] = "PROMISE_TO_PAY";
    CallDisposition["PAYMENT_MADE"] = "PAYMENT_MADE";
    CallDisposition["CALLBACK_REQUESTED"] = "CALLBACK_REQUESTED";
    CallDisposition["DO_NOT_CALL"] = "DO_NOT_CALL";
    CallDisposition["DISPUTE"] = "DISPUTE";
})(CallDisposition || (exports.CallDisposition = CallDisposition = {}));
class CreateCallDto {
}
exports.CreateCallDto = CreateCallDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Account ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCallDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Account phone ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCallDto.prototype, "accountPhoneId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Agent ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCallDto.prototype, "agentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: CallDirection, description: 'Call direction' }),
    (0, class_validator_1.IsEnum)(CallDirection),
    __metadata("design:type", String)
], CreateCallDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Call start time' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCallDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Call end time' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCallDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Call duration in seconds' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCallDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: CallStatus, description: 'Call status' }),
    (0, class_validator_1.IsEnum)(CallStatus),
    __metadata("design:type", String)
], CreateCallDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: CallDisposition, description: 'Call disposition' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CallDisposition),
    __metadata("design:type", String)
], CreateCallDto.prototype, "disposition", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Call notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCallDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Follow up date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCallDto.prototype, "followUpDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Amount promised by customer' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCallDto.prototype, "amountPromised", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Amount collected during call' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCallDto.prototype, "amountCollected", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Recording file path' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCallDto.prototype, "recordingPath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Caller ID used' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCallDto.prototype, "callerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Campaign ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCallDto.prototype, "campaignId", void 0);
//# sourceMappingURL=create-call.dto.js.map