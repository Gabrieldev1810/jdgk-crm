import { IsString, IsOptional, IsHexColor, IsEnum } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsHexColor()
  @IsOptional()
  color?: string;
}
