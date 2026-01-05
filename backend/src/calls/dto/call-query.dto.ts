import { IsOptional, IsString, IsDateString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CallDirection, CallStatus } from './create-call.dto';

export class CallQueryDto {
  @ApiPropertyOptional({ description: 'Account ID to filter by' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Agent ID to filter by' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ enum: CallDirection, description: 'Call direction filter' })
  @IsOptional()
  @IsEnum(CallDirection)
  direction?: CallDirection;

  @ApiPropertyOptional({ enum: CallStatus, description: 'Call status filter' })
  @IsOptional()
  @IsEnum(CallStatus)
  status?: CallStatus;

  @ApiPropertyOptional({ description: 'Call disposition filter' })
  @IsOptional()
  @IsString()
  disposition?: string;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Campaign ID filter' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'VICIdial Call ID filter' })
  @IsOptional()
  @IsString()
  vicidialCallId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term for account name or phone' })
  @IsOptional()
  @IsString()
  search?: string;
}