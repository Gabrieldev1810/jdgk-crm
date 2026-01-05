import { Controller, Post, Body, UseGuards, Get, Query, Req, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { VicidialService } from './vicidial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('VICIdial Integration')
@Controller('vicidial')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VicidialController {
  constructor(private readonly vicidialService: VicidialService) { }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get all campaigns' })
  async getCampaigns() {
    return this.vicidialService.getCampaigns();
  }

  @Get('live-agents')
  @ApiOperation({ summary: 'Get live agents' })
  async getLiveAgents(@Query('campaignId') campaignId?: string) {
    return this.vicidialService.getLiveAgents(campaignId);
  }

  @Get('campaigns/:id/dialing-settings')
  @ApiOperation({ summary: 'Get campaign dialing settings' })
  async getCampaignDialingSettings(@Param('id') id: string) {
    return this.vicidialService.getCampaignDialingSettings(id);
  }

  @Get('campaigns/:id/stats')
  @ApiOperation({ summary: 'Get campaign stats' })
  async getCampaignStats(@Param('id') id: string) {
    return this.vicidialService.getCampaignStats(id);
  }

  @Get('agent-logs/:user')
  @ApiOperation({ summary: 'Get agent logs by user' })
  async getAgentLogsByUser(@Param('user') user: string, @Query('limit') limit: number) {
    return this.vicidialService.getAgentLogs(user, limit || 10);
  }


  @Post('agent/status')
  @ApiOperation({ summary: 'Update Agent Status (Pause/Resume)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        agentUser: { type: 'string', example: '1001' },
        pause: { type: 'boolean', example: true },
        campaignId: { type: 'string', example: 'TEST_CAMP' }
      }
    }
  })
  async updateAgentStatus(@Body() body: { agentUser: string; pause: boolean; campaignId?: string }) {
    return this.vicidialService.updateAgentStatus(body.agentUser, body.pause, body.campaignId);
  }

  @Post('call/dial')
  @ApiOperation({ summary: 'Initiate External Dial' })
  @ApiResponse({ status: 200, description: 'Call initiated' })
  async externalDial(@Body() body: { phoneNumber: string; agentUser: string; leadId: string | number }) {
    return this.vicidialService.externalDial(body.phoneNumber, body.agentUser, body.leadId);
  }

  @Get('agent/logs')
  @ApiOperation({ summary: 'Get recent agent logs' })
  async getAgentLogs(@Query('agentUser') agentUser: string, @Query('limit') limit: number) {
    return this.vicidialService.getAgentLogs(agentUser, limit || 10);
  }

  @Post('leads/sync')
  @ApiOperation({ summary: 'Sync leads to VICIdial Lists' })
  async syncLeads(@Body() body: { leads: any[]; listId: string }) {
    // This connects to the existing syncLeads service method
    return this.vicidialService.syncLeads(body.leads, body.listId);
  }

  @Get('reports/realtime')
  @ApiOperation({ summary: 'Get Real-time VICIdial Stats' })
  async getRealtimeReport(@Req() req: any, @Query('campaigns') campaigns?: string) {
    const userRole = req.user.role;
    const vicidialUserId = req.user.vicidialUserId;
    const campaignList = campaigns ? campaigns.split(',') : undefined;

    return this.vicidialService.getRealtimeReport(userRole, vicidialUserId, campaignList);
  }

  @Get('proxy-recording')
  @ApiOperation({ summary: 'Proxy recording playback' })
  async proxyRecording(@Query('path') path: string, @Res() res: Response) {
    return this.vicidialService.streamRecording(path, res);
  }
}
