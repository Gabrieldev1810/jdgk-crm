import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ================================
// BULK UPLOAD DTOs
// ================================

export class BulkUploadOptionsDto {
  @ApiProperty({ 
    description: 'Skip rows with validation errors and continue processing',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  skipErrors?: boolean = false;

  @ApiProperty({ 
    description: 'Update existing accounts if duplicates found',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  updateExisting?: boolean = false;

  @ApiProperty({ 
    description: 'Batch name for tracking uploads',
    required: false 
  })
  @IsOptional()
  @IsString()
  batchName?: string;
}

export class BulkUploadResultDto {
  @ApiProperty({ description: 'Upload batch ID for tracking' })
  batchId: string;

  @ApiProperty({ description: 'Total rows processed' })
  totalProcessed: number;

  @ApiProperty({ description: 'Number of successful inserts' })
  successCount: number;

  @ApiProperty({ description: 'Number of errors encountered' })
  errorCount: number;

  @ApiProperty({ description: 'Number of duplicate records found' })
  duplicateCount: number;

  @ApiProperty({ description: 'Processing status' })
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';

  @ApiProperty({ description: 'Processing start time' })
  startedAt: Date;

  @ApiProperty({ description: 'Processing completion time' })
  completedAt: Date;

  @ApiProperty({ description: 'File information' })
  fileInfo: {
    originalName: string;
    size: number;
    mimeType: string;
  };

  @ApiProperty({ description: 'Error details if any', required: false })
  errors?: BulkUploadErrorDto[];
}

export class BulkUploadErrorDto {
  @ApiProperty({ description: 'Row number where error occurred' })
  rowNumber: number;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiProperty({ description: 'Field that caused the error', required: false })
  field?: string;

  @ApiProperty({ description: 'Invalid value', required: false })
  value?: any;

  @ApiProperty({ description: 'Raw row data', required: false })
  rowData?: Record<string, any>;
}

export class BulkUploadStatusDto {
  @ApiProperty({ description: 'Upload batch ID' })
  batchId: string;

  @ApiProperty({ description: 'Current processing status' })
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  progress: number;

  @ApiProperty({ description: 'Current processing message' })
  message: string;

  @ApiProperty({ description: 'Processed rows count' })
  processedCount: number;

  @ApiProperty({ description: 'Total rows to process' })
  totalCount: number;
}