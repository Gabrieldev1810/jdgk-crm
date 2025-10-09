import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as validator from 'validator';
import * as DOMPurify from 'isomorphic-dompurify';

interface ValidationRule {
  field: string;
  type: 'string' | 'email' | 'uuid' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  sanitize?: boolean;
  allowedValues?: any[];
}

interface ValidationConfig {
  body?: ValidationRule[];
  query?: ValidationRule[];
  params?: ValidationRule[];
}

@Injectable()
export class InputValidationMiddleware implements NestMiddleware {
  
  private readonly validationConfigs: Map<string, ValidationConfig> = new Map();

  constructor() {
    this.initializeValidationConfigs();
  }

  use(req: Request, res: Response, next: NextFunction) {
    try {
      const routeKey = this.getRouteKey(req.method, req.path);
      const config = this.validationConfigs.get(routeKey);
      
      if (config) {
        this.validateAndSanitizeRequest(req, config);
      }
      
      // Always perform basic sanitization on all string inputs
      this.performBasicSanitization(req);
      
      next();
    } catch (error) {
      throw new BadRequestException(`Input validation failed: ${error.message}`);
    }
  }

  private initializeValidationConfigs(): void {
    // RBAC Role Management
    this.validationConfigs.set('POST:/api/rbac/roles', {
      body: [
        { field: 'name', type: 'string', required: true, minLength: 2, maxLength: 50, sanitize: true },
        { field: 'description', type: 'string', maxLength: 500, sanitize: true },
        { field: 'isActive', type: 'boolean' },
        { field: 'permissions', type: 'array' }
      ]
    });

    this.validationConfigs.set('PUT:/api/rbac/roles/:id', {
      params: [
        { field: 'id', type: 'uuid', required: true }
      ],
      body: [
        { field: 'name', type: 'string', minLength: 2, maxLength: 50, sanitize: true },
        { field: 'description', type: 'string', maxLength: 500, sanitize: true },
        { field: 'isActive', type: 'boolean' },
        { field: 'permissions', type: 'array' }
      ]
    });

    // RBAC Permission Management
    this.validationConfigs.set('POST:/api/rbac/permissions', {
      body: [
        { field: 'code', type: 'string', required: true, minLength: 3, maxLength: 100, pattern: /^[a-z]+\.[a-z_]+$/ },
        { field: 'name', type: 'string', required: true, minLength: 3, maxLength: 100, sanitize: true },
        { field: 'category', type: 'string', required: true, minLength: 2, maxLength: 50, sanitize: true },
        { field: 'resource', type: 'string', required: true, minLength: 2, maxLength: 50, sanitize: true },
        { field: 'action', type: 'string', required: true, minLength: 2, maxLength: 50, sanitize: true },
        { field: 'description', type: 'string', maxLength: 500, sanitize: true }
      ]
    });

    // User Management
    this.validationConfigs.set('POST:/api/users', {
      body: [
        { field: 'email', type: 'email', required: true, sanitize: true },
        { field: 'firstName', type: 'string', required: true, minLength: 1, maxLength: 50, sanitize: true },
        { field: 'lastName', type: 'string', required: true, minLength: 1, maxLength: 50, sanitize: true },
        { field: 'password', type: 'string', required: true, minLength: 8, maxLength: 128 },
        { field: 'role', type: 'string', allowedValues: ['ADMIN', 'SUPERVISOR', 'AGENT', 'VIEWER'], sanitize: true }
      ]
    });

    this.validationConfigs.set('PATCH:/api/users/:id', {
      params: [
        { field: 'id', type: 'uuid', required: true }
      ],
      body: [
        { field: 'email', type: 'email', sanitize: true },
        { field: 'firstName', type: 'string', minLength: 1, maxLength: 50, sanitize: true },
        { field: 'lastName', type: 'string', minLength: 1, maxLength: 50, sanitize: true },
        { field: 'isActive', type: 'boolean' }
      ]
    });

    // Account Management
    this.validationConfigs.set('POST:/api/accounts', {
      body: [
        { field: 'companyName', type: 'string', required: true, minLength: 1, maxLength: 200, sanitize: true },
        { field: 'contactName', type: 'string', maxLength: 100, sanitize: true },
        { field: 'email', type: 'email', sanitize: true },
        { field: 'phone', type: 'string', maxLength: 20, pattern: /^[\+\-\s\(\)0-9]+$/, sanitize: true },
        { field: 'address', type: 'string', maxLength: 500, sanitize: true },
        { field: 'industry', type: 'string', maxLength: 100, sanitize: true },
        { field: 'notes', type: 'string', maxLength: 2000, sanitize: true }
      ]
    });

    // Call Management
    this.validationConfigs.set('POST:/api/calls', {
      body: [
        { field: 'accountId', type: 'uuid', required: true },
        { field: 'phoneNumber', type: 'string', required: true, pattern: /^[\+\-\s\(\)0-9]+$/, sanitize: true },
        { field: 'callType', type: 'string', required: true, allowedValues: ['INBOUND', 'OUTBOUND'], sanitize: true },
        { field: 'notes', type: 'string', maxLength: 2000, sanitize: true }
      ]
    });

    // Authentication
    this.validationConfigs.set('POST:/api/auth/login', {
      body: [
        { field: 'email', type: 'email', required: true, sanitize: true },
        { field: 'password', type: 'string', required: true, minLength: 1, maxLength: 128 }
      ]
    });
  }

