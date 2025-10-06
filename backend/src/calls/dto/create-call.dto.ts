import { IsString, IsOptional, IsDateString, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CallDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export enum CallStatus {
  RINGING = 'RINGING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  BUSY = 'BUSY',
  NO_ANSWER = 'NO_ANSWER',
  CANCELLED = 'CANCELLED'
}

export enum CallDisposition {
  CONTACT_MADE = 'CONTACT_MADE',
  LEFT_MESSAGE = 'LEFT_MESSAGE',
  NO_ANSWER = 'NO_ANSWER',
  BUSY = 'BUSY',
  WRONG_NUMBER = 'WRONG_NUMBER',
  DISCONNECTED = 'DISCONNECTED',
  PROMISE_TO_PAY = 'PROMISE_TO_PAY',
  PAYMENT_MADE = 'PAYMENT_MADE',
  CALLBACK_REQUESTED = 'CALLBACK_REQUESTED',
  DO_NOT_CALL = 'DO_NOT_CALL',
  DISPUTE = 'DISPUTE'
}

export class CreateCallDto {
  @ApiProperty({ description: 'Account ID' })
  @IsString()
  accountId: string;

  @ApiPropertyOptional({ description: 'Account phone ID' })
  @IsOptional()
  @IsString()
  accountPhoneId?: string;

  @ApiProperty({ description: 'Agent ID' })
  @IsString()
  agentId: string;

  @ApiProperty({ enum: CallDirection, description: 'Call direction' })
  @IsEnum(CallDirection)
  direction: CallDirection;

  @ApiProperty({ description: 'Call start time' })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ description: 'Call end time' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Call duration in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiProperty({ enum: CallStatus, description: 'Call status' })
  @IsEnum(CallStatus)
  status: CallStatus;

  @ApiPropertyOptional({ enum: CallDisposition, description: 'Call disposition' })
  @IsOptional()
  @IsEnum(CallDisposition)
  disposition?: CallDisposition;

  @ApiPropertyOptional({ description: 'Call notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Follow up date' })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({ description: 'Amount promised by customer' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPromised?: number;

  @ApiPropertyOptional({ description: 'Amount collected during call' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountCollected?: number;

  @ApiPropertyOptional({ description: 'Recording file path' })
  @IsOptional()
  @IsString()
  recordingPath?: string;

  @ApiPropertyOptional({ description: 'Caller ID used' })
  @IsOptional()
  @IsString()
  callerId?: string;

  @ApiPropertyOptional({ description: 'Campaign ID' })
  @IsOptional()
  @IsString()
  campaignId?: string;
}