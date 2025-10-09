import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { AuditLoggingService } from '../services/audit-logging.service';
import { Reflector } from '@nestjs/core';

export const AUDIT_LOG_KEY = 'auditLog';

export interface AuditConfig {
  action: string;
  resource: string;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
  sensitiveFields?: string[];
}

/**
 * Decorator to configure audit logging for specific endpoints
 */
export const AuditLog = (config: AuditConfig) =>
  Reflector.createDecorator<AuditConfig>()(config);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditLoggingService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditConfig = this.reflector.get<AuditConfig>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    // Skip audit logging if not configured for this endpoint
    if (!auditConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();
    
    // Extract request information
    const requestInfo = this.extractRequestInfo(request, auditConfig);
    
    return next.handle().pipe(
      tap((response) => {
        // Log successful operation
        this.logAuditEvent(
          auditConfig,
          requestInfo,
          true,
          response,
          Date.now() - startTime,
        );
      }),
      catchError((error) => {
        // Log failed operation
        this.logAuditEvent(
          auditConfig,
          requestInfo,
          false,
          null,
          Date.now() - startTime,
          error.message || 'Unknown error',
        );
        
        // Re-throw the error to maintain normal error handling flow
        throw error;
      }),
    );
  }

  private extractRequestInfo(request: Request, config: AuditConfig) {
    const user = (request as any).authUser; // From our PermissionsGuard
    
    const info = {
      userId: user?.id,
      userEmail: user?.email,
      ipAddress: this.getClientIpAddress(request),
      userAgent: request.get('User-Agent'),
      endpoint: request.url,
      method: request.method,
      requestId: this.generateRequestId(),
      sessionId: this.extractSessionId(request),
    };

    // Include request body if configured (excluding sensitive data)
    if (config.includeRequestBody && request.body) {
      info['requestBody'] = this.sanitizeObject(
        request.body,
        config.sensitiveFields || ['password', 'token', 'secret'],
      );
    }

    // Include path parameters
    if (request.params && Object.keys(request.params).length > 0) {
      info['pathParams'] = request.params;
    }

    // Include query parameters
    if (request.query && Object.keys(request.query).length > 0) {
      info['queryParams'] = request.query;
    }

    return info;
  }

  private async logAuditEvent(
    config: AuditConfig,
    requestInfo: any,
    success: boolean,
    response?: any,
    duration?: number,
    errorMessage?: string,
  ) {
    try {
      const auditData = {
        userId: requestInfo.userId,
        userEmail: requestInfo.userEmail,
        action: config.action,
        resource: config.resource,
        resourceId: this.extractResourceId(requestInfo, response),
        details: {
          ...requestInfo.requestBody && { requestBody: requestInfo.requestBody },
          ...requestInfo.pathParams && { pathParams: requestInfo.pathParams },
          ...requestInfo.queryParams && { queryParams: requestInfo.queryParams },
          ...config.includeResponseBody && response && { 
            responseBody: this.sanitizeObject(response, config.sensitiveFields || [])
          },
          duration: duration ? `${duration}ms` : undefined,
        },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        success,
        errorMessage,
        requestId: requestInfo.requestId,
        sessionId: requestInfo.sessionId,
      };

      await this.auditService.logAuditEvent(auditData);
    } catch (error) {
      // Don't let audit logging failures break the main request flow
      console.error('Failed to log audit event:', error);
    }
  }

  private extractResourceId(requestInfo: any, response?: any): string | null {
    // Try to extract resource ID from path parameters
    if (requestInfo.pathParams?.id) {
      return requestInfo.pathParams.id;
    }

    // Try to extract from response if it's a creation operation
    if (response?.id) {
      return response.id;
    }

    return null;
  }

  private sanitizeObject(obj: any, sensitiveFields: string[]): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value, sensitiveFields);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private getClientIpAddress(request: Request): string {
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      (request.connection as any)?.socket?.remoteAddress ||
      request.get('X-Forwarded-For') ||
      request.get('X-Real-IP') ||
      'unknown'
    );
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private extractSessionId(request: Request): string | null {
    // Extract session ID from cookie or header if available
    return request.get('X-Session-ID') || null;
  }
}