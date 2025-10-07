import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';

    // Set additional security headers
    const securityHeaders = {
      // API versioning and identification
      'X-API-Version': '1.0.0',
      'X-Service-Name': 'dial-craft-crm',
      
      // Security policy headers
      'X-Security-Policy': 'strict',
      'X-Rate-Limit-Policy': 'standard',
      
      // Additional security headers for enhanced protection
      'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
      'X-Download-Options': 'noopen',
      'X-Permitted-Cross-Domain-Policies': 'none',
      
      // Cache control for sensitive endpoints
      'Cache-Control': req.path.includes('/auth') || req.path.includes('/users') 
        ? 'no-store, no-cache, must-revalidate, private' 
        : 'no-cache, no-store, must-revalidate',
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Additional CSP for API responses
      'Content-Security-Policy': isDevelopment 
        ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*" 
        : "default-src 'self'; connect-src 'self' https://*.digiedgesolutions.cloud",
    };

    // Apply production-only headers
    if (isProduction) {
      Object.assign(securityHeaders, {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Expect-CT': 'max-age=86400, enforce',
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