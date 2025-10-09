import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PermissionCacheService } from '../../common/services/permission-cache.service';
import { DynamicPermissionService, PermissionContext } from '../../common/services/dynamic-permission.service';
import { RateLimitingService } from '../../common/services/rate-limiting.service';
import { AuditLoggingService } from '../../common/services/audit-logging.service';

@Injectable()
export class EnhancedPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(EnhancedPermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private permissionCache: PermissionCacheService,
    private dynamicPermission: DynamicPermissionService,
    private rateLimiting: RateLimitingService,
    private auditLogging: AuditLoggingService,
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
      
      // Enhanced rate limiting check
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
          details: { 
            message: 'Rate limit exceeded',
            action: actionKey,
            url: request.url
          }
        });

        throw new ForbiddenException('Rate limit exceeded. Please try again later.');
      }

      // Get user permissions from cache
      const userPermissions = await this.permissionCache.getUserPermissions(userId);

      // Basic permission check
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(p => !userPermissions.includes(p));
        
        await this.auditLogging.logSecurityEvent({
          type: 'PERMISSION_DENIED',
          severity: 'MEDIUM',
          userId,
          ipAddress: request.ip,
          userAgent: request.get('User-Agent'),
          details: { 
            message: 'Insufficient permissions', 
            required: requiredPermissions,
            missing: missingPermissions,
            url: request.url
          }
        });

        throw new ForbiddenException(
          `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
        );
      }

      // Enhanced Dynamic Permission Evaluation
      const permissionContext: PermissionContext = {
        userId,
        resource: this.extractResourceFromUrl(request.url),
        action: this.mapHttpMethodToAction(request.method),
        resourceId: request.params?.id || request.body?.id,
        ipAddress: request.ip,
        userAgent: request.get('User-Agent'),
        timestamp: new Date(),
      };

      const dynamicResult = await this.dynamicPermission.evaluatePermission(permissionContext);

      if (!dynamicResult.granted) {
        await this.auditLogging.logSecurityEvent({
          type: 'DYNAMIC_PERMISSION_DENIED',
          severity: dynamicResult.riskScore > 70 ? 'HIGH' : 'MEDIUM',
          userId,
          ipAddress: request.ip,
          userAgent: request.get('User-Agent'),
          details: {
            message: dynamicResult.reason,
            restrictions: dynamicResult.restrictions,
            riskScore: dynamicResult.riskScore,
            context: permissionContext,
            url: request.url
          }
        });

        throw new ForbiddenException(
          `Dynamic permission denied: ${dynamicResult.reason}`
        );
      }

      // Log high-risk access (even if granted)
      if (dynamicResult.riskScore > 50) {
        await this.auditLogging.logSecurityEvent({
          type: 'HIGH_RISK_ACCESS',
          severity: 'MEDIUM',
          userId,
          ipAddress: request.ip,
          userAgent: request.get('User-Agent'),
          details: {
            message: 'High-risk access granted with monitoring',
            riskScore: dynamicResult.riskScore,
            restrictions: dynamicResult.restrictions,
            context: permissionContext,
            url: request.url
          }
        });
      }

      // Add security context to request for downstream use
      request.securityContext = {
        userId,
        userEmail: payload.email,
        userRole: payload.role,
        permissions: userPermissions,
        dynamicResult,
        riskScore: dynamicResult.riskScore,
        ipAddress: request.ip,
        userAgent: request.get('User-Agent'),
      };

      // Log successful access
      await this.auditLogging.logUserAction({
        actorId: userId,
        action: 'ACCESS_GRANTED',
        resource: permissionContext.resource,
        resourceId: permissionContext.resourceId,
        metadata: {
          permissions: requiredPermissions,
          riskScore: dynamicResult.riskScore,
          restrictions: dynamicResult.restrictions,
          ipAddress: request.ip,
          userAgent: request.get('User-Agent'),
        },
      });

      return true;

    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Permission guard error:', error);

      await this.auditLogging.logSecurityEvent({
        type: 'PERMISSION_GUARD_ERROR',
        severity: 'HIGH',
        ipAddress: request.ip,
        userAgent: request.get('User-Agent'),
        details: {
          error: error.message,
          stack: error.stack,
          url: request.url
        }
      });

      throw new UnauthorizedException('Permission validation failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractResourceFromUrl(url: string): string {
    // Extract resource from URL path (e.g., /api/accounts/123 -> accounts)
    const pathParts = url.split('/').filter(part => part.length > 0);
    
    // Skip 'api' prefix if present
    const resourceIndex = pathParts[0] === 'api' ? 1 : 0;
    return pathParts[resourceIndex] || 'unknown';
  }

  private mapHttpMethodToAction(method: string): string {
    const actionMap: { [key: string]: string } = {
      'GET': 'view',
      'POST': 'create',
      'PUT': 'update',
      'PATCH': 'update',
      'DELETE': 'delete',
    };

    return actionMap[method.toUpperCase()] || 'unknown';
  }
}