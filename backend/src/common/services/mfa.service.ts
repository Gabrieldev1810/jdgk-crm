import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLoggingService } from './audit-logging.service';
import * as crypto from 'crypto';

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerificationRequest {
  userId: string;
  code: string;
  type: 'totp' | 'backup';
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class MultiFactorAuthService {
  private readonly logger = new Logger(MultiFactorAuthService.name);
  
  constructor(
    private prisma: PrismaService,
    private auditService: AuditLoggingService,
  ) {}

  /**
   * Generate TOTP secret and setup MFA for user
   */
  async setupMFA(userId: string, userEmail: string): Promise<MFASetupResponse> {
    try {
      // Generate a random secret
      const secret = this.generateTOTPSecret();
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Hash backup codes for storage
      const hashedBackupCodes = backupCodes.map(code => 
        crypto.createHash('sha256').update(code).digest('hex')
      );

      // Store MFA configuration (this would require adding MFA table to schema)
      // For now, we'll store in user metadata or create a separate service
      
      // Generate QR code URL for Google Authenticator
      const issuer = 'Dial-Craft CRM';
      const qrCodeUrl = `otpauth://totp/${issuer}:${userEmail}?secret=${secret}&issuer=${issuer}`;

      await this.auditService.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY', // We can extend this later
        severity: 'MEDIUM',
        userId,
        details: {
          action: 'MFA_SETUP_INITIATED',
          email: userEmail,
        },
      });

      this.logger.log(`MFA setup initiated for user ${userId}`);

      return {
        secret,
        qrCodeUrl,
        backupCodes,
      };

    } catch (error) {
      this.logger.error('MFA setup failed:', error);
      throw new BadRequestException('Failed to setup MFA');
    }
  }

  /**
   * Verify TOTP code
   */
  async verifyMFA(request: MFAVerificationRequest): Promise<boolean> {
    try {
      const { userId, code, type, ipAddress, userAgent } = request;

      // Get user's MFA configuration (would need MFA table)
      // For now, simulate verification
      let isValid = false;

      if (type === 'totp') {
        isValid = await this.verifyTOTPCode(userId, code);
      } else if (type === 'backup') {
        isValid = await this.verifyBackupCode(userId, code);
      }

      await this.auditService.logSecurityEvent({
        type: isValid ? 'SUSPICIOUS_ACTIVITY' : 'PERMISSION_DENIED',
        severity: isValid ? 'LOW' : 'MEDIUM',
        userId,
        ipAddress,
        userAgent,
        details: {
          action: isValid ? 'MFA_VERIFICATION_SUCCESS' : 'MFA_VERIFICATION_FAILED',
          type,
          code: code.replace(/./g, '*'), // Mask the code in logs
        },
      });

      if (isValid) {
        this.logger.log(`MFA verification successful for user ${userId}`);
      } else {
        this.logger.warn(`MFA verification failed for user ${userId}`);
      }

      return isValid;

    } catch (error) {
      this.logger.error('MFA verification error:', error);
      
      await this.auditService.logSecurityEvent({
        type: 'PERMISSION_DENIED',
        severity: 'HIGH',
        userId: request.userId,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        details: {
          action: 'MFA_VERIFICATION_ERROR',
          error: error.message,
        },
      });

      return false;
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string, adminUserId?: string): Promise<void> {
    try {
      // Remove MFA configuration from database
      // This would require MFA table implementation

      await this.auditService.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        userId: adminUserId || userId,
        details: {
          action: 'MFA_DISABLED',
          targetUserId: userId,
          disabledBy: adminUserId ? 'ADMIN' : 'USER',
        },
      });

      this.logger.log(`MFA disabled for user ${userId} by ${adminUserId || 'self'}`);

    } catch (error) {
      this.logger.error('MFA disable failed:', error);
      throw new BadRequestException('Failed to disable MFA');
    }
  }

  /**
   * Check if user has MFA enabled
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    try {
      // Check MFA configuration in database
      // For now, return false as we need MFA table
      return false;

    } catch (error) {
      this.logger.error('MFA status check failed:', error);
      return false;
    }
  }

  /**
   * Generate TOTP secret
   */
  private generateTOTPSecret(): string {
    // Generate a 32-character base32 secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return secret;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      // Generate 8-digit codes
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Verify TOTP code (simplified implementation)
   */
  private async verifyTOTPCode(userId: string, code: string): Promise<boolean> {
    try {
      // Get user's secret from database
      // For now, simulate verification
      
      // In production, use a proper TOTP library like 'node-2fa' or 'otplib'
      // This would generate the current expected code and compare
      
      // Simplified verification for demo
      const isValidFormat = /^\d{6}$/.test(code);
      
      // In production, this would be:
      // const secret = await this.getUserMFASecret(userId);
      // const isValid = totp.verify({ token: code, secret, window: 1 });
      
      return isValidFormat; // Simplified for demo
      
    } catch (error) {
      this.logger.error('TOTP verification failed:', error);
      return false;
    }
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      // Get user's backup codes from database
      // Check if code matches and hasn't been used
      // Mark code as used if valid
      
      // Simplified verification for demo
      const isValidFormat = /^\d{8}$/.test(code);
      
      return isValidFormat; // Simplified for demo
      
    } catch (error) {
      this.logger.error('Backup code verification failed:', error);
      return false;
    }
  }

  /**
   * Generate secure random string
   */
  private generateSecureRandom(length: number): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomBytes = crypto.randomBytes(length);
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    
    return result;
  }
}