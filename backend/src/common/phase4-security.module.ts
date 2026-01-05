import { Module, Global } from '@nestjs/common';
import { DynamicPermissionService } from './services/dynamic-permission.service';
import { MultiFactorAuthService } from './services/mfa.service';
import { DataEncryptionService } from './services/data-encryption.service';
import { SessionSecurityService } from './services/session-security.service';
import { EnhancedPermissionsGuard } from '../auth/guards/enhanced-permissions.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLoggingService } from './services/audit-logging.service';
import { PermissionCacheService } from './services/permission-cache.service';
import { RateLimitingService } from './services/rate-limiting.service';
import { SecuritySettingsService } from './services/security-settings.service';
import { JwtService } from '@nestjs/jwt';

@Global()
@Module({
  providers: [
    // Core Phase 4 Security Services
    DynamicPermissionService,
    MultiFactorAuthService,
    DataEncryptionService,
    SessionSecurityService,
    SecuritySettingsService,
    
    // Enhanced Guards
    EnhancedPermissionsGuard,
    
    // Dependencies
    PrismaService,
    AuditLoggingService,
    PermissionCacheService,
    RateLimitingService,
    JwtService,
  ],
  exports: [
    DynamicPermissionService,
    MultiFactorAuthService,
    DataEncryptionService,
    SessionSecurityService,
    EnhancedPermissionsGuard,
    SecuritySettingsService,
    AuditLoggingService,
  ],
})
export class Phase4SecurityModule {}

/**
 * PHASE 4 ADVANCED SECURITY FEATURES
 * 
 * This module provides enterprise-grade security enhancements for the Dial-Craft CRM:
 * 
 * 🔐 DYNAMIC PERMISSION SCOPING
 * - Context-aware permissions based on data ownership, time, and location
 * - Real-time risk assessment and adaptive access control
 * - Automatic anomaly detection and response
 * 
 * 🛡️ ENHANCED AUTHENTICATION
 * - Multi-Factor Authentication (TOTP) support
 * - Advanced session security with device fingerprinting
 * - Concurrent session management and limits
 * 
 * 🔒 DATA PROTECTION
 * - Field-level encryption for sensitive PII/PCI data
 * - Format-preserving encryption for phone numbers and emails
 * - Searchable encryption with secure hashing
 * 
 * 📊 SECURITY MONITORING
 * - Advanced audit logging with risk scoring
 * - Real-time threat detection and alerting
 * - Comprehensive security event tracking
 * 
 * 🌐 WEB SECURITY
 * - Enhanced Content Security Policy (CSP)
 * - Advanced security headers for OWASP compliance
 * - Production-grade CORS and security middleware
 * 
 * INTEGRATION REQUIREMENTS:
 * 1. Update Prisma schema with security tables (sessions, mfa_secrets, device_fingerprints)
 * 2. Configure Redis for enhanced caching and session management
 * 3. Set environment variables for encryption keys and security settings
 * 4. Update frontend to support MFA flows and enhanced security
 * 
 * COMPLIANCE FEATURES:
 * - Bank-level security standards compliance
 * - PCI DSS data protection requirements
 * - GDPR privacy and data protection
 * - SOC 2 audit trail requirements
 */