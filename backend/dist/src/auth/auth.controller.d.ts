import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthDebugService } from './auth-debug.service';
import { LoginDto } from './dto/auth.dto';
import { User } from '@prisma/client';
export declare class AuthController {
    private authService;
    private authDebugService;
    constructor(authService: AuthService, authDebugService: AuthDebugService);
    login(loginDto: LoginDto, req: Request & {
        user: Omit<User, 'password'>;
    }, res: Response): Promise<{
        user: Omit<{
            id: string;
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            role: string;
            isActive: boolean;
            lastLogin: Date | null;
            createdAt: Date;
            updatedAt: Date;
            emailVerified: boolean;
            emailVerifyToken: string | null;
            emailVerifyExpires: Date | null;
            passwordResetToken: string | null;
            passwordResetExpires: Date | null;
            failedLoginAttempts: number;
            accountLockedUntil: Date | null;
            lastFailedLogin: Date | null;
            passwordChangedAt: Date;
            mustChangePassword: boolean;
        }, "password">;
        accessToken: string;
    }>;
    loginDebug(loginDto: LoginDto): Promise<{
        success: boolean;
        user: Omit<{
            id: string;
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            role: string;
            isActive: boolean;
            lastLogin: Date | null;
            createdAt: Date;
            updatedAt: Date;
            emailVerified: boolean;
            emailVerifyToken: string | null;
            emailVerifyExpires: Date | null;
            passwordResetToken: string | null;
            passwordResetExpires: Date | null;
            failedLoginAttempts: number;
            accountLockedUntil: Date | null;
            lastFailedLogin: Date | null;
            passwordChangedAt: Date;
            mustChangePassword: boolean;
        }, "password">;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    refresh(req: Request, res: Response): Promise<{
        accessToken: string;
    }>;
    logout(req: Request, res: Response): Promise<{
        message: string;
    }>;
    getProfile(req: Request & {
        user: Omit<User, 'password'>;
    }): Promise<{
        user: Express.User & Omit<{
            id: string;
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            role: string;
            isActive: boolean;
            lastLogin: Date | null;
            createdAt: Date;
            updatedAt: Date;
            emailVerified: boolean;
            emailVerifyToken: string | null;
            emailVerifyExpires: Date | null;
            passwordResetToken: string | null;
            passwordResetExpires: Date | null;
            failedLoginAttempts: number;
            accountLockedUntil: Date | null;
            lastFailedLogin: Date | null;
            passwordChangedAt: Date;
            mustChangePassword: boolean;
        }, "password">;
    }>;
    logoutAll(req: Request & {
        user: Omit<User, 'password'>;
    }, res: Response): Promise<{
        message: string;
    }>;
}
