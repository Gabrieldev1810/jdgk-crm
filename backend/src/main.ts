import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { RootController } from './root.controller';
import { NotFoundExceptionFilter } from './common/filters/not-found-exception.filter';
import { getSecurityConfig, SECURITY_HEADERS, validateSecurityHeaders } from './config/security.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  
  // Add root path handler before setting global prefix
  app.use('/', (req: any, res: any, next: any) => {
    if (req.method === 'GET' && req.path === '/') {
      res.json({
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
      });
    } else {
      next();
    }
  });

  // Serve static files from public directory
  app.use('/public', express.static(join(__dirname, '..', 'public')));

  // Global prefix for API routes
  app.setGlobalPrefix('api');
  
  // Get security configuration based on environment
  const securityConfig = getSecurityConfig(configService);
  
  // Enhanced Security middleware with comprehensive helmet configuration
  app.use(helmet(securityConfig.helmet));
  
  // Add custom security headers
  app.use((req, res, next) => {
    // Add custom security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Log security headers validation in development
    if (configService.get('NODE_ENV') === 'development') {
      const isValid = validateSecurityHeaders(res.getHeaders());
      if (!isValid) {
        console.warn('⚠️  Some security headers are missing');
      }
    }
    
    next();
  });
  
  // Cookie parser for JWT tokens
  app.use(cookieParser());
  
  // CORS configuration using security config
  app.enableCors(securityConfig.cors);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global 404 exception filter
  app.useGlobalFilters(new NotFoundExceptionFilter());
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Dial-Craft CRM API')
    .setDescription('Bank-Compliant CRM for Call Center Agency')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('accounts', 'Customer accounts')
    .addTag('calls', 'Call management')
    .addTag('dispositions', 'Call dispositions')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = configService.get('PORT') || 3000;
  // Listen on all interfaces for better Windows compatibility
  await app.listen(port);
  
  console.log(`🚀 Dial-Craft CRM Backend running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();