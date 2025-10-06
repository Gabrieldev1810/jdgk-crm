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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootController = void 0;
const common_1 = require("@nestjs/common");
let RootController = class RootController {
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
    getStatus() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '1.0.0'
        };
    }
};
exports.RootController = RootController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RootController.prototype, "getRoot", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RootController.prototype, "getStatus", null);
exports.RootController = RootController = __decorate([
    (0, common_1.Controller)()
], RootController);
//# sourceMappingURL=root.controller.js.map