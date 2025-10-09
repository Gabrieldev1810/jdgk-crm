"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const cookieParser = require("cookie-parser");
const express = require("express");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const not_found_exception_filter_1 = require("./common/filters/not-found-exception.filter");
const security_config_1 = require("./config/security.config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.use('/', (req, res, next) => {
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
        }
        else {
            next();
        }
    });
    app.use('/public', express.static((0, path_1.join)(__dirname, '..', 'public')));
    app.setGlobalPrefix('api');
    const securityConfig = (0, security_config_1.getSecurityConfig)(configService);
    app.use((0, helmet_1.default)(securityConfig.helmet));
    app.use((req, res, next) => {
        Object.entries(security_config_1.SECURITY_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        if (configService.get('NODE_ENV') === 'development') {
            const isValid = (0, security_config_1.validateSecurityHeaders)(res.getHeaders());
            if (!isValid) {
                console.warn('⚠️  Some security headers are missing');
            }
        }
        next();
    });
    app.use(cookieParser());
    app.enableCors(securityConfig.cors);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new not_found_exception_filter_1.NotFoundExceptionFilter());
    const config = new swagger_1.DocumentBuilder()
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = configService.get('PORT') || 3000;
    await app.listen(port);
    console.log(`🚀 Dial-Craft CRM Backend running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map