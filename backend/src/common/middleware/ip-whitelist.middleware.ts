import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecuritySettingsService } from '../services/security-settings.service';
import { AuditLoggingService } from '../services/audit-logging.service';

@Injectable()
export class IpWhitelistMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IpWhitelistMiddleware.name);

  constructor(
    private securitySettingsService: SecuritySettingsService,
    private auditLoggingService: AuditLoggingService
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const config = this.securitySettingsService.getIpWhitelistConfig();

    if (!config.enabled) {
      return next();
    }

    // Get client IP
    // Handle proxy headers if behind load balancer/proxy
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                     req.socket.remoteAddress || 
                     '';
    
    // Clean up IP (remove IPv6 prefix if present)
    const cleanIp = clientIp.replace('::ffff:', '');

    // Allow localhost for internal calls/development
    if (cleanIp === '127.0.0.1' || cleanIp === '::1') {
      return next();
    }

    if (config.allowedIps.length > 0 && !config.allowedIps.includes(cleanIp)) {
      this.logger.warn(`Access denied for IP: ${cleanIp}`);
      
      // Log security event
      this.auditLoggingService.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'HIGH',
        ipAddress: cleanIp,
        userAgent: req.headers['user-agent'],
        endpoint: req.originalUrl,
        method: req.method,
        details: {
          reason: 'IP_NOT_WHITELISTED',
          allowedIps: config.allowedIps
        }
      });

      throw new ForbiddenException('Access denied: IP not whitelisted');
    }

    next();
  }
}
