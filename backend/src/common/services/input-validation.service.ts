import { Injectable, BadRequestException } from '@nestjs/common';
import { AuditLoggingService } from './audit-logging.service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export interface SecurityScanResult {
  hasSuspiciousContent: boolean;
  threats: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@Injectable()
export class InputValidationService {
  constructor(private auditService: AuditLoggingService) {}

  /**
   * Comprehensive input validation and sanitization
   */
  async validateAndSanitize(
    data: any,
    schema: any,
    context: { userId?: string; ipAddress?: string; endpoint?: string }
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    let sanitizedData: any;

    try {
      // 1. Security scan for suspicious content
      const securityScan = await this.performSecurityScan(data, context);
      
      if (securityScan.hasSuspiciousContent) {
        // Log security threat
        await this.auditService.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: securityScan.riskLevel,
          userId: context.userId,
          ipAddress: context.ipAddress,
          endpoint: context.endpoint,
          details: {
            threats: securityScan.threats,
            inputData: this.sanitizeForLogging(data),
          },
        });

        if (securityScan.riskLevel === 'HIGH' || securityScan.riskLevel === 'CRITICAL') {
          throw new BadRequestException('Input contains suspicious content');
        }
      }

      // 2. Schema validation
      sanitizedData = await this.validateAgainstSchema(data, schema);

      // 3. Additional business logic validation
      const businessValidation = await this.validateBusinessRules(sanitizedData, context);
      errors.push(...businessValidation.errors);

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 ? sanitizedData : undefined,
      };
    } catch (error) {
      errors.push(error.message);
      return {
        isValid: false,
        errors,
      };
    }
  }

  /**
   * Scan input for security threats
   */
  private async performSecurityScan(data: any, context: any): Promise<SecurityScanResult> {
    const threats: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    const dataStr = JSON.stringify(data).toLowerCase();

    // SQL Injection patterns
    const sqlPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+.+set/i,
      /exec\s*\(/i,
      /script/i,
      /'.*or.*'.*='/i,
      /'\s*or\s*1\s*=\s*1/i,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(dataStr)) {
        threats.push('Potential SQL injection');
        riskLevel = 'HIGH';
        break;
      }
    }

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(dataStr)) {
        threats.push('Potential XSS attack');
        riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
        break;
      }
    }

    // Command injection patterns
    const commandPatterns = [
      /;\s*(rm|del|format|shutdown)/i,
      /\|\s*(curl|wget|nc|netcat)/i,
      /`.*`/,
      /\$\(.*\)/,
    ];

    for (const pattern of commandPatterns) {
      if (pattern.test(dataStr)) {
        threats.push('Potential command injection');
        riskLevel = 'CRITICAL';
        break;
      }
    }

    // Path traversal patterns
    const pathTraversalPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e%2f/i,
      /%2e%2e%5c/i,
    ];

    for (const pattern of pathTraversalPatterns) {
      if (pattern.test(dataStr)) {
        threats.push('Potential path traversal');
        riskLevel = riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
        break;
      }
    }

    // Check for excessive size (potential DoS)
    const maxSize = 1024 * 1024; // 1MB
    if (JSON.stringify(data).length > maxSize) {
      threats.push('Excessive payload size');
      riskLevel = riskLevel === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM';
    }

    return {
      hasSuspiciousContent: threats.length > 0,
      threats,
      riskLevel,
    };
  }

  /**
   * Validate against schema (simplified version)
   */
  private async validateAgainstSchema(data: any, schema: any): Promise<any> {
    // This would typically use a library like Joi, Yup, or class-validator
    // For now, we'll implement basic validation
    
    if (!schema) {
      return data;
    }

    const sanitized = { ...data };

    // Remove extra fields not in schema
    for (const key in sanitized) {
      if (!schema[key]) {
        delete sanitized[key];
      }
    }

    // Validate required fields
    for (const field in schema) {
      const rule = schema[field];
      if (rule.required && !sanitized[field]) {
        throw new Error(`${field} is required`);
      }

      if (sanitized[field] !== undefined) {
        sanitized[field] = this.sanitizeField(sanitized[field], rule);
      }
    }

    return sanitized;
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(data: any, context: any): Promise<{ errors: string[] }> {
    const errors: string[] = [];

    // Example business rules
    if (data.email && !this.isValidBusinessEmail(data.email)) {
      errors.push('Email domain not allowed for business use');
    }

    if (data.password && !this.isStrongPassword(data.password)) {
      errors.push('Password does not meet security requirements');
    }

    // Rate limiting check (simplified)
    if (await this.isRateLimited(context.userId, context.ipAddress, context.endpoint)) {
      errors.push('Rate limit exceeded');
    }

    return { errors };
  }

  /**
   * Sanitize individual field
   */
  private sanitizeField(value: any, rule: any): any {
    if (typeof value === 'string') {
      // Remove control characters
      value = value.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
      
      // Trim whitespace
      value = value.trim();
      
      // Limit length
      if (rule.maxLength && value.length > rule.maxLength) {
        value = value.substring(0, rule.maxLength);
      }

      // HTML encode if needed
      if (rule.htmlEncode) {
        value = this.htmlEncode(value);
      }
    }

    return value;
  }

  /**
   * HTML encode string
   */
  private htmlEncode(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Validate business email domain
   */
  private isValidBusinessEmail(email: string): boolean {
    const blockedDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1];
    return !blockedDomains.includes(domain);
  }

  /**
   * Check password strength
   */
  private isStrongPassword(password: string): boolean {
    // At least 8 characters, with uppercase, lowercase, number, and special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  }

  /**
   * Simple rate limiting check (in production, use Redis or dedicated service)
   */
  private async isRateLimited(userId?: string, ipAddress?: string, endpoint?: string): Promise<boolean> {
    // This would typically check against a rate limiting store
    // For now, return false (no rate limiting)
    return false;
  }

  /**
   * Sanitize data for logging (remove sensitive info)
   */
  private sanitizeForLogging(data: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = Array.isArray(data) ? [] : {};
      
      for (const [key, value] of Object.entries(data)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeForLogging(value);
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }
    
    return data;
  }
}