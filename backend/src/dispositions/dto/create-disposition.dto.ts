import { IsString, IsOptional, IsBoolean, IsInt, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDispositionDto {
  @ApiProperty({ description: 'Unique disposition code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Disposition name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Requires follow-up date' })
  @IsOptional()
  @IsBoolean()
  requiresFollowUp?: boolean;

  @ApiPropertyOptional({ description: 'Requires payment info' })
  @IsOptional()
  @IsBoolean()
  requiresPayment?: boolean;

  @ApiPropertyOptional({ description: 'Requires notes' })
  @IsOptional()
  @IsBoolean()
  requiresNotes?: boolean;

  @ApiPropertyOptional({ description: 'Indicates successful outcome' })
  @IsOptional()
  @IsBoolean()
  isSuccessful?: boolean;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
