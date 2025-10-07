import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthDebugService } from './auth-debug.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { User } from '@prisma/client';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private authDebugService: AuthDebugService
  ) {}

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request & { user: Omit<User, 'password'> },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(req.user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: process.env.NODE_ENV === 'production' ? '.digiedgesolutions.cloud' : undefined,
    });

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @ApiOperation({ summary: 'Debug login - simple token response' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post('login-debug')
  @HttpCode(HttpStatus.OK)
  async loginDebug(@Body() loginDto: LoginDto) {
    return this.authDebugService.loginDebug(loginDto.email, loginDto.password);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies.refreshToken;
    
    console.log('Refresh token request received');
    console.log('Cookies:', req.cookies);
    console.log('Refresh token present:', !!refreshToken);
    
    if (!refreshToken) {
      console.log('No refresh token in cookies');
      throw new UnauthorizedException('Refresh token not provided');
    }

    try {
      const result = await this.authService.refreshToken(refreshToken);

      // Set new refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: process.env.NODE_ENV === 'production' ? '.digiedgesolutions.cloud' : undefined,
      });

      console.log('Token refresh successful');
      return {
        accessToken: result.accessToken,
      };
    } catch (error) {
      console.log('Token refresh failed:', error.message);
      throw error;
    }
  }

  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    return { message: 'Logout successful' };
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: Request & { user: Omit<User, 'password'> }) {
    return {
      user: req.user,
    };
  }

  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Req() req: Request & { user: Omit<User, 'password'> },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(req.user.id);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    return { message: 'Logged out from all devices' };
  }
}