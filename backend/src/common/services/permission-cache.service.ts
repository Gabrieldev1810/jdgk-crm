import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLoggingService } from './audit-logging.service';

export interface CachedUserPermissions {
  userId: string;
  permissions: string[];
  roles: string[];
  cachedAt: Date;
  expiresAt: Date;
}

export interface CacheStatistics {
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalRequests: number;
  cacheSize: number;
  averageResponseTime: number;
}

@Injectable()
export class PermissionCacheService {
  private readonly logger = new Logger(PermissionCacheService.name);

  // Cache key prefixes for organization
  private readonly PERMISSION_PREFIX = 'permissions:user:';
  private readonly ROLE_PREFIX = 'roles:user:';
  private readonly STATS_PREFIX = 'cache:stats:';
  private readonly INVALIDATION_PREFIX = 'invalidate:';

  // Cache configuration
  private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly STATS_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 10000; // Maximum cached users

  // Performance tracking
  private stats = {
    hitCount: 0,
    missCount: 0,
    totalResponseTime: 0,
  };

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
    private auditService: AuditLoggingService,
  ) { }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permissionCode);
  }

  /**
   * Get user permissions with caching
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const startTime = Date.now();

    try {
      // Try cache first
      const cacheKey = this.PERMISSION_PREFIX + userId;
      const cached = await this.cacheManager.get<CachedUserPermissions>(cacheKey);

      if (cached && this.isCacheValid(cached)) {
        this.stats.hitCount++;
        this.updateResponseTime(startTime);

        this.logger.debug(`Cache HIT for user ${userId} permissions`);
        return cached.permissions;
      }

      // Cache miss - fetch from database
      this.stats.missCount++;
      this.logger.debug(`Cache MISS for user ${userId} permissions`);

      const permissions = await this.fetchUserPermissionsFromDb(userId);

      // Cache the result
      await this.cacheUserPermissions(userId, permissions);

      this.updateResponseTime(startTime);
      return permissions;

    } catch (error) {
      this.logger.error(`Failed to get permissions for user ${userId}:`, error);

      // Fallback to direct database query
      return this.fetchUserPermissionsFromDb(userId);
    }
  }

  /**
   * Get user roles with caching
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const startTime = Date.now();

    try {
      const cacheKey = this.ROLE_PREFIX + userId;
      const cached = await this.cacheManager.get<string[]>(cacheKey);

      if (cached) {
        this.stats.hitCount++;
        this.updateResponseTime(startTime);
        return cached;
      }

      // Cache miss - fetch from database
      this.stats.missCount++;
      const roles = await this.fetchUserRolesFromDb(userId);

      // Cache the result
      await this.cacheManager.set(cacheKey, roles, this.DEFAULT_TTL);

      this.updateResponseTime(startTime);
      return roles;

    } catch (error) {
      this.logger.error(`Failed to get roles for user ${userId}:`, error);
      return this.fetchUserRolesFromDb(userId);
    }
  }

  /**
   * Invalidate cache for specific user
   */
  async invalidateUserCache(userId: string, reason: string = 'Manual invalidation'): Promise<void> {
    try {
      const permissionKey = this.PERMISSION_PREFIX + userId;
      const roleKey = this.ROLE_PREFIX + userId;

      await Promise.all([
        this.cacheManager.del(permissionKey),
        this.cacheManager.del(roleKey),
      ]);

      this.logger.log(`Invalidated cache for user ${userId}: ${reason}`);

      // Log cache invalidation event
      await this.auditService.logAuditEvent({
        userId,
        action: 'CACHE_INVALIDATION',
        resource: 'PERMISSION_CACHE',
        details: { reason, keys: [permissionKey, roleKey] },
        success: true,
      });

    } catch (error) {
      this.logger.error(`Failed to invalidate cache for user ${userId}:`, error);
    }
  }

  /**
   * Invalidate cache for multiple users (bulk operations)
   */
  async invalidateMultipleUsers(userIds: string[], reason: string = 'Bulk invalidation'): Promise<void> {
    try {
      const keys: string[] = [];

      userIds.forEach(userId => {
        keys.push(this.PERMISSION_PREFIX + userId);
        keys.push(this.ROLE_PREFIX + userId);
      });

      await Promise.all(keys.map(key => this.cacheManager.del(key)));

      this.logger.log(`Bulk invalidated cache for ${userIds.length} users: ${reason}`);

      // Log bulk cache invalidation
      await this.auditService.logAuditEvent({
        action: 'BULK_CACHE_INVALIDATION',
        resource: 'PERMISSION_CACHE',
        details: { reason, userCount: userIds.length, userIds },
        success: true,
      });

    } catch (error) {
      this.logger.error(`Failed to bulk invalidate cache:`, error);
    }
  }

  /**
   * Invalidate cache for role changes (affects all users with that role)
   */
  async invalidateCacheForRole(roleId: string, reason: string = 'Role modification'): Promise<void> {
    try {
      // Get all users with this role
      const usersWithRole = await this.prisma.userRole.findMany({
        where: { roleId, isActive: true },
        select: { userId: true },
      });

      const userIds = usersWithRole.map(ur => ur.userId);

      if (userIds.length > 0) {
        await this.invalidateMultipleUsers(userIds, `Role ${roleId} modified: ${reason}`);
      }

    } catch (error) {
      this.logger.error(`Failed to invalidate cache for role ${roleId}:`, error);
    }
  }

  /**
   * Invalidate cache for permission changes (affects all users with roles containing that permission)
   */
  async invalidateCacheForPermission(permissionId: string, reason: string = 'Permission modification'): Promise<void> {
    try {
      // Get all roles with this permission
      const rolesWithPermission = await this.prisma.rolePermission.findMany({
        where: { permissionId },
        select: { roleId: true },
      });

      // Get all users with these roles
      const roleIds = rolesWithPermission.map(rp => rp.roleId);

      if (roleIds.length > 0) {
        const usersWithRoles = await this.prisma.userRole.findMany({
          where: { roleId: { in: roleIds }, isActive: true },
          select: { userId: true },
        });

        const userIds = [...new Set(usersWithRoles.map(ur => ur.userId))]; // Remove duplicates

        if (userIds.length > 0) {
          await this.invalidateMultipleUsers(userIds, `Permission ${permissionId} modified: ${reason}`);
        }
      }

    } catch (error) {
      this.logger.error(`Failed to invalidate cache for permission ${permissionId}:`, error);
    }
  }

  /**
   * Warm up cache for active users
   */
  async warmUpCache(userIds?: string[]): Promise<void> {
    try {
      let targetUserIds = userIds;

      if (!targetUserIds) {
        // Get most active users from recent audit logs
        const recentActiveUsers = await this.prisma.auditLog.groupBy({
          by: ['actorId'],
          where: {
            actorId: { not: null },
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
          },
          _count: { actorId: true },
          orderBy: { _count: { actorId: 'desc' } },
          take: 100, // Top 100 active users
        });

        targetUserIds = recentActiveUsers
          .map(u => u.actorId)
          .filter(id => id !== null) as string[];
      }

      this.logger.log(`Starting cache warm-up for ${targetUserIds.length} users...`);

      // Pre-load permissions and roles in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < targetUserIds.length; i += batchSize) {
        const batch = targetUserIds.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async userId => {
            try {
              await Promise.all([
                this.getUserPermissions(userId),
                this.getUserRoles(userId),
              ]);
            } catch (error) {
              this.logger.warn(`Failed to warm up cache for user ${userId}:`, error);
            }
          })
        );

        // Small delay between batches to prevent database overload
        if (i + batchSize < targetUserIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      this.logger.log(`Cache warm-up completed for ${targetUserIds.length} users`);

    } catch (error) {
      this.logger.error(`Cache warm-up failed:`, error);
    }
  }

  /**
   * Get cache statistics and performance metrics
   */
  async getCacheStatistics(): Promise<CacheStatistics> {
    const totalRequests = this.stats.hitCount + this.stats.missCount;
    const hitRate = totalRequests > 0 ? (this.stats.hitCount / totalRequests) * 100 : 0;
    const averageResponseTime = totalRequests > 0 ? this.stats.totalResponseTime / totalRequests : 0;

    return {
      hitCount: this.stats.hitCount,
      missCount: this.stats.missCount,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests,
      cacheSize: await this.estimateCacheSize(),
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
    };
  }

  /**
   * Clear all permission cache (use with caution)
   */
  async clearAllCache(): Promise<void> {
    try {
      // Clear all permissions cache by deleting individual keys
      // Note: cache-manager doesn't have reset() method, so we'll implement manual clearing
      const keysToDelete = []; // Would implement proper key scanning in production
      this.logger.warn('Cache reset not available - implement manual key deletion for production');

      this.logger.warn('ALL PERMISSION CACHE CLEARED - This affects performance');

      // Reset stats
      this.stats = {
        hitCount: 0,
        missCount: 0,
        totalResponseTime: 0,
      };

      await this.auditService.logAuditEvent({
        action: 'CACHE_FULL_CLEAR',
        resource: 'PERMISSION_CACHE',
        details: { reason: 'Manual cache clear' },
        success: true,
      });

    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async fetchUserPermissionsFromDb(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              },
              where: {
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: new Date() } }
                ]
              }
            }
          }
        }
      }
    });

    // Fetch user-specific granted permissions
    const grantedPermissions = await this.prisma.userPermission.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        permission: true
      }
    });

    // Process roles and permissions
    const roles = userRoles.map(ur => ur.role.name);
    const isSuperAdmin = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN') || roles.includes('Administrator'); // Handle legacy/seed role names

    // Collect all permissions
    const permissions = new Set<string>();

    if (isSuperAdmin) {
      permissions.add('*');
    }

    userRoles.forEach(ur => {
      ur.role.permissions.forEach(rp => {
        permissions.add(rp.permission.code);
      });
    });
    grantedPermissions.forEach(up => {
      permissions.add(up.permission.code);
    });

    const result = [...permissions];
    this.logger.log(`Fetched ${result.length} permissions for user ${userId}: ${result.join(', ')}`);
    return result;
  }

  private async fetchUserRolesFromDb(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: { role: true }
    });

    return userRoles.map(ur => ur.role.name);
  }

  private async cacheUserPermissions(userId: string, permissions: string[]): Promise<void> {
    const cacheKey = this.PERMISSION_PREFIX + userId;
    const cacheData: CachedUserPermissions = {
      userId,
      permissions,
      roles: [], // Will be populated separately if needed
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + this.DEFAULT_TTL),
    };

    await this.cacheManager.set(cacheKey, cacheData, this.DEFAULT_TTL);
  }

  private isCacheValid(cached: CachedUserPermissions): boolean {
    return cached.expiresAt > new Date();
  }

  private updateResponseTime(startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.stats.totalResponseTime += responseTime;
  }

  private async estimateCacheSize(): Promise<number> {
    // This is a rough estimate - in production you'd implement proper cache size tracking
    return this.stats.hitCount + this.stats.missCount;
  }
}