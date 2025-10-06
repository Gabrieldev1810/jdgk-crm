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
import { BulkUploadService, BulkUploadOptions } from './bulk-upload.service';
import * as multer from 'multer';

// ================================
// BULK UPLOAD CONTROLLER
// ================================
@Controller('bulk-upload')
@UseGuards(JwtAuthGuard)
export class BulkUploadController {
  constructor(private readonly bulkUploadService: BulkUploadService) {}

  /**
   * Upload and process CSV/Excel file for bulk account creation
   */
  @Post('upload')
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
          'accountNumber',
          'firstName', 
          'lastName',
          'originalAmount',
          'currentBalance'
        ],
        optionalFields: [
          'email',
          'address1',
          'address2', 
          'city',
          'state',
          'zipCode',
          'country',
          'amountPaid',
          'interestRate',
          'lastPaymentDate',
          'lastPaymentAmount',
          'status',
          'priority',
          'preferredContactMethod',
          'bestTimeToCall',
          'timezone',
          'language',
          'daysPastDue',
          'lastContactDate',
          'nextContactDate',
          'doNotCall',
          'disputeFlag',
          'bankruptcyFlag',
          'deceasedFlag',
          'notes',
          'source'
        ],
        sampleCSV: `accountNumber,firstName,lastName,email,originalAmount,currentBalance,status,priority
ACC001,John,Doe,john.doe@email.com,1000.00,850.00,ACTIVE,HIGH
ACC002,Jane,Smith,jane.smith@email.com,2500.00,2200.00,NEW,MEDIUM`,
        fieldDescriptions: {
          accountNumber: 'Unique account identifier (required)',
          firstName: 'Customer first name (required)',
          lastName: 'Customer last name (required)',
          originalAmount: 'Original debt amount (required, number)',
          currentBalance: 'Current outstanding balance (required, number)',
          status: 'Account status (NEW, ACTIVE, CLOSED, DISPUTED, PAID)',
          priority: 'Collection priority (LOW, MEDIUM, HIGH, URGENT)',
          email: 'Customer email address',
          // ... other field descriptions
        }
      }
    };
  }
}