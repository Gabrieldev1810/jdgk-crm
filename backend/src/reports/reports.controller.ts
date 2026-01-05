import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('performance')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  async getPerformance(@Request() req) {
    return this.reportsService.getPerformanceData(req.user);
  }

  @Get('audience')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  async getAudience(@Request() req) {
    return this.reportsService.getAudienceData(req.user);
  }

  @Get('recent')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  async getRecent(@Request() req) {
    return this.reportsService.getRecentReports(req.user);
  }
}
