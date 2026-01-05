import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SecuritySettingsService } from '../common/services/security-settings.service';
import { UpdateIpWhitelistDto } from './dto/update-ip-whitelist.dto';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly securitySettingsService: SecuritySettingsService) {}

  @Get('security/ip-whitelist')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get IP whitelist configuration' })
  getIpWhitelistConfig() {
    return this.securitySettingsService.getIpWhitelistConfig();
  }

  @Post('security/ip-whitelist')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update IP whitelist configuration' })
  updateIpWhitelistConfig(@Body() dto: UpdateIpWhitelistDto) {
    return this.securitySettingsService.updateIpWhitelistConfig(dto.enabled, dto.allowedIps);
  }
}
