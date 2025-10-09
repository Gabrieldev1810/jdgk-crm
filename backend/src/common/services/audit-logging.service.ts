import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogData {
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  success: boolean;
  errorMessage?: string;
  requestId?: string;
  sessionId?: string;
}

export interface SecurityEvent {
  type: 'UNAUTHORIZED_ACCESS' | 'PERMISSION_DENIED' | 'INVALID_TOKEN' | 'SUSPICIOUS_ACTIVITY' | 
        'PRIVILEGE_ESCALATION_ATTEMPT' | 'DYNAMIC_PERMISSION_DENIED' | 'HIGH_RISK_ACCESS' | 
        'PERMISSION_GUARD_ERROR' | 'DYNAMIC_PERMISSION_EVALUATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  endpoint?: string;
  method?: string;
}

@Injectable()
export class AuditLoggingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log general audit events
   */
  async logAuditEvent(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: data.userId || null,
          action: data.action,
          entity: data.resource,
          entityId: data.resourceId || null,
          metadata: JSON.stringify({
            userEmail: data.userEmail,
            endpoint: data.endpoint,
            method: data.method,
            success: data.success,
            errorMessage: data.errorMessage,
            requestId: data.requestId,
            details: data.details
          }),
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          sessionId: data.sessionId || null,
        },
      });
    } catch (error) {
      // Don't let audit logging failures break the main application flow
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log RBAC-specific events
   */
  async logRbacEvent(
    action: 'ROLE_CREATED' | 'ROLE_UPDATED' | 'ROLE_DELETED' | 'PERMISSION_CREATED' | 
           'PERMISSION_UPDATED' | 'PERMISSION_DELETED' | 'USER_ROLE_ASSIGNED' | 
           'USER_ROLE_REVOKED' | 'ROLE_PERMISSION_GRANTED' | 'ROLE_PERMISSION_REVOKED',
    actorUserId: string,
    targetResource: string,
    resourceId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAuditEvent({
      userId: actorUserId,
      action,
      resource: 'RBAC',
      resourceId,
      details: {
        targetResource,
        ...details,
      },
      ipAddress,
      userAgent,
      success: true,
    });
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'TOKEN_REFRESH' | 
           'PASSWORD_CHANGE' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED',
    userId?: string,
    userEmail?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      userEmail,
      action,
      resource: 'AUTHENTICATION',
      details,
      ipAddress,
      userAgent,
      success,
      errorMessage,
    });
  }

  /**
   * Log user management events
   */
  async logUserManagementEvent(
    action: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'USER_ACTIVATED' | 'USER_DEACTIVATED',
    actorUserId: string,
    targetUserId?: string,
    changes?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAuditEvent({
      userId: actorUserId,
      action,
      resource: 'USER_MANAGEMENT',
      resourceId: targetUserId,
      details: changes,
      ipAddress,
      userAgent,
      success: true,
    });
  }

  /**
   * Log security events for monitoring and alerting
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Log to audit table
      await this.logAuditEvent({
        userId: event.userId,
        action: `SECURITY_EVENT_${event.type}`,
        resource: 'SECURITY',
        details: {
          type: event.type,
          severity: event.severity,
          ...event.details,
        },
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        endpoint: event.endpoint,
        method: event.method,
        success: false, // Security events are by definition failures
      });

      // For high/critical security events, you might want to send alerts
      if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        await this.handleCriticalSecurityEvent(event);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Log data operations (CRUD operations)
   */
  async logDataOperationEvent(
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPLOAD' | 'EXPORT' | 'IMPORT',
    userId: string,
    resource: 'ACCOUNTS' | 'CALLS' | 'USERS' | 'ROLES' | 'PERMISSIONS',
    resourceId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      action: `DATA_${action}`,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      success,
      errorMessage,
    });
  }

  /**
   * Log data access events (for sensitive data tracking)
   */
  async logDataAccessEvent(
    action: 'VIEW' | 'EXPORT' | 'DOWNLOAD' | 'SEARCH' | 'FILTER',
    userId: string,
    resource: 'ACCOUNTS' | 'CALLS' | 'USERS' | 'AUDIT_LOGS',
    resourceIds?: string[],
    filters?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      action: `DATA_ACCESS_${action}`,
      resource,
      details: {
        resourceIds,
        filters,
        recordCount: resourceIds?.length || null,
      },
      ipAddress,
      userAgent,
      success: true,
    });
  }

  /**
   * Log system administration events
   */
  async logSystemAdminEvent(
    action: 'SYSTEM_BACKUP' | 'SYSTEM_RESTORE' | 'DATABASE_SEED' | 'CACHE_CLEAR' | 
           'CONFIGURATION_CHANGE' | 'MAINTENANCE_MODE' | 'SYSTEM_UPDATE',
    adminUserId: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAuditEvent({
      userId: adminUserId,
      action,
      resource: 'SYSTEM_ADMINISTRATION',
      details,
      ipAddress,
      userAgent,
      success: true,
    });
  }

  /**
   * Log user actions with enhanced context
   */
  async logUserAction(data: {
    actorId: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.logAuditEvent({
      userId: data.actorId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      details: data.metadata,
      success: true,
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(options: {
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      resource,
      action,
      startDate,
      endDate,
      success,
      page = 1,
      limit = 50,
    } = options;

    const where: any = {};
    
    if (userId) where.actorId = userId;
    if (resource) where.entity = resource;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          actorId: true,
          action: true,
          entity: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          sessionId: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map(log => ({
        ...log,
        details: log.metadata ? JSON.parse(log.metadata) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalEvents,
      failedLogins,
      securityEvents,
      topUsers,
      topResources,
    ] = await Promise.all([
      // Total audit events
      this.prisma.auditLog.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Failed login attempts  
      this.prisma.auditLog.count({
        where: {
          action: 'LOGIN_FAILED',
          createdAt: { gte: startDate },
        },
      }),

      // Security events by type
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          entity: 'SECURITY',
          createdAt: { gte: startDate },
        },
        _count: { action: true },
      }),

      // Top active users
      this.prisma.auditLog.groupBy({
        by: ['actorId'],
        where: {
          createdAt: { gte: startDate },
          actorId: { not: null },
        },
        _count: { actorId: true },
        orderBy: { _count: { actorId: 'desc' } },
        take: 10,
      }),

      // Most accessed resources
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        where: { createdAt: { gte: startDate } },
        _count: { entity: true },
        orderBy: { _count: { entity: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalEvents,
      failedLogins,
      securityEvents: securityEvents.map(e => ({
        type: e.action,
        count: e._count.action,
      })),
      topUsers: topUsers.map(u => ({
        userId: u.actorId,
        activityCount: u._count.actorId,
      })),
      topResources: topResources.map(r => ({
        resource: r.entity,
        accessCount: r._count.entity,
      })),
      period: `Last ${days} days`,
    };
  }

  /**
   * Handle critical security events (implement your alerting logic here)
   */
  private async handleCriticalSecurityEvent(event: SecurityEvent): Promise<void> {
    // This is where you would integrate with your alerting system
    // Examples: Send email, Slack notification, SMS, webhook, etc.
    
    console.warn(`🚨 CRITICAL SECURITY EVENT: ${event.type}`, {
      severity: event.severity,
      userId: event.userId,
      ipAddress: event.ipAddress,
      endpoint: event.endpoint,
      details: event.details,
    });

    // You could also implement automatic security responses:
    // - Temporarily block IP address
    // - Lock user account
    // - Escalate to security team
    // - Trigger additional monitoring
  }
}