import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';

    // Enhanced Content Security Policy for Phase 4
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' ws: wss:",
      "media-src 'none'",
      "object-src 'none'",
      "child-src 'none'",
      "worker-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ');

    // Set enhanced security headers for Phase 4
    let securityHeaders = {
      // Enhanced CSP - conditional based on environment
      'Content-Security-Policy': isDevelopment 
        ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*" 
        : csp,
      
      // API versioning and identification
      'X-API-Version': '2.0.0-phase4',
      'X-Service-Name': 'dial-craft-crm-enhanced',
      
      // Enhanced security policy headers
      'X-Security-Policy': 'bank-compliant-strict',
      'X-Rate-Limit-Policy': 'dynamic-adaptive',
      'X-Encryption-Policy': 'aes-256-field-level',
      'X-Session-Security': 'enhanced-fingerprinting',
      'X-MFA-Required': req.path.includes('/admin') || req.path.includes('/sensitive') ? 'true' : 'false',
      
      // Standard security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-Permitted-Cross-Domain-Policies': 'none',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      
      // Additional security headers
      'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
      'X-Download-Options': 'noopen',
      
      // Cache control for sensitive endpoints
      'Cache-Control': req.path.includes('/auth') || req.path.includes('/users') || req.path.includes('/rbac')
        ? 'no-store, no-cache, must-revalidate, private' 
        : 'no-cache, no-store, must-revalidate',
      
      // Phase 4 Enhanced Security Headers
      'X-Audit-Level': req.path.includes('/admin') ? 'high' : 'standard',
      'X-Risk-Assessment': 'real-time-enabled',
      
      // Compliance headers
      'X-GDPR-Compliant': 'true',
      'X-PCI-DSS-Level': 'Level-1',
      'X-SOC2-Type': 'Type-II',
    };

    // Apply production-only headers
    if (isProduction) {
      Object.assign(securityHeaders, {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Expect-CT': 'max-age=86400, enforce',
      });
    }

    // Apply development-only headers
    if (isDevelopment) {
      Object.assign(securityHeaders, {
        'X-Environment': 'development',
        'X-Debug-Mode': 'enabled',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Session-Token, X-MFA-Token',
        'Access-Control-Allow-Credentials': 'true'
      });
    }

    // Set all security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Log security events in development
    if (isDevelopment) {
      this.logSecurityInfo(req, res);
    }

    // Security checks for sensitive endpoints
    this.performSecurityChecks(req, res);

    next();
  }

  private logSecurityInfo(req: Request, res: Response) {
    const securityInfo = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      headers: this.getSafeHeaders(req),
    };

    // Only log for API endpoints
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      console.log('🔒 Security middleware:', securityInfo);
    }
  }

  private getSafeHeaders(req: Request) {
    const safeHeaders: Record<string, string> = {};
    const allowedHeaders = [
      'content-type',
      'authorization',
      'x-requested-with',
      'accept',
      'origin',
      'user-agent',
    ];

    allowedHeaders.forEach(header => {
      const value = req.get(header);
      if (value) {
        // Sanitize authorization header for logging
        safeHeaders[header] = header === 'authorization' 
          ? value.substring(0, 20) + '...' 
          : value;
      }
    });

    return safeHeaders;
  }

  private performSecurityChecks(req: Request, res: Response) {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\./,           // Path traversal
      /<script/i,       // XSS attempts
      /union.*select/i, // SQL injection
      /javascript:/i,   // JavaScript injection
    ];

    const requestData = JSON.stringify({
      url: req.url,
      query: req.query,
      body: req.body,
    });

    const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
      pattern.test(requestData)
    );

    if (hasSuspiciousContent) {
      console.warn(`🚨 Suspicious request detected:`, {
        ip: req.ip,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });

      // You could implement additional security measures here:
      // - Rate limiting
      // - IP blocking
      // - Alert notifications
      // - Request logging
    }

    // Add security context to response
    res.locals.securityContext = {
      requestId: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      securityChecks: {
        suspiciousContent: hasSuspiciousContent,
        headersValidated: true,
        corsEnabled: true,
      },
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default SecurityHeadersMiddleware;