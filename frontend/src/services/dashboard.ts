import { api } from './api';

// ================================
// DASHBOARD METRICS TYPES
// ================================

export interface DashboardMetrics {
  // Account Metrics
  totalAccounts: number;
  activeAccounts: number;
  touchedAccounts: number;
  newAccountsThisWeek: number;
  
  // Call Metrics
  totalCallsToday: number;
  totalCallsThisWeek: number;
  averageCallDuration: number;
  contactRate: number;
  
  // Financial Metrics
  totalCollected: number;
  totalCollectedThisMonth: number;
  collectionRate: number;
  averageCollection: number;
  teamQuota?: number;
  
  // Agent Performance
  totalAgents: number;
  activeAgents: number;
  topAgents: AgentPerformance[];
  
  // Account Status Breakdown
  accountsByStatus: Record<string, number>;
  
  // Timeline Data
  collectionsTimeline: TimelineData[];
  callsTimeline: TimelineData[];
  
  // Call Time Breakdown
  timeOfDayBreakdown?: {
    morning: number;
    afternoon: number;
    evening: number;
  };
}

export interface AgentPerformance {
  id: string;
  name: string;
  email: string;
  callsToday: number;
  totalCalls: number;
  collections: number;
  contactRate: number;
  avgCallDuration: number;
}

export interface TimelineData {
  date: string;
  value: number;
  label?: string;
}

export interface AccountStatistics {
  totalAccounts: number;
  totalCollections: number;
  totalBalance: number;
  teamQuota?: number;
  accountsByStatus: {
    active: number;
    new: number;
    ptp: number;
    paid: number;
    touched: number;
    [key: string]: number;
  };
}

export interface CallStatistics {
  totalCalls: number;
  callsToday: number;
  callsThisWeek: number;
  completedCalls: number;
  avgDuration: number;
  successRate: number;
  dispositionBreakdown: Record<string, number>;
  timeOfDayBreakdown: {
    morning: number;
    afternoon: number;
    evening: number;
  };
}

export interface RecentCollection {
  id: string;
  accountNumber: string;
  fullName: string;
  lastPaymentAmount: number;
  lastPaymentDate: string;
}

// ================================
// DASHBOARD SERVICE
// ================================

class DashboardService {
  // No baseUrl needed since api.get() already includes /api prefix

  // ================================
  // COMBINED DASHBOARD METRICS
  // ================================
  
  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Get account statistics
      const accountStats = await this.getAccountStatistics();
      
      // Get call statistics
      const callStats = await this.getCallStatistics();
      
      // Get agent performance
      const agentPerformance = await this.getAgentPerformance();
      
