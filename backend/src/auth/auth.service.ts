import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
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

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: Omit<User, 'password'>): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenRecord = await this.prismaService.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedException('User account is disabled');
    }

    // Generate new tokens
    const payload: JwtPayload = {
      sub: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    };

    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(tokenRecord.user.id);

    // Remove old refresh token
    await this.prismaService.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prismaService.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prismaService.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prismaService.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findById(payload.sub);
    
    if (!user || !user.isActive) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  // Password utilities
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}