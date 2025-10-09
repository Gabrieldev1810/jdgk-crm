import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { CreateCallDto, UpdateCallDto, CallQueryDto, CallResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new call record' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Call record created successfully',
    type: CallResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account or Agent not found',
  })
  async create(@Body() createCallDto: CreateCallDto): Promise<CallResponseDto> {
    return this.callsService.create(createCallDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all call records with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Call records retrieved successfully',
  })
  async findAll(@Query() query: CallQueryDto) {
    return this.callsService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get call statistics' })
  @ApiQuery({ name: 'accountId', required: false, description: 'Filter statistics by account ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Call statistics retrieved successfully',
  })
  async getStatistics(@Query('accountId') accountId?: string) {
    return this.callsService.getCallStatistics(accountId);
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Get call history for a specific account' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account call history retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found',
  })
  async findByAccount(
    @Param('accountId') accountId: string,
    @Query() query: Omit<CallQueryDto, 'accountId'>,
  ) {
    return this.callsService.findByAccount(accountId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific call record' })
  @ApiParam({ name: 'id', description: 'Call ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Call record retrieved successfully',
    type: CallResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Call not found',
  })
  async findOne(@Param('id') id: string): Promise<CallResponseDto> {
    return this.callsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a call record' })
  @ApiParam({ name: 'id', description: 'Call ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Call record updated successfully',
    type: CallResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Call not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCallDto: UpdateCallDto,
  ): Promise<CallResponseDto> {
    return this.callsService.update(id, updateCallDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a call record' })
  @ApiParam({ name: 'id', description: 'Call ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Call record deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Call not found',
  })
  async remove(@Param('id') id: string) {
    return this.callsService.remove(id);
  }

  // VICIdial Integration Endpoints
  @Post('vicidial/initiate')
  @ApiOperation({ summary: 'Initiate a call through VICIdial' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Call initiated successfully',
  })
  async initiateCall(@Body() initiateCallDto: {
    phoneNumber: string;
    agentId: string;
    accountId: string;
  }) {
    return this.callsService.initiateVicidialCall(
      initiateCallDto.phoneNumber,
      initiateCallDto.agentId,
      initiateCallDto.accountId
    );
  }

  @Post('vicidial/hangup/:callId')
  @ApiOperation({ summary: 'Hangup a VICIdial call' })
  @ApiParam({ name: 'callId', description: 'Call ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Call ended successfully',
  })
  async hangupCall(@Param('callId') callId: string) {
    return this.callsService.hangupVicidialCall(callId);
  }

  @Get('vicidial/status/:callId')
  @ApiOperation({ summary: 'Get VICIdial call status' })
  @ApiParam({ name: 'callId', description: 'Call ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Call status retrieved successfully',
  })
  async getCallStatus(@Param('callId') callId: string) {
    return this.callsService.getVicidialCallStatus(callId);
  }

  @Get(':id/recording')
  @ApiOperation({ summary: 'Get call recording' })
  @ApiParam({ name: 'id', description: 'Call ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Call recording retrieved successfully',
  })
  async getRecording(@Param('id') id: string) {
    return this.callsService.getCallRecording(id);
  }

  @Post(':id/recording')
  @ApiOperation({ summary: 'Upload call recording' })
  @ApiParam({ name: 'id', description: 'Call ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Call recording uploaded successfully',
  })
  async uploadRecording(
    @Param('id') id: string,
    @Body() recordingData: { recordingUrl: string }
  ) {
    return this.callsService.updateCallRecording(id, recordingData.recordingUrl);
  }
}