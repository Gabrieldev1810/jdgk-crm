"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const cookieParser = require("cookie-parser");
const app_module_1 = require("./app.module");
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
    app.setGlobalPrefix('api');
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    }));
    app.use(cookieParser());
    app.enableCors({
        origin: [
            configService.get('FRONTEND_URL') || 'http://localhost:8080',
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8080',
            'http://localhost:8081',
            'http://localhost:8082',
            'http://localhost:8083'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
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