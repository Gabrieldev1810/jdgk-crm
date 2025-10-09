import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLoggingService } from './audit-logging.service';
import * as crypto from 'crypto';

export interface DeviceFingerprint {
  userAgent: string;
  ipAddress: string;
  acceptLanguage?: string;
  acceptEncoding?: string;
  screenResolution?: string;
  timezone?: string;
  platform?: string;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  riskScore: number;
  deviceTrusted: boolean;
}

export interface SecurityFlags {
  suspiciousLocation: boolean;
  newDevice: boolean;
  highRiskSession: boolean;
  concurrentSessions: number;
  requiresAdditionalAuth: boolean;
}

@Injectable()
export class SessionSecurityService {
  private readonly logger = new Logger(SessionSecurityService.name);
  
  // Session configuration
  private readonly maxConcurrentSessions = 3;
  private readonly sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  private readonly highRiskThreshold = 70;

  constructor(
    private prisma: PrismaService,
    private auditService: AuditLoggingService,
  ) {}

  /**
   * Create new secure session
   */
  async createSession(
    userId: string,
    deviceFingerprint: DeviceFingerprint,
    additionalData?: Record<string, any>
  ): Promise<SessionInfo> {
    try {
      const sessionId = this.generateSessionId();
      const deviceId = this.generateDeviceId(deviceFingerprint);
      
      // Analyze session security
      const securityAnalysis = await this.analyzeSessionSecurity(userId, deviceFingerprint);
      
      // Create session record (would need sessions table in schema)
      const sessionInfo: SessionInfo = {
        sessionId,
        userId,
        deviceId,
        ipAddress: deviceFingerprint.ipAddress,
        userAgent: deviceFingerprint.userAgent,
        createdAt: new Date(),
        lastActivity: new Date(),
        isActive: true,
        riskScore: securityAnalysis.riskScore,
        deviceTrusted: securityAnalysis.deviceTrusted,
      };

      // Log session creation
      await this.auditService.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: securityAnalysis.riskScore > this.highRiskThreshold ? 'HIGH' : 'LOW',
        userId,
        ipAddress: deviceFingerprint.ipAddress,
        userAgent: deviceFingerprint.userAgent,
        details: {
          action: 'SESSION_CREATED',
          sessionId,
          deviceId,
          riskScore: securityAnalysis.riskScore,
          securityFlags: securityAnalysis.flags,
          ...additionalData,
        },
      });

      // Check for concurrent session limits
      await this.enforceConcurrentSessionLimits(userId, sessionId);

      this.logger.log(`Session created for user ${userId}: ${sessionId}`);
      
