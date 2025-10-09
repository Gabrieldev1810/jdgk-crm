import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLoggingService } from '../common/services/audit-logging.service';

@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly auditService: AuditLoggingService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  async create(
    @Body() createAccountDto: any,
    @Request() req: any,
  ) {
    try {
      const newAccount = await this.accountsService.create(createAccountDto, req.user.id);
      
      // Log account creation
      await this.auditService.logAuditEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'CREATE',
        resource: 'ACCOUNTS',
        resourceId: newAccount.id,
        details: {
          accountNumber: newAccount.accountNumber,
          fullName: newAccount.fullName,
          email: newAccount.email,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true,
      });

      return newAccount;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create account',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT')
  async findAll(
    @Query() filterDto: any,
    @Request() req: any,
  ) {
    try {
      return await this.accountsService.findAll(filterDto, req.user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch accounts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('statistics')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  async getStatistics(@Request() req: any) {
    try {
      return await this.accountsService.getStatistics(req.user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  async exportAccounts(
    @Query() queryParams: any,
    @Request() req: any,
  ) {
    try {
      const csvData = await this.accountsService.exportToCsv(queryParams, req.user.id);
      
      // Log export action
      await this.auditService.logAuditEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'EXPORT',
        resource: 'ACCOUNTS',
        success: true,
        details: {
          format: 'CSV',
          filters: queryParams,
        },
      });

      return {
        success: true,
        data: csvData,
        filename: `accounts_export_${new Date().toISOString().split('T')[0]}.csv`,
        contentType: 'text/csv',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to export accounts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT')
  async findOne(@Param('id') id: string, @Request() req: any) {
    try {
      return await this.accountsService.findOne(id, req.user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Account not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  async update(
    @Param('id') id: string,
    @Body() updateAccountDto: any,
    @Request() req: any,
  ) {
    try {
      const updatedAccount = await this.accountsService.update(id, updateAccountDto, req.user.id);
      
      // Log account update
      await this.auditService.logAuditEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'UPDATE',
        resource: 'ACCOUNTS',
        resourceId: id,
        details: {
          updatedFields: Object.keys(updateAccountDto),
          changes: updateAccountDto,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true,
      });

      return updatedAccount;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update account',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async remove(@Param('id') id: string, @Request() req: any) {
    try {
      // Get account info before deletion
      const accountToDelete = await this.accountsService.findOne(id, req.user);
      
      const result = await this.accountsService.remove(id, req.user.id);
      
      // Log account deletion
      await this.auditService.logAuditEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'DELETE',
        resource: 'ACCOUNTS',
        resourceId: id,
        details: {
          deletedAccount: {
            accountNumber: accountToDelete.accountNumber,
            fullName: accountToDelete.fullName,
            email: accountToDelete.email,
          },
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true,
      });

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete account',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('bulk-upload')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.accountsService.bulkUpload(file, req.user.id);
      
      // Log bulk upload activity
      await this.auditService.logAuditEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'BULK_UPLOAD',
        resource: 'ACCOUNTS',
        details: {
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          recordsTotal: result.summary?.total || 0,
          recordsProcessed: result.summary?.processed || 0,
          recordsFailed: result.summary?.failed || 0,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true,
      });

      return result;
    } catch (error) {
      // Log failed upload attempt
      await this.auditService.logAuditEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'BULK_UPLOAD_FAILED',
        resource: 'ACCOUNTS',
        details: {
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          errorMessage: error.message,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: error.message,
      });

      throw new HttpException(
        error.message || 'Failed to process bulk upload',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/assign')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  async assignToAgent(
    @Param('id') id: string,
    @Body('agentId') agentId: string,
    @Request() req: any,
  ) {
    try {
      return await this.accountsService.assignToAgent(id, agentId, req.user.id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to assign account',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/add-note')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT')
  async addNote(
    @Param('id') id: string,
    @Body('note') note: string,
    @Request() req: any,
  ) {
    try {
      return await this.accountsService.addNote(id, note, req.user.id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add note',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/call-history')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT')
  async getCallHistory(@Param('id') id: string, @Request() req: any) {
    try {
      return await this.accountsService.getCallHistory(id, req.user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch call history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}