      // Combine into dashboard metrics
      return {
        // Account Metrics
        totalAccounts: accountStats.totalAccounts,
        activeAccounts: accountStats.accountsByStatus.active || 0,
        touchedAccounts: accountStats.accountsByStatus.touched || 0,
        newAccountsThisWeek: accountStats.accountsByStatus.new || 0,
        
        // Call Metrics
        totalCallsToday: callStats.callsToday,
        totalCallsThisWeek: callStats.callsThisWeek,
        averageCallDuration: callStats.avgDuration,
        contactRate: callStats.successRate,
        
        // Financial Metrics
        totalCollected: accountStats.totalCollections,
        totalCollectedThisMonth: accountStats.totalCollections,
        collectionRate: (accountStats.totalCollections + accountStats.totalBalance) > 0 
          ? (accountStats.totalCollections / (accountStats.totalCollections + accountStats.totalBalance)) * 100 
          : 0,
        averageCollection: accountStats.accountsByStatus.paid > 0 
          ? accountStats.totalCollections / accountStats.accountsByStatus.paid 
          : 0,
        teamQuota: accountStats.teamQuota,
        
        // Agent Performance
        totalAgents: agentPerformance.length,
        activeAgents: agentPerformance.filter(a => a.callsToday > 0).length,
        topAgents: agentPerformance.slice(0, 5),
        
        // Status Breakdown
        accountsByStatus: accountStats.accountsByStatus,
        
        // Call Time Breakdown
        timeOfDayBreakdown: callStats.timeOfDayBreakdown,

        // Timeline Data (mock for now)
        collectionsTimeline: this.generateMockTimeline(7, accountStats.totalCollections / 7),
        callsTimeline: this.generateMockTimeline(7, callStats.totalCalls),
      };
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      throw error;
    }
  }

  // ================================
  // ACCOUNT STATISTICS
  // ================================
  
  /**
   * Get account-related statistics
   */
  async getAccountStatistics(): Promise<AccountStatistics> {
    try {
      const response = await api.get<AccountStatistics>(`/accounts/statistics`);
      return response;
    } catch (error) {
      console.error('Failed to fetch account statistics:', error);
      // Return empty data as fallback
      return {
        totalAccounts: 0,
        totalCollections: 0,
        totalBalance: 0,
        accountsByStatus: {
          active: 0,
          new: 0,
          ptp: 0,
          paid: 0,
          touched: 0
        }
      };
    }
  }

  // ================================
  // CALL STATISTICS
  // ================================
  
  /**
   * Get call-related statistics
   */
  async getCallStatistics(): Promise<CallStatistics> {
    try {
      const response = await api.get<CallStatistics>(`/calls/statistics`);
      return response;
    } catch (error) {
      console.error('Failed to fetch call statistics:', error);
      return {
        totalCalls: 0,
        callsToday: 0,
        callsThisWeek: 0,
        completedCalls: 0,
        avgDuration: 0,
        successRate: 0,
        dispositionBreakdown: {},
        timeOfDayBreakdown: { morning: 0, afternoon: 0, evening: 0 }
      };
    }
  }

  /**
   * Get recent collections
   */
  async getRecentCollections(): Promise<RecentCollection[]> {
    try {
      const response = await api.get<RecentCollection[]>(`/accounts/recent-collections`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch recent collections:', error);
      return [];
    }
  }

  // ================================
  // AGENT PERFORMANCE
  // ================================
  
  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(): Promise<AgentPerformance[]> {
    try {
      const response = await api.get<AgentPerformance[]>(`/users/performance`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch agent performance:', error);
      return [];
    }
  }

  // ================================
  // MOCK DATA GENERATORS
  // ================================
  
  private getMockAccountStatistics(): AccountStatistics {
    return {
      totalAccounts: 2847,
      accountsByStatus: {
        NEW: 425,
        ACTIVE: 1234,
        TOUCHED: 892,
        PTP: 156,
        COLLECTED: 98,
        CLOSED: 42,
      },
      accountsByPriority: {
        HIGH: 340,
        MEDIUM: 1567,
        LOW: 940,
      },
      totalBalance: 15420000,
      collectedAmount: 3890000,
      averageBalance: 5420,
    };
  }

  private getMockCallStatistics(): CallStatistics {
    return {
      totalCalls: 1856,
      callsToday: 234,
      callsThisWeek: 1247,
      callsThisMonth: 4567,
      averageDuration: 285, // seconds
      contactRate: 72.5,
      callsByDisposition: {
        'Contact Made': 894,
        'No Answer': 456,
        'Busy': 234,
        'Wrong Number': 123,
        'Payment Promise': 89,
        'Full Payment': 60,
      },
    };
  }

  private getMockAgentPerformance(): AgentPerformance[] {
    return [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        callsToday: 47,
        totalCalls: 1234,
        collections: 45230,
        contactRate: 82,
        avgCallDuration: 245,
      },
      {
        id: '2',
        name: 'Mike Rodriguez',
        email: 'mike.rodriguez@company.com',
        callsToday: 43,
        totalCalls: 1189,
        collections: 42890,
        contactRate: 79,
        avgCallDuration: 267,
      },
      {
        id: '3',
        name: 'Emma Davis',
        email: 'emma.davis@company.com',
        callsToday: 39,
        totalCalls: 1098,
        collections: 38760,
        contactRate: 76,
        avgCallDuration: 223,
      },
    ];
  }

  private generateMockTimeline(days: number, avgValue: number): TimelineData[] {
    const timeline: TimelineData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      timeline.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(avgValue * (0.8 + Math.random() * 0.4)), // ±20% variance
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      });
    }
    
    return timeline;
  }
}

// ================================
// SINGLETON INSTANCE
// ================================
export const dashboardService = new DashboardService();

// ================================
// CONVENIENCE EXPORTS
// ================================
export const dashboard = {
  getMetrics: () => dashboardService.getDashboardMetrics(),
  getAccountStats: () => dashboardService.getAccountStatistics(),
  getCallStats: () => dashboardService.getCallStatistics(),
  getAgentPerformance: () => dashboardService.getAgentPerformance(),
};