      return sessionInfo;

    } catch (error) {
      this.logger.error('Session creation failed:', error);
      throw error;
    }
  }

  /**
   * Validate and update session
   */
  async validateSession(sessionId: string, currentFingerprint: DeviceFingerprint): Promise<{
    valid: boolean;
    sessionInfo?: SessionInfo;
    requiresReauth?: boolean;
    reason?: string;
  }> {
    try {
      // Get session from storage (would need sessions table)
      // For now, simulate session validation
      
      const sessionExists = sessionId && sessionId.length > 20;
      
      if (!sessionExists) {
        return {
          valid: false,
          reason: 'Session not found',
        };
      }

      // Check session expiry
      const now = new Date();
      const sessionAge = now.getTime() - (now.getTime() - this.sessionTimeout); // Simulate
      
      if (sessionAge > this.sessionTimeout) {
        await this.invalidateSession(sessionId, 'SESSION_EXPIRED');
        return {
          valid: false,
          reason: 'Session expired',
        };
      }

      // Validate device fingerprint
      const deviceValidation = await this.validateDeviceFingerprint(
        sessionId,
        currentFingerprint
      );

      if (!deviceValidation.valid) {
        await this.auditService.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          ipAddress: currentFingerprint.ipAddress,
          userAgent: currentFingerprint.userAgent,
          details: {
            action: 'DEVICE_FINGERPRINT_MISMATCH',
            sessionId,
            reason: deviceValidation.reason,
          },
        });

        return {
          valid: false,
          requiresReauth: true,
          reason: 'Device fingerprint changed',
        };
      }

      // Update last activity
      await this.updateSessionActivity(sessionId, currentFingerprint);

      return {
        valid: true,
        sessionInfo: {
          sessionId,
          userId: 'simulated-user-id',
          deviceId: this.generateDeviceId(currentFingerprint),
          ipAddress: currentFingerprint.ipAddress,
          userAgent: currentFingerprint.userAgent,
          createdAt: new Date(now.getTime() - sessionAge),
          lastActivity: now,
          isActive: true,
          riskScore: 10,
          deviceTrusted: true,
        },
      };

    } catch (error) {
      this.logger.error('Session validation failed:', error);
      return {
        valid: false,
        reason: 'Validation error',
      };
    }
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId: string, reason: string): Promise<void> {
    try {
      // Mark session as inactive in database
      // Would need sessions table implementation

      await this.auditService.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'LOW',
        details: {
          action: 'SESSION_INVALIDATED',
          sessionId,
          reason,
        },
      });

      this.logger.log(`Session invalidated: ${sessionId} - ${reason}`);

    } catch (error) {
      this.logger.error('Session invalidation failed:', error);
    }
  }

  /**
   * Get all active sessions for user
   */
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      // Get all active sessions for user from database
      // For now, return empty array as we need sessions table
      return [];

    } catch (error) {
      this.logger.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Terminate all sessions for user
   */
  async terminateAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    try {
      // Invalidate all user sessions except the current one
      const sessions = await this.getUserSessions(userId);
      const sessionsToTerminate = sessions.filter(s => s.sessionId !== exceptSessionId);

      for (const session of sessionsToTerminate) {
        await this.invalidateSession(session.sessionId, 'ADMIN_TERMINATION');
      }

      await this.auditService.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        userId,
        details: {
          action: 'ALL_SESSIONS_TERMINATED',
          terminatedCount: sessionsToTerminate.length,
          exceptSession: exceptSessionId,
        },
      });

      this.logger.log(`Terminated ${sessionsToTerminate.length} sessions for user ${userId}`);
      
      return sessionsToTerminate.length;

    } catch (error) {
      this.logger.error('Failed to terminate user sessions:', error);
      return 0;
    }
  }

  /**
   * Analyze session security risk
   */
  private async analyzeSessionSecurity(
    userId: string,
    fingerprint: DeviceFingerprint
  ): Promise<{
    riskScore: number;
    deviceTrusted: boolean;
    flags: SecurityFlags;
  }> {
    let riskScore = 0;
    const flags: SecurityFlags = {
      suspiciousLocation: false,
      newDevice: false,
      highRiskSession: false,
      concurrentSessions: 0,
      requiresAdditionalAuth: false,
    };

    // Check for new device
    const isKnownDevice = await this.isKnownDevice(userId, fingerprint);
    if (!isKnownDevice) {
      flags.newDevice = true;
      riskScore += 30;
    }

    // Check for suspicious location (IP geolocation)
    const locationRisk = await this.checkLocationRisk(userId, fingerprint.ipAddress);
    if (locationRisk > 50) {
      flags.suspiciousLocation = true;
      riskScore += locationRisk;
    }

    // Check concurrent sessions
    const concurrentSessions = (await this.getUserSessions(userId)).length;
    flags.concurrentSessions = concurrentSessions;
    if (concurrentSessions > 2) {
      riskScore += 20;
    }

    // Check user agent anomalies
    if (this.detectSuspiciousUserAgent(fingerprint.userAgent)) {
      riskScore += 25;
    }

    // Determine if additional auth is required
    flags.requiresAdditionalAuth = riskScore > 60;
    flags.highRiskSession = riskScore > this.highRiskThreshold;

    return {
      riskScore: Math.min(riskScore, 100),
      deviceTrusted: !flags.newDevice && riskScore < 30,
      flags,
    };
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate device ID from fingerprint
   */
  private generateDeviceId(fingerprint: DeviceFingerprint): string {
    const fingerprintData = [
      fingerprint.userAgent,
      fingerprint.acceptLanguage,
      fingerprint.acceptEncoding,
      fingerprint.screenResolution,
      fingerprint.timezone,
      fingerprint.platform,
    ].filter(Boolean).join('|');

    return crypto.createHash('sha256').update(fingerprintData).digest('hex');
  }

  /**
   * Check if device is known for user
   */
  private async isKnownDevice(userId: string, fingerprint: DeviceFingerprint): Promise<boolean> {
    try {
      const deviceId = this.generateDeviceId(fingerprint);
      
      // Check if device exists in database for this user
      // For now, return false to simulate new device
      return false;

    } catch (error) {
      this.logger.error('Device check failed:', error);
      return false;
    }
  }

  /**
   * Check location-based risk
   */
  private async checkLocationRisk(userId: string, ipAddress: string): Promise<number> {
    try {
      // In production, use IP geolocation service to check:
      // 1. Country/region of IP
      // 2. Compare with user's usual locations
      // 3. Check against known VPN/proxy IPs
      // 4. Time zone consistency

      // Simple check for local/private IPs (lower risk)
      if (this.isPrivateIP(ipAddress)) {
        return 5;
      }

      // Simulate location risk scoring
      return 15; // Medium risk for demo

    } catch (error) {
      this.logger.error('Location risk check failed:', error);
      return 50; // High risk if check fails
    }
  }

  /**
   * Detect suspicious user agents
   */
  private detectSuspiciousUserAgent(userAgent: string): boolean {
    if (!userAgent) return true;

    // Check for automated clients
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /python/i,
      /bot/i,
      /crawler/i,
      /spider/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Check if IP is private/local
   */
  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fc00:/,
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Validate device fingerprint consistency
   */
  private async validateDeviceFingerprint(
    sessionId: string,
    currentFingerprint: DeviceFingerprint
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Get stored fingerprint for session
      // For now, simulate validation
      
      // Check for major changes in fingerprint
      const majorChanges = [
        // User agent changes (browser updates are normal, but major changes are suspicious)
        // Screen resolution changes
        // Platform changes
        // Timezone changes by more than a few hours
      ];

      // For demo, always return valid
      return { valid: true };

    } catch (error) {
      this.logger.error('Device fingerprint validation failed:', error);
      return { valid: false, reason: 'Fingerprint validation error' };
    }
  }

  /**
   * Update session activity timestamp
   */
  private async updateSessionActivity(
    sessionId: string,
    fingerprint: DeviceFingerprint
  ): Promise<void> {
    try {
      // Update last_activity timestamp in sessions table
      // Update IP address if it has changed
      // Log activity for analytics

    } catch (error) {
      this.logger.error('Session activity update failed:', error);
    }
  }

  /**
   * Enforce concurrent session limits
   */
  private async enforceConcurrentSessionLimits(
    userId: string,
    newSessionId: string
  ): Promise<void> {
    try {
      const activeSessions = await this.getUserSessions(userId);

      if (activeSessions.length >= this.maxConcurrentSessions) {
        // Terminate oldest session
        const oldestSession = activeSessions.sort((a, b) => 
          a.lastActivity.getTime() - b.lastActivity.getTime()
        )[0];

        await this.invalidateSession(oldestSession.sessionId, 'CONCURRENT_LIMIT_EXCEEDED');

        await this.auditService.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          userId,
          details: {
            action: 'SESSION_LIMIT_ENFORCED',
            terminatedSession: oldestSession.sessionId,
            newSession: newSessionId,
            activeSessionsCount: activeSessions.length,
          },
        });
      }

    } catch (error) {
      this.logger.error('Session limit enforcement failed:', error);
    }
  }
}