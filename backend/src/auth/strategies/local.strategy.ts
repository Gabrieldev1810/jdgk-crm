import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';
import { AuditLoggingService } from '../../common/services/audit-logging.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private auditService: AuditLoggingService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true, // This allows us to access the request object
    });
  }

  async validate(req: any, email: string, password: string): Promise<Omit<User, 'password'>> {
    try {
      const user = await this.authService.validateUser(email, password);
      if (!user) {
        // Log failed login attempt
        await this.auditService.logAuthEvent(
          'LOGIN_FAILED',
          undefined, // No user ID for failed login
          email,
          req.ip,
          req.get('User-Agent'),
          {
            reason: 'Invalid credentials',
            timestamp: new Date().toISOString(),
          },
          false,
          'Invalid email or password'
        );
        throw new UnauthorizedException('Invalid credentials');
      }
      return user;
    } catch (error) {
      console.error('LocalStrategy validation error:', error);
      
      // If it's not already an UnauthorizedException, log the failed attempt
      if (!(error instanceof UnauthorizedException)) {
        await this.auditService.logAuthEvent(
          'LOGIN_FAILED',
          undefined,
          email,
          req.ip,
          req.get('User-Agent'),
          {
            reason: 'Authentication error',
            error: error.message,
            timestamp: new Date().toISOString(),
          },
          false,
          error.message
        );
        throw new UnauthorizedException('Authentication failed');
      }
      
      throw error;
    }
  }
}