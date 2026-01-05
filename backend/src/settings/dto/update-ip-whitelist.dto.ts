import { IsBoolean, IsArray, IsString, IsIP } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateIpWhitelistDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  allowedIps: string[];
}
