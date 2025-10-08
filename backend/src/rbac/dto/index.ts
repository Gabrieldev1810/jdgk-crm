import { IsString, IsOptional, IsBoolean, IsArray, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ================================
// ROLE DTOS
// ================================

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is system role', default: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({ description: 'Is role active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Role name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is role active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignPermissionsDto {
  @ApiProperty({ description: 'Array of permission IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

export class AssignRoleDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Role ID' })
  @IsUUID()
  roleId: string;

  @ApiPropertyOptional({ description: 'Role expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

// ================================
// PERMISSION DTOS
// ================================

export class CreatePermissionDto {
  @ApiProperty({ description: 'Permission code (e.g., accounts.view)' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Permission name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Permission description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Permission category' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Resource name' })
  @IsString()
  resource: string;

  @ApiProperty({ description: 'Action name' })
  @IsString()
  action: string;

  @ApiPropertyOptional({ description: 'Is system permission', default: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}

export class UpdatePermissionDto {
  @ApiPropertyOptional({ description: 'Permission name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Permission description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Permission category' })
  @IsOptional()
  @IsString()
  category?: string;
}