import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionCacheService } from '../common/services/permission-cache.service';
import { User } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private permissionCache: PermissionCacheService
  ) {}

  async getPerformanceData(currentUser?: User) {
    // Get data for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const whereCall: any = {
      startTime: { gte: startDate }
    };

    const whereAccount: any = {
      lastPaymentDate: { gte: startDate },
      lastPaymentAmount: { gt: 0 }
    };

    if (currentUser) {
      const hasViewAll = await this.permissionCache.hasPermission(currentUser.id, 'reports.view_all');
      
      if (!hasViewAll) {
        const hasViewTeam = await this.permissionCache.hasPermission(currentUser.id, 'reports.view_team');
        
        if (hasViewTeam) {
          const teamFilter = {
            OR: [
              { managerId: currentUser.id },
              { id: currentUser.id }
            ]
          };
          whereCall.agent = teamFilter;
          whereAccount.assignedAgent = teamFilter;
        } else {
          // Default: only see self
          whereCall.agentId = currentUser.id;
          whereAccount.assignedAgentId = currentUser.id;
        }
      }
    }

    // Group by day
    const dailyStats = new Map<string, { callVolume: number; collections: number; contactRate: number }>();

    // Initialize map with last 30 days
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = d.toISOString().split('T')[0];
      dailyStats.set(day, { callVolume: 0, collections: 0, contactRate: 0 });
    }

    // Fetch calls using Prisma Client (safer and DB-agnostic)
    const allCalls = await this.prisma.call.findMany({
      where: whereCall,
      select: { startTime: true, status: true, disposition: true }
    });

    allCalls.forEach(call => {
      const day = call.startTime.toISOString().split('T')[0];
      if (dailyStats.has(day)) {
        const stats = dailyStats.get(day);
        stats.callVolume++;
        // Calculate contact rate based on actual dispositions or completed status
        if (call.status === 'COMPLETED' || (call.disposition && ['RPC', 'PROMISE', 'PAYMENT'].includes(call.disposition))) {
           stats.contactRate++; // Using this field to store count temporarily
        }
      }
    });

    // Collections
    const collections = await this.prisma.account.findMany({
      where: whereAccount,
      select: { lastPaymentDate: true, lastPaymentAmount: true }
    });

    collections.forEach(col => {
      if (col.lastPaymentDate) {
        const day = col.lastPaymentDate.toISOString().split('T')[0];
        if (dailyStats.has(day)) {
          const stats = dailyStats.get(day);
          stats.collections += 1;
        }
      }
    });

    // Format for chart
    return Array.from(dailyStats.entries()).map(([date, stats]) => ({
      name: date.split('-')[2], // Just the day number
      fullDate: date,
      callVolume: stats.callVolume,
      collections: stats.collections,
      contactRate: stats.callVolume > 0 ? Math.round((stats.contactRate / stats.callVolume) * 100) : 0
    })).slice(-10); // Return last 10 days
  }

  async getAudienceData(currentUser?: User) {
    const where: any = {};
    
    if (currentUser) {
      const hasViewAll = await this.permissionCache.hasPermission(currentUser.id, 'reports.view_all');
      
      if (!hasViewAll) {
        const hasViewTeam = await this.permissionCache.hasPermission(currentUser.id, 'reports.view_team');
        
        if (hasViewTeam) {
          where.assignedAgent = {
            OR: [
              { managerId: currentUser.id },
              { id: currentUser.id }
            ]
          };
        } else {
          where.assignedAgentId = currentUser.id;
        }
      }
    }

    const [active, overdue, newAccounts] = await Promise.all([
      this.prisma.account.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.account.count({ where: { ...where, daysPastDue: { gt: 30 } } }), // Assuming overdue logic
      this.prisma.account.count({ where: { ...where, status: 'NEW' } })
    ]);

    return [
      { name: 'Current Accounts', value: active, color: 'hsl(var(--primary))' },
      { name: 'Overdue Accounts', value: overdue, color: 'hsl(var(--accent))' },
      { name: 'New Placements', value: newAccounts, color: 'hsl(var(--primary-glow))' }
    ];
  }

  async getRecentReports(currentUser?: User) {
    // Generate "Daily Reports" based on actual data
    const today = new Date();
    const reports = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Get stats for this day
      const callsCount = await this.prisma.call.count({
        where: {
          startTime: {
            gte: new Date(dateStr + 'T00:00:00.000Z'),
            lte: new Date(dateStr + 'T23:59:59.999Z')
          }
        }
      });

      const collectionsSum = await this.prisma.account.aggregate({
        where: {
          lastPaymentDate: {
            gte: new Date(dateStr + 'T00:00:00.000Z'),
            lte: new Date(dateStr + 'T23:59:59.999Z')
          }
        },
        _sum: { amountPaid: true }
      });

      reports.push({
        id: `RPT-${dateStr.replace(/-/g, '')}`,
        title: `Daily Collections Report - ${date.toLocaleDateString()}`,
        description: "Daily performance analysis",
        audienceReached: callsCount.toString(),
        roi: "N/A",
        ctr: callsCount > 0 ? "45%" : "0%", // Placeholder
        cpl: `$${(collectionsSum._sum.amountPaid || 0).toLocaleString()}`,
        budget: "Target: $5k",
        manager: "System Generated",
        avatar: "SG",
        status: "completed"
      });
    }
    return reports;
  }
}
