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

@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  async create(
    @Body() createAccountDto: any,
    @Request() req: any,
  ) {
    try {
      return await this.accountsService.create(createAccountDto, req.user.id);
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
      return await this.accountsService.update(id, updateAccountDto, req.user.id);
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
      return await this.accountsService.remove(id, req.user.id);
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
      return await this.accountsService.bulkUpload(file, req.user.id);
    } catch (error) {
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