import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BulkUploadService, BulkUploadOptions } from './bulk-upload.service';
import * as multer from 'multer';

// ================================
// BULK UPLOAD CONTROLLER
// ================================
@Controller('bulk-upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BulkUploadController {
  constructor(private readonly bulkUploadService: BulkUploadService) {}

  /**
   * Upload and process CSV/Excel file for bulk account creation
   */
  @Post('upload')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, callback) => {
        // Allow CSV and Excel files
        const allowedTypes = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        const allowedExtensions = ['.csv', '.xls', '.xlsx'];
        const hasValidType = allowedTypes.includes(file.mimetype);
        const hasValidExtension = allowedExtensions.some(ext => 
          file.originalname.toLowerCase().endsWith(ext)
        );

        if (hasValidType || hasValidExtension) {
          callback(null, true);
        } else {
          callback(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
        }
      },
    })
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: BulkUploadOptions,
    @Req() req: Request & { user: any }
  ) {
    if (!file) {
      return {
        success: false,
        message: 'No file uploaded',
      };
    }

    try {
      const result = await this.bulkUploadService.processUpload(file, req.user.id, options);
      
      return {
        success: true,
        message: 'File processed successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.name,
      };
    }
  }

  /**
   * Get upload batch status
   */
  @Get('batch/:batchId')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  async getBatchStatus(@Param('batchId') batchId: string) {
    try {
      const batch = await this.bulkUploadService.getBatchStatus(batchId);
      
      return {
        success: true,
        data: batch,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get upload batch history
   */
  @Get('history')
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  async getBatchHistory(
    @Req() req: Request & { user: any },
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('all') all?: string
  ) {
    try {
      const userId = all === 'true' ? undefined : req.user.id;
      const history = await this.bulkUploadService.getBatchHistory(userId, page, limit);
      
      return {
        success: true,
        data: history,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get upload template/sample CSV
   */
  @Get('template')
  getTemplate() {
    return {
      success: true,
      message: 'CSV template structure',
      data: {
        requiredFields: [
          'Account Number',
          'Name',
          'Original Amount',
          'Out Standing Balance (OSB)',
          'Phone Numbers'
        ],
        optionalFields: [
          'Email',
          'Address',
          'Bank Partner',
          'Status',
          'Assigned Agent',
          'Last Contact',
          'Remarks'
        ],
        sampleCSV: `Account Number,Name,Email,Address,Original Amount,Out Standing Balance (OSB),Bank Partner,Status,Phone Numbers,Assigned Agent,Last Contact,Remarks
ACC001,John Doe,john.doe@email.com,"123 Main St, New York, NY",1000.00,850.00,Chase,NEW,555-0101,,2023-01-01,Customer promised to pay
ACC002,Jane Smith,jane.smith@email.com,"456 Oak Ave, Los Angeles, CA",2500.00,2200.00,Amex,NEW,555-0102,,2023-01-02,Call back later`,
        fieldDescriptions: {
          'Account Number': 'Unique account identifier (required)',
          'Name': 'Customer full name (required)',
          'Email': 'Customer email address',
          'Address': 'Full address',
          'Original Amount': 'Original debt amount (required, number)',
          'Out Standing Balance (OSB)': 'Current outstanding balance (required, number)',
          'Bank Partner': 'Source of the debt (e.g. Chase, Amex)',
          'Status': 'Account status (Default: NEW)',
          'Phone Numbers': 'Primary phone number (required)',
          'Assigned Agent': 'Name or ID of assigned agent (optional)',
          'Last Contact': 'Date of last contact (YYYY-MM-DD)',
          'Remarks': 'Notes or comments'
        }
      }
    };
  }
}