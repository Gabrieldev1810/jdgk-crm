import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VicidialDialDto {
  @ApiProperty({ description: 'Phone number to dial' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Agent user ID in VICIdial' })
  @IsString()
  @IsNotEmpty()
  agentUser: string;

  @ApiProperty({ description: 'Lead ID in VICIdial' })
  @IsString()
  @IsNotEmpty()
  leadId: string;
}

export class VicidialHangupDto {
  @ApiProperty({ description: 'Agent user ID in VICIdial' })
  @IsString()
  @IsNotEmpty()
  agentUser: string;
}

export class VicidialStatusDto {
  @ApiProperty({ description: 'Agent user ID in VICIdial' })
  @IsString()
  @IsNotEmpty()
  agentUser: string;

  @ApiProperty({ description: 'Status code to set' })
  @IsString()
  @IsNotEmpty()
  status: string;
}

export class VicidialAgentLogQueryDto {
  @ApiPropertyOptional({ description: 'Limit number of records', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
