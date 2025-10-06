import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
export interface AuthResult {
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private prismaService;
    private usersService;
    private jwtService;
    private configService;
    constructor(prismaService: PrismaService, usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null>;
    login(user: Omit<User, 'password'>): Promise<AuthResult>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
    private generateRefreshToken;
    validateJwtPayload(payload: JwtPayload): Promise<Omit<User, 'password'> | null>;
    hashPassword(password: string): Promise<string>;
    comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
