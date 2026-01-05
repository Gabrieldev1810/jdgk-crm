import { api } from './api';

export interface PerformanceData {
  name: string;
  fullDate: string;
  callVolume: number;
  collections: number;
  contactRate: number;
}

export interface AudienceData {
  name: string;
  value: number;
  color: string;
}

export interface ReportItem {
  id: string;
  title: string;
  description: string;
  audienceReached: string;
  roi: string;
  ctr: string;
  cpl: string;
  budget: string;
  manager: string;
  avatar: string;
  status: string;
}

export const reportsService = {
  getPerformance: async (): Promise<PerformanceData[]> => {
    try {
      const response = await api.get<PerformanceData[]>('/reports/performance');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
      return [];
    }
  },

  getAudience: async (): Promise<AudienceData[]> => {
    try {
      const response = await api.get<AudienceData[]>('/reports/audience');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch audience data:', error);
      return [];
    }
  },

  getRecentReports: async (): Promise<ReportItem[]> => {
    try {
      const response = await api.get<ReportItem[]>('/reports/recent');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch recent reports:', error);
      return [];
    }
  }
};
