import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export enum DialMethod {
  MANUAL = 'MANUAL',
  RATIO = 'RATIO',
  ADAPT_HARD_LIMIT = 'ADAPT_HARD_LIMIT',
  ADAPT_TAPERED = 'ADAPT_TAPERED',
  ADAPT_AVERAGE = 'ADAPT_AVERAGE',
  INBOUND_MAN = 'INBOUND_MAN',
}

export class UpdateCampaignDialingSettingsDto {
  @IsEnum(DialMethod)
  @IsOptional()
  dialMethod?: DialMethod;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  autoDialLevel?: number;

  @IsBoolean()
  @IsOptional()
  availableOnlyRatioTally?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(-10)
  @Max(10)
  adaptIntensityModifier?: number;
}
