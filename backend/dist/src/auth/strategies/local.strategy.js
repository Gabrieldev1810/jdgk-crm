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
exports.LocalStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_local_1 = require("passport-local");
const auth_service_1 = require("../auth.service");
const audit_logging_service_1 = require("../../common/services/audit-logging.service");
let LocalStrategy = class LocalStrategy extends (0, passport_1.PassportStrategy)(passport_local_1.Strategy) {
    constructor(authService, auditService) {
        super({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true,
        });
        this.authService = authService;
        this.auditService = auditService;
    }
    async validate(req, email, password) {
        try {
            const user = await this.authService.validateUser(email, password);
            if (!user) {
                await this.auditService.logAuthEvent('LOGIN_FAILED', undefined, email, req.ip, req.get('User-Agent'), {
                    reason: 'Invalid credentials',
                    timestamp: new Date().toISOString(),
                }, false, 'Invalid email or password');
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            return user;
        }
        catch (error) {
            console.error('LocalStrategy validation error:', error);
            if (!(error instanceof common_1.UnauthorizedException)) {
                await this.auditService.logAuthEvent('LOGIN_FAILED', undefined, email, req.ip, req.get('User-Agent'), {
                    reason: 'Authentication error',
                    error: error.message,
                    timestamp: new Date().toISOString(),
                }, false, error.message);
                throw new common_1.UnauthorizedException('Authentication failed');
            }
            throw error;
        }
    }
};
exports.LocalStrategy = LocalStrategy;
exports.LocalStrategy = LocalStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        audit_logging_service_1.AuditLoggingService])
], LocalStrategy);
//# sourceMappingURL=local.strategy.js.map