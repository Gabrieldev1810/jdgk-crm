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
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DispositionsService } from './dispositions.service';
import { CreateDispositionCategoryDto } from './dto/create-category.dto';
import { UpdateDispositionCategoryDto } from './dto/update-category.dto';
import { CreateDispositionDto } from './dto/create-disposition.dto';
import { UpdateDispositionDto } from './dto/update-disposition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLoggingService } from '../common/services/audit-logging.service';

import { VicidialService } from '../vicidial/vicidial.service';

@ApiTags('dispositions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispositions')
export class DispositionsController {
  constructor(
    private readonly dispositionsService: DispositionsService,
    private readonly auditService: AuditLoggingService,
    private readonly vicidialService: VicidialService,
  ) {}

  @Post('sync/vicidial')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Sync dispositions from Vicidial' })
  async syncVicidial(@Request() req: any) {
    const statuses = await this.vicidialService.getVicidialStatuses();
    // Combine system and campaign statuses
    const allStatuses = [...statuses.system, ...statuses.campaign];
    
    const result = await this.dispositionsService.syncVicidialStatuses(allStatuses);

    await this.auditService.logAuditEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'SYNC',
      resource: 'DISPOSITIONS',
      details: { result },
      success: true,
    });

    return result;
  }

  // Categories Endpoints
  @Post('categories')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new disposition category' })
  async createCategory(@Body() createDto: CreateDispositionCategoryDto, @Request() req: any) {
    const category = await this.dispositionsService.createCategory(createDto);
    
    await this.auditService.logAuditEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CREATE',
      resource: 'DISPOSITIONS',
      details: { type: 'CATEGORY', name: category.name },
      success: true,
    });

    return category;
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all disposition categories' })
  async findAllCategories(@Query('includeDispositions') includeDispositions: boolean) {
    return this.dispositionsService.findAllCategories(includeDispositions);
  }

  @Patch('categories/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update a disposition category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateDto: UpdateDispositionCategoryDto,
    @Request() req: any,
  ) {
    const category = await this.dispositionsService.updateCategory(id, updateDto);

    await this.auditService.logAuditEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'UPDATE',
      resource: 'DISPOSITIONS',
      resourceId: id,
      details: { type: 'CATEGORY', changes: updateDto },
      success: true,
    });

    return category;
  }

  @Delete('categories/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete a disposition category' })
  async removeCategory(@Param('id') id: string, @Request() req: any) {
    const result = await this.dispositionsService.removeCategory(id);

    await this.auditService.logAuditEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'DELETE',
      resource: 'DISPOSITIONS',
      resourceId: id,
      details: { type: 'CATEGORY' },
      success: true,
    });

    return result;
  }

  // Dispositions Endpoints
  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new disposition' })
  async createDisposition(@Body() createDto: CreateDispositionDto, @Request() req: any) {
    const disposition = await this.dispositionsService.createDisposition(createDto);

    await this.auditService.logAuditEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CREATE',
      resource: 'DISPOSITIONS',
      details: { type: 'DISPOSITION', code: disposition.code, name: disposition.name },
      success: true,
    });

    return disposition;
  }

  @Get()
  @ApiOperation({ summary: 'Get all dispositions' })
  async findAllDispositions(@Query('activeOnly') activeOnly: boolean) {
    return this.dispositionsService.findAllDispositions(activeOnly);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific disposition' })
  async findOneDisposition(@Param('id') id: string) {
    return this.dispositionsService.findOneDisposition(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update a disposition' })
  async updateDisposition(
    @Param('id') id: string,
    @Body() updateDto: UpdateDispositionDto,
    @Request() req: any,
  ) {
    const disposition = await this.dispositionsService.updateDisposition(id, updateDto);

    await this.auditService.logAuditEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'UPDATE',
      resource: 'DISPOSITIONS',
      resourceId: id,
      details: { type: 'DISPOSITION', changes: updateDto },
      success: true,
    });

    return disposition;
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete a disposition' })
  async removeDisposition(@Param('id') id: string, @Request() req: any) {
    const result = await this.dispositionsService.removeDisposition(id);

    await this.auditService.logAuditEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'DELETE',
      resource: 'DISPOSITIONS',
      resourceId: id,
      details: { type: 'DISPOSITION' },
      success: true,
    });

    return result;
  }
}
