import { api } from './api';
import {
  Call,
  CreateCallRequest,
  UpdateCallRequest,
  CallSearchParams,
  CallStatistics
} from '@/types/api';

export class CallsService {
  private baseUrl = '/calls';

  // ================================
  // CALL CRUD OPERATIONS
  // ================================
  async getCalls(params?: CallSearchParams): Promise<{
    data: Call[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await api.get<{
      data: Call[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(this.baseUrl, params);
    return response;
  }

  async getCall(id: string): Promise<Call> {
    const response = await api.get<Call>(`${this.baseUrl}/${id}`);
    return response;
  }

  async createCall(data: CreateCallRequest): Promise<Call> {
    const response = await api.post<Call>(this.baseUrl, data);
    return response;
  }

  async updateCall(id: string, data: UpdateCallRequest): Promise<Call> {
    const response = await api.patch<Call>(`${this.baseUrl}/${id}`, data);
    return response;
  }

  async deleteCall(id: string): Promise<void> {
    await api.delete<{ message: string, id: string }>(`${this.baseUrl}/${id}`);
  }

  // ================================
  // ACCOUNT-SPECIFIC CALLS
  // ================================
  async getCallsByAccount(accountId: string, params?: Omit<CallSearchParams, 'accountId'>): Promise<{
    data: Call[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await api.get<{
      data: Call[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`${this.baseUrl}/account/${accountId}`, params);
    return response;
  }

  // ================================
  // STATISTICS & ANALYTICS
  // ================================
  async getCallStatistics(accountId?: string): Promise<CallStatistics> {
    const params = accountId ? { accountId } : undefined;
    const response = await api.get<CallStatistics>(`${this.baseUrl}/statistics`, params);
    return response;
  }

  // ================================
  // HELPER METHODS
  // ================================
  formatDuration(seconds?: number): string {
    if (!seconds) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getDispositionDisplay(disposition?: string): string {
    if (!disposition) return 'No Disposition';

    const dispositionMap: Record<string, string> = {
      CONTACT_MADE: 'Contact Made',
      LEFT_MESSAGE: 'Left Message',
      NO_ANSWER: 'No Answer',
      BUSY: 'Busy',
      WRONG_NUMBER: 'Wrong Number',
      DISCONNECTED: 'Disconnected',
      PROMISE_TO_PAY: 'Promise to Pay',
      PAYMENT_MADE: 'Payment Made',
      CALLBACK_REQUESTED: 'Callback Requested',
      DO_NOT_CALL: 'Do Not Call',
      DISPUTE: 'Dispute'
    };

    return dispositionMap[disposition] || disposition;
  }

  getStatusDisplay(status: string): string {
    const statusMap: Record<string, string> = {
      RINGING: 'Ringing',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      FAILED: 'Failed',
      BUSY: 'Busy',
      NO_ANSWER: 'No Answer',
      CANCELLED: 'Cancelled'
    };

    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      RINGING: 'text-blue-600',
      IN_PROGRESS: 'text-orange-600',
      COMPLETED: 'text-green-600',
      FAILED: 'text-red-600',
      BUSY: 'text-yellow-600',
      NO_ANSWER: 'text-gray-600',
      CANCELLED: 'text-gray-500'
    };

    return colorMap[status] || 'text-gray-600';
  }

  getDispositionColor(disposition?: string): string {
    if (!disposition) return 'text-gray-600';

    const colorMap: Record<string, string> = {
      CONTACT_MADE: 'text-green-600',
      PROMISE_TO_PAY: 'text-blue-600',
      PAYMENT_MADE: 'text-emerald-600',
      CALLBACK_REQUESTED: 'text-purple-600',
      LEFT_MESSAGE: 'text-blue-500',
      NO_ANSWER: 'text-gray-600',
      BUSY: 'text-yellow-600',
      WRONG_NUMBER: 'text-orange-600',
      DISCONNECTED: 'text-red-600',
      DO_NOT_CALL: 'text-red-700',
      DISPUTE: 'text-red-800'
    };

    return colorMap[disposition] || 'text-gray-600';
  }

  // ================================
  // VALIDATION METHODS
  // ================================
  validateCallData(data: CreateCallRequest | UpdateCallRequest): string[] {
    const errors: string[] = [];

    if ('accountId' in data && !data.accountId) {
      errors.push('Account ID is required');
    }

    if ('agentId' in data && !data.agentId) {
      errors.push('Agent ID is required');
    }

    if ('direction' in data && !data.direction) {
      errors.push('Call direction is required');
    }

    if ('status' in data && !data.status) {
      errors.push('Call status is required');
    }

    if (data.duration && data.duration < 0) {
      errors.push('Duration cannot be negative');
    }

    if (data.amountPromised && data.amountPromised < 0) {
      errors.push('Amount promised cannot be negative');
    }

    if (data.amountCollected && data.amountCollected < 0) {
      errors.push('Amount collected cannot be negative');
    }

    return errors;
  }
}

// Export singleton instance
export const callsService = new CallsService();