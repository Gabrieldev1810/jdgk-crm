import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { RequestUser } from '../types/request-user.type';
import { AuditLoggingService } from '../../common/services/audit-logging.service';
import { PermissionCacheService } from '../../common/services/permission-cache.service';
import { RateLimitingService } from '../../common/services/rate-limiting.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private auditLogging: AuditLoggingService,
    private permissionCache: PermissionCacheService,
    private rateLimiting: RateLimitingService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      // Log unauthorized access attempt
      await this.auditLogging.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        ipAddress: request.ip,
        userAgent: request.get('User-Agent'),
        details: { message: 'No access token provided', url: request.url }
      });

      throw new UnauthorizedException('Access token is required');
    }

    try {
      // Verify JWT token
      const payload = this.jwtService.verify(token);
      
      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const userId = payload.sub;
      
      // Check rate limiting for this user and action
      const actionKey = `${request.method}:${request.url}`;
      const rateLimitPassed = await this.rateLimiting.checkRateLimit(
        userId,
        actionKey,
        request.ip
      );

      if (!rateLimitPassed) {
        await this.auditLogging.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          userId,
          ipAddress: request.ip,
          userAgent: request.get('User-Agent'),
          details: { message: `Rate limit exceeded for action: ${actionKey}`, action: actionKey }
        });

        throw new ForbiddenException('Rate limit exceeded. Please try again later.');
      }

      // Get user permissions from cache (falls back to database if not cached)
      const userPermissions = await this.permissionCache.getUserPermissions(userId);

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        // Log failed authorization attempt
        await this.auditLogging.logSecurityEvent({
          type: 'PERMISSION_DENIED',
          severity: 'MEDIUM',
          userId,
          ipAddress: request.ip,
          userAgent: request.get('User-Agent'),
          details: { 
            message: 'Insufficient permissions', 
            required: requiredPermissions,
            missing: requiredPermissions.filter(p => !userPermissions.includes(p)),
            url: request.url
          }
        });

        throw new ForbiddenException(
          `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
        );
      }

      // Get user email from database for complete user context
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      // Add user info to request for downstream use
      const requestUser: RequestUser = {
        id: userId,
        email: user?.email || 'unknown',
        permissions: userPermissions
      };
      request.authUser = requestUser;

      return true;

    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}