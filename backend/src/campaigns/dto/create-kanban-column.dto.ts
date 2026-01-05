import { IsString, IsOptional, IsInt, IsHexColor } from 'class-validator';

export class CreateKanbanColumnDto {
  @IsString()
  title: string;

  @IsHexColor()
  @IsOptional()
  color?: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  campaignId?: string;
}
