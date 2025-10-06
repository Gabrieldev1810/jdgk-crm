import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
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
        users: '/api/users'
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
}