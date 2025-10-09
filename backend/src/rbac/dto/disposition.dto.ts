import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ================================
// DISPOSITION CATEGORY DTOS
// ================================

export class CreateDispositionCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category color (hex)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is category active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDispositionCategoryDto {
  @ApiPropertyOptional({ description: 'Category name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category color (hex)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is category active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ================================
// DISPOSITION DTOS
// ================================

export class CreateDispositionDto {
  @ApiProperty({ description: 'Disposition code (unique identifier)' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Disposition name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Disposition description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Disposition color (hex)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Requires follow-up call', default: false })
  @IsOptional()
  @IsBoolean()
  requiresFollowUp?: boolean;

  @ApiPropertyOptional({ description: 'Requires payment', default: false })
  @IsOptional()
  @IsBoolean()
  requiresPayment?: boolean;

  @ApiPropertyOptional({ description: 'Requires notes', default: false })
  @IsOptional()
  @IsBoolean()
  requiresNotes?: boolean;

  @ApiPropertyOptional({ description: 'Is successful outcome', default: false })
  @IsOptional()
  @IsBoolean()
  isSuccessful?: boolean;

  @ApiPropertyOptional({ description: 'Is disposition active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is system disposition', default: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}

export class UpdateDispositionDto {
  @ApiPropertyOptional({ description: 'Disposition name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Disposition description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Disposition color (hex)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Requires follow-up call' })
  @IsOptional()
  @IsBoolean()
  requiresFollowUp?: boolean;

  @ApiPropertyOptional({ description: 'Requires payment' })
  @IsOptional()
  @IsBoolean()
  requiresPayment?: boolean;

  @ApiPropertyOptional({ description: 'Requires notes' })
  @IsOptional()
  @IsBoolean()
  requiresNotes?: boolean;

  @ApiPropertyOptional({ description: 'Is successful outcome' })
  @IsOptional()
  @IsBoolean()
  isSuccessful?: boolean;

  @ApiPropertyOptional({ description: 'Is disposition active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ================================
// BULK UPLOAD DTOS
// ================================

export class BulkDispositionDto {
  @ApiProperty({ description: 'CSV data with disposition definitions' })
  @IsString()
  csvData: string;

  @ApiPropertyOptional({ description: 'Skip header row', default: true })
  @IsOptional()
  @IsBoolean()
  skipHeader?: boolean;

  @ApiPropertyOptional({ description: 'Update existing dispositions', default: false })
  @IsOptional()
  @IsBoolean()
  updateExisting?: boolean;
}