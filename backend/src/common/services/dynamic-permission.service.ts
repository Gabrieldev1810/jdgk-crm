import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLoggingService } from './audit-logging.service';

export interface PermissionContext {
  userId: string;
  resource: string;
  action: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

export interface DynamicScope {
  granted: boolean;
  reason: string;
  restrictions?: string[];
  riskScore: number;
}

@Injectable()
export class DynamicPermissionService {
  private readonly logger = new Logger(DynamicPermissionService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditLoggingService,
  ) {}

  /**
   * Evaluate dynamic permission with contextual scoping
   */
  async evaluatePermission(context: PermissionContext): Promise<DynamicScope> {
    const startTime = Date.now();
    let riskScore = 0;
    const restrictions: string[] = [];

    try {
      this.logger.debug(`Evaluating dynamic permission for ${context.userId} on ${context.resource}:${context.action}`);

      // 1. Data Ownership Check
      const ownershipResult = await this.checkDataOwnership(context);
      if (!ownershipResult.allowed) {
        return {
          granted: false,
          reason: 'Data ownership violation',
          restrictions: ownershipResult.restrictions,
          riskScore: 80,
        };
      }
      riskScore += ownershipResult.riskScore;

      // 2. Time-based Access Control
      const timeResult = await this.checkTimeBasedAccess(context);
      if (!timeResult.allowed) {
        return {
          granted: false,
          reason: 'Access denied outside business hours',
          restrictions: timeResult.restrictions,
          riskScore: 30,
        };
      }
      riskScore += timeResult.riskScore;

      // 3. Location/IP-based Access Control
      const locationResult = await this.checkLocationAccess(context);
      if (!locationResult.allowed) {
        return {
          granted: false,
          reason: 'Access denied from untrusted location',
          restrictions: locationResult.restrictions,
          riskScore: 70,
        };
      }
      riskScore += locationResult.riskScore;

      // 4. Device Trust Level
      const deviceResult = await this.checkDeviceTrust(context);
      riskScore += deviceResult.riskScore;
      if (deviceResult.restrictions.length > 0) {
        restrictions.push(...deviceResult.restrictions);
      }

      // 5. Rate Limiting & Anomaly Detection
      const anomalyResult = await this.checkAnomalyPatterns(context);
      riskScore += anomalyResult.riskScore;
      if (anomalyResult.restrictions.length > 0) {
        restrictions.push(...anomalyResult.restrictions);
      }

      // Log the permission evaluation
      await this.auditService.logSecurityEvent({
        type: 'DYNAMIC_PERMISSION_EVALUATION',
        severity: riskScore > 50 ? 'HIGH' : riskScore > 20 ? 'MEDIUM' : 'LOW',
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        details: {
          resource: context.resource,
          action: context.action,
          resourceId: context.resourceId,
          riskScore,
          restrictions,
          evaluationTime: Date.now() - startTime,
        },
      });

      return {
        granted: true,
        reason: 'Dynamic permission granted with context evaluation',
        restrictions: restrictions.length > 0 ? restrictions : undefined,
        riskScore,
      };

    } catch (error) {
      this.logger.error('Dynamic permission evaluation failed:', error);
      
      await this.auditService.logSecurityEvent({
        type: 'DYNAMIC_PERMISSION_EVALUATION',
        severity: 'HIGH',
        userId: context.userId,
        ipAddress: context.ipAddress,
        details: {
          error: error.message,
          context,
        },
      });

      return {
        granted: false,
        reason: 'Permission evaluation failed',
        riskScore: 100,
      };
    }
  }

  /**
   * Check data ownership constraints
   */
  private async checkDataOwnership(context: PermissionContext): Promise<{
    allowed: boolean;
    riskScore: number;
    restrictions: string[];
  }> {
    const restrictions: string[] = [];
    let riskScore = 0;

    // Skip ownership check for system resources
    if (!context.resourceId || ['system', 'rbac', 'audit'].includes(context.resource)) {
      return { allowed: true, riskScore: 0, restrictions };
    }

    try {
      // Check ownership based on resource type
      switch (context.resource) {
        case 'accounts':
          const account = await this.prisma.account.findFirst({
            where: { id: context.resourceId },
            include: { assignedAgent: true },
          });
          
          if (account && account.assignedAgent?.id !== context.userId) {
            restrictions.push('User does not own this account');
            riskScore += 40;
            
            // Allow read access for managers
            if (context.action === 'view') {
              const user = await this.prisma.user.findUnique({
                where: { id: context.userId },
                include: { userRoles: { include: { role: true } } },
              });
              
              const hasManagerRole = user?.userRoles.some(ur => 
                ['Manager', 'Administrator'].includes(ur.role.name)
              );
              
              if (hasManagerRole) {
                restrictions.push('Manager override for account access');
                riskScore = 10; // Lower risk for authorized manager access
                return { allowed: true, riskScore, restrictions };
              }
            }
            
            return { allowed: false, riskScore, restrictions };
          }
          break;

        case 'calls':
          const call = await this.prisma.call.findFirst({
            where: { id: context.resourceId },
          });
          
          if (call && call.agentId !== context.userId) {
            restrictions.push('User does not own this call record');
            riskScore += 30;
            return { allowed: false, riskScore, restrictions };
          }
          break;
      }

      return { allowed: true, riskScore, restrictions };
      
    } catch (error) {
      this.logger.error('Data ownership check failed:', error);
      return { allowed: false, riskScore: 50, restrictions: ['Ownership verification failed'] };
    }
  }

