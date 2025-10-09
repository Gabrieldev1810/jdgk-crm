import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuditLoggingService } from './audit-logging.service';

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  blockDurationMs?: number; // How long to block after limit exceeded
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: Date;
  retryAfter?: number; // Seconds to wait if blocked
}

export interface RateLimitStats {
  identifier: string;
  requestCount: number;
  windowStart: Date;
  windowEnd: Date;
  isBlocked: boolean;
  blockExpiresAt?: Date;
}

@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);
  
  // Cache key prefixes
  private readonly RATE_LIMIT_PREFIX = 'rate_limit:';
  private readonly BLOCK_PREFIX = 'blocked:';
  
  // Default rate limit configurations
  private readonly defaultConfigs: Record<string, RateLimitConfig> = {
    // Authentication endpoints
    'auth:login': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
    'auth:refresh': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 refresh per minute
    
    // RBAC management (more restrictive for security)
    'rbac:role_create': { windowMs: 60 * 1000, maxRequests: 5 }, // 5 role creates per minute
    'rbac:permission_create': { windowMs: 60 * 1000, maxRequests: 3 }, // 3 permission creates per minute
    'rbac:admin_operations': { windowMs: 60 * 1000, maxRequests: 2, blockDurationMs: 5 * 60 * 1000 }, // 2 admin ops per minute, block for 5 min
    
    // User management
    'users:create': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 user creates per minute
    'users:update': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 user updates per minute
    
    // Data access (more permissive for normal operations)
    'data:read': { windowMs: 60 * 1000, maxRequests: 100 }, // 100 reads per minute
    'data:write': { windowMs: 60 * 1000, maxRequests: 50 }, // 50 writes per minute
    
    // API general (fallback)
    'api:general': { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
    
    // High security operations
    'security:password_reset': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 password resets per hour
    'security:account_unlock': { windowMs: 60 * 60 * 1000, maxRequests: 2 }, // 2 unlock attempts per hour
  };

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private auditService: AuditLoggingService,
  ) {}

  /**
   * Check if request is allowed under rate limit
   */
  async checkRateLimit(
    identifier: string, // User ID, IP address, or combination
    action: string,
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const config = this.getRateLimitConfig(action, customConfig);
    const cacheKey = this.getRateLimitKey(identifier, action);
    
    try {
      // Check if currently blocked
      const blockKey = this.getBlockKey(identifier, action);
      const blockData = await this.cacheManager.get<{ blockedUntil: number }>(blockKey);
      
      if (blockData && Date.now() < blockData.blockedUntil) {
        const retryAfter = Math.ceil((blockData.blockedUntil - Date.now()) / 1000);
        
        // Log blocked request attempt
        await this.auditService.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          details: {
            reason: 'Rate limit exceeded - request blocked',
            action,
            identifier,
            retryAfter,
          },
        });
        
        return {
          allowed: false,
          remainingRequests: 0,
          resetTime: new Date(blockData.blockedUntil),
          retryAfter,
        };
      }

      // Get current rate limit data
      const currentData = await this.cacheManager.get<{
        count: number;
        windowStart: number;
        resetTime: number;
      }>(cacheKey);

      const now = Date.now();
      const windowStart = now - config.windowMs;

      // If no data exists or window has expired, start fresh
      if (!currentData || currentData.windowStart < windowStart) {
        const resetTime = now + config.windowMs;
        
        await this.cacheManager.set(
          cacheKey,
          { count: 1, windowStart: now, resetTime },
          config.windowMs
        );

        return {
          allowed: true,
          remainingRequests: config.maxRequests - 1,
          resetTime: new Date(resetTime),
        };
      }

      // Check if limit exceeded
      if (currentData.count >= config.maxRequests) {
        // Block user if configured
        if (config.blockDurationMs) {
          const blockedUntil = now + config.blockDurationMs;
          await this.cacheManager.set(
            blockKey,
            { blockedUntil },
            config.blockDurationMs
          );
        }

        // Log rate limit violation
        await this.auditService.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          details: {
            reason: 'Rate limit exceeded',
            action,
            identifier,
            requestCount: currentData.count,
            maxAllowed: config.maxRequests,
            windowMs: config.windowMs,
          },
        });

        const retryAfter = config.blockDurationMs 
          ? Math.ceil(config.blockDurationMs / 1000)
          : Math.ceil((currentData.resetTime - now) / 1000);

        return {
          allowed: false,
          remainingRequests: 0,
          resetTime: new Date(currentData.resetTime),
          retryAfter,
        };
      }

      // Increment counter
      const newCount = currentData.count + 1;
      await this.cacheManager.set(
        cacheKey,
        { 
          count: newCount, 
          windowStart: currentData.windowStart, 
          resetTime: currentData.resetTime 
        },
        Math.ceil((currentData.resetTime - now) / 1000) // TTL until reset
      );

      return {
        allowed: true,
        remainingRequests: config.maxRequests - newCount,
        resetTime: new Date(currentData.resetTime),
      };

    } catch (error) {
      this.logger.error(`Rate limit check failed for ${identifier}:${action}:`, error);
      
      // Fail open - allow request if rate limiting service fails
      return {
        allowed: true,
        remainingRequests: config.maxRequests - 1,
        resetTime: new Date(Date.now() + config.windowMs),
      };
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(identifier: string, action: string): Promise<RateLimitStats | null> {
    const cacheKey = this.getRateLimitKey(identifier, action);
    const blockKey = this.getBlockKey(identifier, action);
    
    try {
      const [currentData, blockData] = await Promise.all([
        this.cacheManager.get<{
          count: number;
          windowStart: number;
          resetTime: number;
        }>(cacheKey),
        this.cacheManager.get<{ blockedUntil: number }>(blockKey),
      ]);

      if (!currentData) {
        return null;
      }

      const isBlocked = blockData && Date.now() < blockData.blockedUntil;

      return {
        identifier,
        requestCount: currentData.count,
        windowStart: new Date(currentData.windowStart),
        windowEnd: new Date(currentData.resetTime),
        isBlocked: !!isBlocked,
        blockExpiresAt: isBlocked ? new Date(blockData.blockedUntil) : undefined,
      };

    } catch (error) {
      this.logger.error(`Failed to get rate limit status for ${identifier}:${action}:`, error);
      return null;
    }
  }

  /**
   * Reset rate limit for specific identifier and action
   */
  async resetRateLimit(identifier: string, action: string, reason: string = 'Manual reset'): Promise<void> {
    const cacheKey = this.getRateLimitKey(identifier, action);
    const blockKey = this.getBlockKey(identifier, action);
    
    try {
      await Promise.all([
        this.cacheManager.del(cacheKey),
        this.cacheManager.del(blockKey),
      ]);

      this.logger.log(`Rate limit reset for ${identifier}:${action} - ${reason}`);
      
      await this.auditService.logAuditEvent({
        action: 'RATE_LIMIT_RESET',
        resource: 'RATE_LIMITING',
        details: { identifier, actionType: action, reason },
        success: true,
      });

    } catch (error) {
      this.logger.error(`Failed to reset rate limit for ${identifier}:${action}:`, error);
    }
  }

  /**
   * Reset all rate limits for an identifier (e.g., when user is cleared by admin)
   */
  async resetAllRateLimitsForIdentifier(identifier: string, reason: string = 'Admin clear'): Promise<void> {
    try {
      // In production, you'd scan for keys with the identifier prefix
      // For now, we'll clear known action types
      const knownActions = Object.keys(this.defaultConfigs);
      
      const promises = knownActions.map(action => 
        this.resetRateLimit(identifier, action, reason)
      );
      
      await Promise.all(promises);
      
      this.logger.log(`All rate limits cleared for identifier ${identifier} - ${reason}`);

    } catch (error) {
      this.logger.error(`Failed to clear all rate limits for ${identifier}:`, error);
    }
  }

  /**
   * Get rate limiting statistics and configuration
   */
  async getRateLimitingStats(): Promise<{
    configurations: Record<string, RateLimitConfig>;
    activeIdentifiers: number;
    blockedIdentifiers: number;
  }> {
    return {
      configurations: this.defaultConfigs,
      activeIdentifiers: 0, // Would implement key scanning in production
      blockedIdentifiers: 0, // Would implement key scanning in production
    };
  }

  /**
   * Update rate limit configuration (runtime configuration changes)
   */
  updateRateLimitConfig(action: string, config: RateLimitConfig): void {
    this.defaultConfigs[action] = config;
    
    this.logger.log(`Rate limit configuration updated for action: ${action}`, config);
    
    // In production, you might want to persist this to database
    // and broadcast to other service instances
  }

  /**
   * Check if IP address should be blocked based on suspicious activity
   */
  async checkIPReputition(ipAddress: string): Promise<{
    isBlocked: boolean;
    reason?: string;
    blockedUntil?: Date;
  }> {
    // This would integrate with external IP reputation services
    // or internal blacklist/whitelist management
    
    const blockKey = `ip_block:${ipAddress}`;
    
    try {
      const blockData = await this.cacheManager.get<{
        reason: string;
        blockedUntil: number;
      }>(blockKey);

      if (blockData && Date.now() < blockData.blockedUntil) {
        return {
          isBlocked: true,
          reason: blockData.reason,
          blockedUntil: new Date(blockData.blockedUntil),
        };
      }

      return { isBlocked: false };

    } catch (error) {
      this.logger.error(`Failed to check IP reputation for ${ipAddress}:`, error);
      return { isBlocked: false };
    }
  }

  /**
   * Block IP address for security reasons
   */
  async blockIPAddress(
    ipAddress: string, 
    durationMs: number, 
    reason: string,
    adminUserId?: string
  ): Promise<void> {
    const blockKey = `ip_block:${ipAddress}`;
    const blockedUntil = Date.now() + durationMs;
    
    try {
      await this.cacheManager.set(
        blockKey,
        { reason, blockedUntil },
        durationMs
      );

      this.logger.warn(`IP address ${ipAddress} blocked for ${durationMs}ms - ${reason}`);
      
      await this.auditService.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        userId: adminUserId,
        ipAddress,
        details: {
          action: 'IP_ADDRESS_BLOCKED',
          reason,
          durationMs,
          blockedUntil: new Date(blockedUntil),
        },
      });

    } catch (error) {
      this.logger.error(`Failed to block IP address ${ipAddress}:`, error);
    }
  }

  /**
   * Private helper methods
   */
  private getRateLimitConfig(action: string, customConfig?: Partial<RateLimitConfig>): RateLimitConfig {
    const baseConfig = this.defaultConfigs[action] || this.defaultConfigs['api:general'];
    return { ...baseConfig, ...customConfig };
  }

  private getRateLimitKey(identifier: string, action: string): string {
    return `${this.RATE_LIMIT_PREFIX}${identifier}:${action}`;
  }

  private getBlockKey(identifier: string, action: string): string {
    return `${this.BLOCK_PREFIX}${identifier}:${action}`;
  }
}