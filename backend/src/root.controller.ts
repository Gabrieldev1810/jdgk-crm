import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from './prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class RootController {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) { }

  @Get()
  getRoot() {
    return {
      message: 'Welcome to Dial-Craft CRM API',
      version: '1.0.0',
      service: 'dial-craft-backend',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        api: '/api',
        health: '/api/health',
        docs: '/api/docs',
        auth: '/api/auth',
        users: '/api/users',
        dialerPop: '/dialer-pop (Vicidial integration)'
      },
      description: 'Bank-Compliant CRM for Call Center Agency'
    };
  }

  @Get('status')
  getStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0'
    };
  }

  @Get('dialer-pop')
  async dialerPop(
    @Query('phone') phone: string,
    @Query('lead_id') leadId: string,
    @Query('campaign_id') campaignId: string,
    @Query('agent_user') agentUser: string,
    @Res() res: Response
  ) {
    try {
      // Log the incoming request
      console.log('[DIALER-POP] Incoming request:', {
        phone,
        leadId,
        campaignId,
        agentUser,
        timestamp: new Date().toISOString()
      });

      // Default to localhost:5173 if not set
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';

      // 1. Validate info
      if (!phone && !leadId) {
        return res.redirect(`${frontendUrl}/accounts?error=missing_params`);
      }

      // 2. Search for existing account
      let account = null;

      // Search by Lead ID (mapped to Account Number or ID)
      if (leadId) {
        account = await this.prisma.account.findFirst({
          where: {
            OR: [
              { id: leadId }, // If UUID matches
              { accountNumber: leadId.toString() } // If mapped to Account Number
            ]
          }
        });
      }

      // Search by Phone if not found yet
      if (!account && phone) {
        account = await this.prisma.account.findFirst({
          where: {
            phoneNumbers: {
              some: {
                phoneNumber: { contains: phone }
              }
            }
          }
        });
      }

      // 3. Redirect
      if (account) {
        console.log(`[DIALER-POP] Found account ${account.id} for lead ${leadId}/phone ${phone}`);
        // Use query params for Modal-based frontend
        return res.redirect(`${frontendUrl}/accounts?mode=view&accountId=${account.id}`);
      } else {
        console.log(`[DIALER-POP] No account found. Redirecting to creation.`);
        // Redirect to create page with params pre-filled
        const params = new URLSearchParams({
          mode: 'create',
          phone: phone || '',
          accountNumber: leadId || '',
          campaignId: campaignId || '',
          vicidialUser: agentUser || ''
        });
        return res.redirect(`${frontendUrl}/accounts?${params.toString()}`);
      }

    } catch (error) {
      console.error('[DIALER-POP] Error:', error);
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/accounts?error=server_error`);
    }
  }
}