  /**
   * Check time-based access restrictions
   */
  private async checkTimeBasedAccess(context: PermissionContext): Promise<{
    allowed: boolean;
    riskScore: number;
    restrictions: string[];
  }> {
    const restrictions: string[] = [];
    let riskScore = 0;

    // Get user's time-based restrictions
    const user = await this.prisma.user.findUnique({
      where: { id: context.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { allowed: false, riskScore: 100, restrictions: ['User not found'] };
    }

    const now = new Date();
    const currentHour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Business hours: 6 AM - 10 PM, Monday-Friday
    const isBusinessHours = !isWeekend && currentHour >= 6 && currentHour <= 22;

    // Check if user has 24/7 access
    const has24x7Access = user.userRoles.some(ur => 
      ['Administrator', 'Emergency_Response'].includes(ur.role.name)
    );

    if (!isBusinessHours && !has24x7Access) {
      // Allow limited access for critical operations
      const criticalActions = ['view', 'emergency_call', 'security_incident'];
      
      if (!criticalActions.includes(context.action)) {
        restrictions.push('Access denied outside business hours');
        riskScore = 60;
        return { allowed: false, riskScore, restrictions };
      } else {
        restrictions.push('Limited access outside business hours');
        riskScore = 20;
      }
    }

    return { allowed: true, riskScore, restrictions };
  }

  /**
   * Check location/IP-based access restrictions
   */
  private async checkLocationAccess(context: PermissionContext): Promise<{
    allowed: boolean;
    riskScore: number;
    restrictions: string[];
  }> {
    const restrictions: string[] = [];
    let riskScore = 0;

    if (!context.ipAddress) {
      return { allowed: true, riskScore: 10, restrictions: ['No IP address provided'] };
    }

    // Define trusted IP ranges (example ranges - replace with actual office IPs)
    const trustedRanges = [
      '192.168.1.0/24',  // Office network
      '10.0.0.0/8',      // Internal network
      '172.16.0.0/12',   // VPN network
    ];

    // Simple IP range check (in production, use proper IP range library)
    const isTrustedIP = trustedRanges.some(range => {
      // Simplified check - in production use proper CIDR matching
      return context.ipAddress?.startsWith(range.split('/')[0].substring(0, 7));
    });

    if (!isTrustedIP) {
      restrictions.push('Access from untrusted network');
      riskScore += 30;

      // Check if user has remote access permissions
      const user = await this.prisma.user.findUnique({
        where: { id: context.userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      const hasRemoteAccess = user?.userRoles.some(ur =>
        ur.role.permissions.some(rp => rp.permission.code === 'system.remote_access')
      );

      if (!hasRemoteAccess) {
        restrictions.push('Remote access not permitted for user');
        riskScore = 80;
        return { allowed: false, riskScore, restrictions };
      }
    }

    return { allowed: true, riskScore, restrictions };
  }

  /**
   * Check device trust level
   */
  private async checkDeviceTrust(context: PermissionContext): Promise<{
    riskScore: number;
    restrictions: string[];
  }> {
    const restrictions: string[] = [];
    let riskScore = 0;

    if (!context.userAgent) {
      restrictions.push('Unknown device/browser');
      return { riskScore: 20, restrictions };
    }

    // Simple device fingerprinting (in production, use proper device fingerprinting)
    const isKnownBrowser = ['Chrome', 'Firefox', 'Safari', 'Edge'].some(browser =>
      context.userAgent!.includes(browser)
    );

    if (!isKnownBrowser) {
      restrictions.push('Unrecognized browser or automated client');
      riskScore += 25;
    }

    // Check for mobile devices
    const isMobile = /Mobile|Android|iPhone|iPad/.test(context.userAgent);
    if (isMobile) {
      restrictions.push('Access from mobile device');
      riskScore += 10;
    }

    return { riskScore, restrictions };
  }

  /**
   * Check for anomalous access patterns
   */
  private async checkAnomalyPatterns(context: PermissionContext): Promise<{
    riskScore: number;
    restrictions: string[];
  }> {
    const restrictions: string[] = [];
    let riskScore = 0;

    try {
      // Check recent access patterns
      const recentAccess = await this.prisma.auditLog.findMany({
        where: {
          actorId: context.userId,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // High frequency access detection
      if (recentAccess.length > 30) {
        restrictions.push('Unusually high activity detected');
        riskScore += 20;
      }

      // Multiple IP detection
      const uniqueIPs = new Set(
        recentAccess
          .map(log => {
            try {
              const metadata = log.metadata ? JSON.parse(log.metadata) : {};
              return metadata.ipAddress;
            } catch {
              return null;
            }
          })
          .filter(ip => ip && ip !== context.ipAddress)
      );

      if (uniqueIPs.size > 2) {
        restrictions.push('Multiple IP addresses detected');
        riskScore += 30;
      }

      // Failed access attempts
      const failedAttempts = recentAccess.filter(log =>
        log.action?.includes('FAILED') || log.action?.includes('DENIED')
      );

      if (failedAttempts.length > 5) {
        restrictions.push('Multiple failed attempts detected');
        riskScore += 40;
      }

      return { riskScore, restrictions };
      
    } catch (error) {
      this.logger.error('Anomaly pattern check failed:', error);
      return { riskScore: 15, restrictions: ['Anomaly check unavailable'] };
    }
  }
}