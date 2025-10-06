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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    constructor(prismaService, usersService, jwtService, configService) {
        this.prismaService = prismaService;
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async validateUser(email, password) {
        console.log(`🔍 Attempting to validate user: ${email}`);
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            console.log(`❌ User not found: ${email}`);
            return null;
        }
        if (!user.isActive) {
            console.log(`❌ User is inactive: ${email}`);
            return null;
        }
        console.log(`✅ User found: ${email}, checking password...`);
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(`🔐 Password validation result: ${isPasswordValid}`);
        if (!isPasswordValid) {
            console.log(`❌ Invalid password for user: ${email}`);
            return null;
        }
        console.log(`✅ Authentication successful for user: ${email}`);
        const { password: _, ...result } = user;
        return result;
    }
    async login(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = await this.generateRefreshToken(user.id);
        await this.usersService.updateLastLogin(user.id);
        return {
            user,
            accessToken,
            refreshToken,
        };
    }
    async refreshToken(refreshToken) {
        const tokenRecord = await this.prismaService.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        if (!tokenRecord.user.isActive) {
            throw new common_1.UnauthorizedException('User account is disabled');
        }
        const payload = {
            sub: tokenRecord.user.id,
            email: tokenRecord.user.email,
            role: tokenRecord.user.role,
        };
        const newAccessToken = this.jwtService.sign(payload);
        const newRefreshToken = await this.generateRefreshToken(tokenRecord.user.id);
        await this.prismaService.refreshToken.delete({
            where: { id: tokenRecord.id },
        });
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }
    async logout(refreshToken) {
        await this.prismaService.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }
    async logoutAll(userId) {
        await this.prismaService.refreshToken.deleteMany({
            where: { userId },
        });
    }
    async generateRefreshToken(userId) {
        const token = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.prismaService.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
        return token;
    }
    async validateJwtPayload(payload) {
        const user = await this.usersService.findById(payload.sub);
        if (!user || !user.isActive) {
            return null;
        }
        const { password: _, ...result } = user;
        return result;
    }
    async hashPassword(password) {
        return bcrypt.hash(password, 12);
    }
    async comparePasswords(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map