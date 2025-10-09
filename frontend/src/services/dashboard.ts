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
  
  // Agent Performance
  totalAgents: number;
  activeAgents: number;
  topAgents: AgentPerformance[];
  
  // Account Status Breakdown
  accountsByStatus: Record<string, number>;
  
  // Timeline Data
  collectionsTimeline: TimelineData[];
  callsTimeline: TimelineData[];
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
  accountsByStatus: {
    NEW: number;
    ACTIVE: number;
    TOUCHED: number;
    PTP: number;
    COLLECTED: number;
    CLOSED: number;
  };
  accountsByPriority: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  totalBalance: number;
  collectedAmount: number;
  averageBalance: number;
}

export interface CallStatistics {
  totalCalls: number;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
  averageDuration: number;
  contactRate: number;
  callsByDisposition: Record<string, number>;
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
      
      // Get call statistics (mock for now, will implement when calls module is ready)
      const callStats = await this.getCallStatistics();
      
      // Get agent performance
      const agentPerformance = await this.getAgentPerformance();
      
      // Combine into dashboard metrics
      return {
        // Account Metrics
        totalAccounts: accountStats.totalAccounts,
        activeAccounts: accountStats.accountsByStatus.ACTIVE || 0,
        touchedAccounts: accountStats.accountsByStatus.TOUCHED || 0,
        newAccountsThisWeek: 0, // TODO: Implement date-based queries
        
        // Call Metrics
        totalCallsToday: callStats.callsToday,
        totalCallsThisWeek: callStats.callsThisWeek,
        averageCallDuration: callStats.averageDuration,
        contactRate: callStats.contactRate,
        
        // Financial Metrics
        totalCollected: accountStats.collectedAmount,
        totalCollectedThisMonth: accountStats.collectedAmount, // TODO: Monthly filter
        collectionRate: (accountStats.collectedAmount / accountStats.totalBalance) * 100,
        averageCollection: accountStats.collectedAmount / (accountStats.accountsByStatus.COLLECTED || 1),
        
        // Agent Performance
        totalAgents: agentPerformance.length,
        activeAgents: agentPerformance.filter(a => a.callsToday > 0).length,
        topAgents: agentPerformance.slice(0, 5),
        
        // Status Breakdown
        accountsByStatus: accountStats.accountsByStatus,
        
        // Timeline Data (mock for now)
        collectionsTimeline: this.generateMockTimeline(7, accountStats.collectedAmount / 7),
        callsTimeline: this.generateMockTimeline(7, callStats.callsToday),
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
      // Return mock data as fallback
      return this.getMockAccountStatistics();
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
      // TODO: Implement when calls API is ready
      // const response = await api.get<CallStatistics>(`${this.baseUrl}/calls/statistics`);
      // return response;
      
      // Return mock data for now
      return this.getMockCallStatistics();
    } catch (error) {
      console.error('Failed to fetch call statistics:', error);
      return this.getMockCallStatistics();
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
      // Get all users with role filtering
      const response = await api.get<any[]>(`/users`);
      
      // Transform to agent performance (with mock call data for now)
      return response
        .filter(user => user.role === 'AGENT' || user.role === 'MANAGER')
        .map((user, index) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          callsToday: Math.floor(Math.random() * 50) + 10, // Mock
          totalCalls: Math.floor(Math.random() * 500) + 100, // Mock
          collections: Math.floor(Math.random() * 50000) + 10000, // Mock
          contactRate: Math.floor(Math.random() * 30) + 70, // Mock
          avgCallDuration: Math.floor(Math.random() * 300) + 120, // Mock
        }))
        .sort((a, b) => b.collections - a.collections);
    } catch (error) {
      console.error('Failed to fetch agent performance:', error);
      return this.getMockAgentPerformance();
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