  private validateAndSanitizeRequest(req: Request, config: ValidationConfig): void {
    // Validate and sanitize body
    if (config.body && req.body) {
      this.validateObject(req.body, config.body, 'body');
    }

    // Validate and sanitize query parameters
    if (config.query && req.query) {
      this.validateObject(req.query, config.query, 'query');
    }

    // Validate and sanitize path parameters
    if (config.params && req.params) {
      this.validateObject(req.params, config.params, 'params');
    }
  }

  private validateObject(obj: any, rules: ValidationRule[], context: string): void {
    for (const rule of rules) {
      const value = obj[rule.field];
      
      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        throw new Error(`${context}.${rule.field} is required`);
      }

      // Skip validation for undefined optional fields
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      this.validateType(value, rule, `${context}.${rule.field}`);

      // Length validation
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        throw new Error(`${context}.${rule.field} must be at least ${rule.minLength} characters`);
      }
      
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        throw new Error(`${context}.${rule.field} must not exceed ${rule.maxLength} characters`);
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        throw new Error(`${context}.${rule.field} has invalid format`);
      }

      // Allowed values validation
      if (rule.allowedValues && !rule.allowedValues.includes(value)) {
        throw new Error(`${context}.${rule.field} must be one of: ${rule.allowedValues.join(', ')}`);
      }

      // Sanitize string values
      if (rule.sanitize && typeof value === 'string') {
        obj[rule.field] = this.sanitizeString(value);
      }
    }
  }

  private validateType(value: any, rule: ValidationRule, fieldPath: string): void {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`${fieldPath} must be a string`);
        }
        break;
      
      case 'email':
        if (typeof value !== 'string' || !validator.isEmail(value)) {
          throw new Error(`${fieldPath} must be a valid email address`);
        }
        break;
      
      case 'uuid':
        if (typeof value !== 'string' || !validator.isUUID(value)) {
          throw new Error(`${fieldPath} must be a valid UUID`);
        }
        break;
      
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new Error(`${fieldPath} must be a number`);
        }
        break;
      
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`${fieldPath} must be a boolean`);
        }
        break;
      
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`${fieldPath} must be an array`);
        }
        break;
      
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          throw new Error(`${fieldPath} must be an object`);
        }
        break;
    }
  }

  private performBasicSanitization(req: Request): void {
    // Recursively sanitize all string values in request
    if (req.body) {
      this.sanitizeObjectRecursively(req.body);
    }
    if (req.query) {
      this.sanitizeObjectRecursively(req.query);
    }
  }

  private sanitizeObjectRecursively(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = this.sanitizeObjectRecursively(obj[i]);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          obj[key] = this.sanitizeObjectRecursively(obj[key]);
        }
      }
    }
    
    return obj;
  }

  private sanitizeString(str: string): string {
    // Remove potentially dangerous HTML/script content
    const cleaned = DOMPurify.sanitize(str, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    });
    
    // Trim whitespace
    return cleaned.trim();
  }

  private getRouteKey(method: string, path: string): string {
    // Normalize path parameters to generic pattern
    const normalizedPath = path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
    
    return `${method}:${normalizedPath}`;
  }
}