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
exports.CallsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const calls_service_1 = require("./calls.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let CallsController = class CallsController {
    constructor(callsService) {
        this.callsService = callsService;
    }
    async create(createCallDto) {
        return this.callsService.create(createCallDto);
    }
    async findAll(query) {
        return this.callsService.findAll(query);
    }
    async getStatistics(accountId) {
        return this.callsService.getCallStatistics(accountId);
    }
    async findByAccount(accountId, query) {
        return this.callsService.findByAccount(accountId, query);
    }
    async findOne(id) {
        return this.callsService.findOne(id);
    }
    async update(id, updateCallDto) {
        return this.callsService.update(id, updateCallDto);
    }
    async remove(id) {
        return this.callsService.remove(id);
    }
    async initiateCall(initiateCallDto) {
        return this.callsService.initiateVicidialCall(initiateCallDto.phoneNumber, initiateCallDto.agentId, initiateCallDto.accountId);
    }
    async hangupCall(callId) {
        return this.callsService.hangupVicidialCall(callId);
    }
    async getCallStatus(callId) {
        return this.callsService.getVicidialCallStatus(callId);
    }
    async getRecording(id) {
        return this.callsService.getCallRecording(id);
    }
    async uploadRecording(id, recordingData) {
        return this.callsService.updateCallRecording(id, recordingData.recordingUrl);
    }
};
exports.CallsController = CallsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new call record' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Call record created successfully',
        type: dto_1.CallResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Account or Agent not found',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateCallDto]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all call records with filtering and pagination' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Call records retrieved successfully',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CallQueryDto]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get call statistics' }),
    (0, swagger_1.ApiQuery)({ name: 'accountId', required: false, description: 'Filter statistics by account ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Call statistics retrieved successfully',
    }),
    __param(0, (0, common_1.Query)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('account/:accountId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get call history for a specific account' }),
    (0, swagger_1.ApiParam)({ name: 'accountId', description: 'Account ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Account call history retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Account not found',
    }),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "findByAccount", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific call record' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Call ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Call record retrieved successfully',
        type: dto_1.CallResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Call not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a call record' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Call ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Call record updated successfully',
        type: dto_1.CallResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Call not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCallDto]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a call record' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Call ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Call record deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Call not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('vicidial/initiate'),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate a call through VICIdial' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Call initiated successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "initiateCall", null);
__decorate([
    (0, common_1.Post)('vicidial/hangup/:callId'),
    (0, swagger_1.ApiOperation)({ summary: 'Hangup a VICIdial call' }),
    (0, swagger_1.ApiParam)({ name: 'callId', description: 'Call ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Call ended successfully',
    }),
    __param(0, (0, common_1.Param)('callId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "hangupCall", null);
__decorate([
    (0, common_1.Get)('vicidial/status/:callId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get VICIdial call status' }),
    (0, swagger_1.ApiParam)({ name: 'callId', description: 'Call ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Call status retrieved successfully',
    }),
    __param(0, (0, common_1.Param)('callId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "getCallStatus", null);
__decorate([
    (0, common_1.Get)(':id/recording'),
    (0, swagger_1.ApiOperation)({ summary: 'Get call recording' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Call ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Call recording retrieved successfully',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "getRecording", null);
__decorate([
    (0, common_1.Post)(':id/recording'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload call recording' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Call ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Call recording uploaded successfully',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "uploadRecording", null);
exports.CallsController = CallsController = __decorate([
    (0, swagger_1.ApiTags)('calls'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('calls'),
    __metadata("design:paramtypes", [calls_service_1.CallsService])
], CallsController);
//# sourceMappingURL=calls.controller.js.map