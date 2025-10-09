"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
let AppController = class AppController {
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
    getSecurityHeaders(res) {
        res.set({
            'X-API-Version': '1.0.0',
            'X-Security-Check': 'passed',
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
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
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getRoot", null);
__decorate([
    (0, common_1.Get)('info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getInfo", null);
__decorate([
    (0, common_1.Get)('security-check'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getSecurityHeaders", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)()
], AppController);
//# sourceMappingURL=app.controller.js.map