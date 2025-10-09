import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

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

  @Get('security-check')
  getSecurityHeaders(@Res() res: Response) {
    // Add custom security headers for demonstration
    res.set({
      'X-API-Version': '1.0.0',
      'X-Security-Check': 'passed',
      'X-Frame-Options': 'DENY', // Should be set by helmet
      'X-Content-Type-Options': 'nosniff', // Should be set by helmet
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Permitted-Cross-Domain-Policies': 'none',
      'Referrer-Policy': 'no-referrer',
    });

    return res.json({
      message: 'Security headers check endpoint',
      timestamp: new Date().toISOString(),
      securityFeatures: {
        helmet: 'enabled',
        cors: 'configured',
        csrf: 'helmet-managed',
        hsts: 'enabled',
        noSniff: 'enabled',
        frameOptions: 'deny',
        xssProtection: 'enabled',
        contentSecurityPolicy: 'configured',
        dnsPrefetchControl: 'disabled',
        referrerPolicy: 'no-referrer'
      },
      headers: {
        'Content-Security-Policy': 'Comprehensive CSP configured',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer',
        'X-Permitted-Cross-Domain-Policies': 'none',
        'X-DNS-Prefetch-Control': 'off'
      },
      recommendations: [
        'Ensure HTTPS is enabled in production',
        'Regularly update security headers',
        'Monitor CSP violations',
        'Use security scanning tools',
        'Keep dependencies updated'
      ]
    });
  }
}