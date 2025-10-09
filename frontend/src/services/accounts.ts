import api from './api';
import type { 
  Account, 
  CreateAccountRequest, 
  UpdateAccountRequest, 
  AccountSearchParams,
  AccountStatistics,
  PaginatedResponse,
  BulkUploadRequest,
  BulkUploadResponse
} from '../types/api';

// ================================
// ACCOUNT SERVICE
// ================================
class AccountService {
  private readonly baseUrl = '/accounts';

  // ================================
  // CRUD OPERATIONS
  // ================================
  async getAccounts(params?: AccountSearchParams): Promise<PaginatedResponse<Account>> {
    const response = await api.get<{accounts: Account[], pagination: {page: number, limit: number, total: number, totalPages: number}}>(this.baseUrl, params);
    return {
      data: response.accounts,
      pagination: response.pagination,
      success: true,
      timestamp: new Date().toISOString()
    };
  }

  async getAccount(id: string): Promise<Account> {
    const response = await api.get<Account>(`${this.baseUrl}/${id}`);
    return response;
  }

  async createAccount(data: CreateAccountRequest): Promise<Account> {
    const response = await api.post<Account>(this.baseUrl, data);
    return response;
  }

  async updateAccount(id: string, data: UpdateAccountRequest): Promise<Account> {
    const response = await api.patch<Account>(`${this.baseUrl}/${id}`, data);
    return response;
  }

  async getStatistics(): Promise<AccountStatistics> {
    const response = await api.get<AccountStatistics>(`${this.baseUrl}/statistics`);
    return response;
  }

  async deleteAccount(id: string): Promise<void> {
    await api.delete<{message: string, id: string}>(`${this.baseUrl}/${id}`);
  }

  // ================================
  // BULK OPERATIONS
  // ================================
  async bulkUpload(data: BulkUploadRequest): Promise<BulkUploadResponse> {
    const formData = new FormData();
    formData.append('file', data.file);
    
    const response = await api.post<BulkUploadResponse>(`${this.baseUrl}/bulk-upload`, formData);
    return response;
  }

  async exportAccounts(params?: AccountSearchParams): Promise<{data: string; filename: string; contentType: string}> {
    const response = await api.get<{data: string; filename: string; contentType: string}>(`${this.baseUrl}/export`, params);
    return response;
  }

  // ================================
  // AGENT OPERATIONS
  // ================================
  async assignToAgent(accountId: string, agentId: string): Promise<Account> {
    const response = await api.post<Account>(`${this.baseUrl}/${accountId}/assign`, { agentId });
    return response;
  }

  async addNote(accountId: string, note: string): Promise<{message: string, accountId: string, note: string, userId: string, createdAt: string}> {
    const response = await api.post<{message: string, accountId: string, note: string, userId: string, createdAt: string}>(`${this.baseUrl}/${accountId}/add-note`, { note });
    return response;
  }

  async getCallHistory(accountId: string): Promise<any[]> {
    const response = await api.get<any[]>(`${this.baseUrl}/${accountId}/call-history`);
    return response;
  }

  // ================================
  // SEARCH & FILTER HELPERS
  // ================================
  async searchAccounts(query: string, filters?: Partial<AccountSearchParams>): Promise<PaginatedResponse<Account>> {
    return this.getAccounts({ 
      search: query,
      ...filters 
    });
  }

  async getAccountsByStatus(status: string, page = 1, limit = 10): Promise<PaginatedResponse<Account>> {
    return this.getAccounts({ 
      status: status as any,
      page, 
      limit 
    });
  }

  async getAccountsByAgent(agentId: string): Promise<PaginatedResponse<Account>> {
    const response = await this.getAccounts({ assignedTo: agentId });
    return response;
  }

  // ================================
  // VALIDATION HELPERS
  // ================================
  validateAccountData(data: CreateAccountRequest | UpdateAccountRequest): string[] {
    const errors: string[] = [];

    if ('firstName' in data && !data.firstName?.trim()) {
      errors.push('First name is required');
    }

    if ('lastName' in data && !data.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if ('accountNumber' in data && !data.accountNumber?.trim()) {
      errors.push('Account number is required');
    }

    if ('currentBalance' in data && (data.currentBalance === undefined || data.currentBalance < 0)) {
      errors.push('Balance must be a positive number');
    }

    return errors;
  }
}

// ================================
// SINGLETON INSTANCE
// ================================
export const accountService = new AccountService();
export default accountService;