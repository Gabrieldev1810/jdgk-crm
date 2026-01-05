import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCampaignStatusDto {
  @ApiProperty({ description: 'Campaign ID' })
  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @ApiProperty({ description: 'Active status' })
  @IsBoolean()
  active: boolean;
}
