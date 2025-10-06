import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'Welcome to Dial-Craft CRM API',
      version: '1.0.0',
      service: 'dial-craft-backend',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        docs: '/api/docs',
        auth: '/api/auth',
        users: '/api/users'
      },
      description: 'Bank-Compliant CRM for Call Center Agency'
    };
  }

  @Get('info')
  getInfo() {
    return {
      name: 'Dial-Craft CRM Backend',
      version: '1.0.0',
      description: 'Bank-Compliant CRM for Call Center Agency',
      author: 'Dial-Craft Team',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      database: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
      features: [
        'JWT Authentication',
        'User Management',
        'PostgreSQL Database',
        'API Documentation (Swagger)',
        'Rate Limiting',
        'Security Headers'
      ]
    };
  }
}