import { api } from './api';

// ================================
// DISPOSITION TYPES
// ================================

export interface DispositionCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive: boolean;
  dispositions?: Disposition[];
  createdAt: string;
  updatedAt: string;
}

export interface Disposition {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: DispositionCategory;
  requiresFollowUp: boolean;
  requiresPayment: boolean;
  requiresNotes: boolean;
  isSuccessful: boolean;
  newAccountStatus?: string;
  followUpDelay?: number;
  sortOrder: number;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

export interface CreateDispositionRequest {
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  requiresFollowUp?: boolean;
  requiresPayment?: boolean;
  requiresNotes?: boolean;
  isSuccessful?: boolean;
  newAccountStatus?: string;
  followUpDelay?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateDispositionRequest extends Partial<CreateDispositionRequest> {}

export interface DispositionStats {
  totalDispositions: number;
  activeDispositions: number;
  categoriesCount: number;
  usageStats: {
    dispositionId: string;
    count: number;
  }[];
}

// ================================
// DISPOSITIONS SERVICE
// ================================

class DispositionsService {
  
  // ================================
  // CATEGORIES CRUD
  // ================================

  async getCategories(includeDispositions = true): Promise<DispositionCategory[]> {
    try {
      const response = await api.get<DispositionCategory[]>('/dispositions/categories', {
        includeDispositions
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  }

  async createCategory(data: CreateCategoryRequest): Promise<DispositionCategory> {
    const response = await api.post<DispositionCategory>('/dispositions/categories', data);
    return response;
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<DispositionCategory> {
    const response = await api.patch<DispositionCategory>('/dispositions/categories/' + id, data);
    return response;
  }

  async deleteCategory(id: string): Promise<void> {
    await api.delete('/dispositions/categories/' + id);
  }

  // ================================
  // DISPOSITIONS CRUD
  // ================================

  async getDispositions(activeOnly = false): Promise<Disposition[]> {
    try {
      const response = await api.get<Disposition[]>('/dispositions', { activeOnly });
      return response;
    } catch (error) {
      console.error('Failed to fetch dispositions:', error);
      throw error;
    }
  }

  async getDisposition(id: string): Promise<Disposition> {
    const response = await api.get<Disposition>('/dispositions/' + id);
    return response;
  }

  async createDisposition(data: CreateDispositionRequest): Promise<Disposition> {
    const response = await api.post<Disposition>('/dispositions', data);
    return response;
  }

  async updateDisposition(id: string, data: UpdateDispositionRequest): Promise<Disposition> {
    const response = await api.patch<Disposition>('/dispositions/' + id, data);
    return response;
  }

  async deleteDisposition(id: string): Promise<void> {
    await api.delete('/dispositions/' + id);
  }

  async syncVicidialStatuses(): Promise<{ count: number }> {
    const response = await api.post<{ count: number }>('/dispositions/sync/vicidial');
    return response;
  }

  // ================================
  // STATS (Mocked for now until backend endpoint exists)
  // ================================
  async getDispositionStats(): Promise<DispositionStats> {
    // TODO: Implement backend endpoint for stats
    const dispositions = await this.getDispositions();
    const categories = await this.getCategories(false);
    
    return {
      totalDispositions: dispositions.length,
      activeDispositions: dispositions.filter(d => d.isActive).length,
      categoriesCount: categories.length,
      usageStats: dispositions.map(d => ({
        dispositionId: d.id,
        count: d.usageCount || 0
      }))
    };
  }
}

export const dispositionsService = new DispositionsService();
