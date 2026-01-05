import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CallDirection, CallStatus } from './create-call.dto';

export class CallResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  accountId: string;

  @ApiPropertyOptional()
  accountPhoneId?: string;

  @ApiProperty()
  agentId: string;

  @ApiProperty({ enum: CallDirection })
  direction: CallDirection;

  @ApiProperty()
  startTime: Date;

  @ApiPropertyOptional()
  endTime?: Date;

  @ApiPropertyOptional()
  duration?: number;

  @ApiProperty({ enum: CallStatus })
  status: CallStatus;

  @ApiPropertyOptional()
  disposition?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  followUpDate?: Date;

  @ApiPropertyOptional()
  amountPromised?: number;

  @ApiPropertyOptional()
  amountCollected?: number;

  @ApiPropertyOptional()
  recordingPath?: string;

  @ApiPropertyOptional()
  callerId?: string;

  @ApiPropertyOptional()
  campaignId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiPropertyOptional()
  agent?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };

  @ApiPropertyOptional()
  account?: {
    id: string;
    accountNumber: string;
    fullName: string;
  };

  @ApiPropertyOptional()
  accountPhone?: {
    id: string;
    phoneNumber: string;
    phoneType: string;
  };
}