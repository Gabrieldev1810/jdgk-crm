import { api } from './api';

// ================================
// DISPOSITION TYPES
// ================================

export interface Disposition {
  id: string;
  key: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: DispositionCategory;
  isActive: boolean;
  isDefault: boolean;
  requiresFollowUp?: boolean;
  isSuccessful?: boolean;
  color?: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DispositionCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive: boolean;
  dispositions?: Disposition[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDispositionRequest {
  key: string;
  name: string;
  description?: string;
  categoryId: string;
  isActive?: boolean;
  requiresFollowUp?: boolean;
  isSuccessful?: boolean;
  sortOrder?: number;
}

export interface UpdateDispositionRequest {
  name?: string;
  description?: string;
  categoryId?: string;
  isActive?: boolean;
  requiresFollowUp?: boolean;
  isSuccessful?: boolean;
  sortOrder?: number;
}

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
  // DISPOSITIONS CRUD
  // ================================

  /**
   * Get all dispositions with categories
   */
  async getDispositions(): Promise<Disposition[]> {
    try {
      const response = await api.get<Disposition[]>('/rbac/dispositions');
      return response;
    } catch (error) {
      console.error('Failed to fetch dispositions:', error);
      // Return mock data as fallback
      return this.getMockDispositions();
    }
  }

  /**
   * Get disposition categories
   */
  async getCategories(): Promise<DispositionCategory[]> {
    try {
      // For now, extract categories from dispositions
      const dispositions = await this.getDispositions();
      const categoryMap = new Map<string, DispositionCategory>();
      
      dispositions.forEach(disp => {
        if (disp.category && !categoryMap.has(disp.category.id)) {
          categoryMap.set(disp.category.id, disp.category);
        }
      });
      
      return Array.from(categoryMap.values());
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return this.getMockCategories();
    }
  }

  /**
   * Create new disposition
   */
  async createDisposition(data: CreateDispositionRequest): Promise<Disposition> {
    try {
      const response = await api.post<{ success: boolean; message: string; data: any }>('/rbac/dispositions', {
        code: data.key, // Backend expects 'code' field
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        requiresFollowUp: data.requiresFollowUp,
        isSuccessful: data.isSuccessful,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      });
      
      return this.transformDisposition(response.data);
    } catch (error) {
      console.error('Failed to create disposition:', error);
      throw error;
    }
  }

  /**
   * Update disposition
   */
  async updateDisposition(id: string, data: UpdateDispositionRequest): Promise<Disposition> {
    try {
      const response = await api.patch<{ success: boolean; message: string; data: any }>(`/rbac/dispositions/${id}`, data);
      return this.transformDisposition(response.data);
    } catch (error) {
      console.error('Failed to update disposition:', error);
      throw error;
    }
  }

  /**
   * Delete disposition
   */
  async deleteDisposition(id: string): Promise<void> {
    try {
      await api.delete(`/rbac/dispositions/${id}`);
    } catch (error) {
      console.error('Failed to delete disposition:', error);
      throw error;
    }
  }

  /**
   * Toggle disposition active status
   */
  async toggleDispositionStatus(id: string, isActive: boolean): Promise<Disposition> {
    try {
      const response = await api.patch<{ success: boolean; message: string; data: any }>(`/rbac/dispositions/${id}`, { isActive });
      return this.transformDisposition(response.data);
    } catch (error) {
      console.error('Failed to toggle disposition status:', error);
      throw error;
    }
  }

  // ================================
  // SEED & MANAGEMENT
  // ================================

  /**
   * Seed dispositions data
   */
  async seedDispositions(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string }>('/rbac/seed/dispositions');
      return response;
    } catch (error) {
      console.error('Failed to seed dispositions:', error);
      throw error;
    }
  }

  // ================================
  // EXPORT FUNCTIONALITY
  // ================================

  /**
   * Export dispositions to CSV format
   */
  async exportToCSV(): Promise<void> {
    try {
      const dispositions = await this.getDispositions();
      const csvContent = this.generateCSV(dispositions);
      this.downloadFile(csvContent, 'call-dispositions.csv', 'text/csv');
    } catch (error) {
      console.error('Failed to export dispositions to CSV:', error);
      throw error;
    }
  }

  /**
   * Export dispositions to JSON format
   */
  async exportToJSON(): Promise<void> {
    try {
      const dispositions = await this.getDispositions();
      const jsonContent = JSON.stringify(dispositions, null, 2);
      this.downloadFile(jsonContent, 'call-dispositions.json', 'application/json');
    } catch (error) {
      console.error('Failed to export dispositions to JSON:', error);
      throw error;
    }
  }

  /**
   * Export dispositions summary report
   */
  async exportSummaryReport(): Promise<void> {
    try {
      const [dispositions, categories, stats] = await Promise.all([
        this.getDispositions(),
        this.getCategories(), 
        this.getDispositionStats()
      ]);

      const reportContent = this.generateSummaryReport(dispositions, categories, stats);
      this.downloadFile(reportContent, 'dispositions-summary-report.txt', 'text/plain');
    } catch (error) {
      console.error('Failed to export summary report:', error);
      throw error;
    }
  }

  /**
   * Generate CSV content from dispositions data
   */
  private generateCSV(dispositions: Disposition[]): string {
    const headers = [
      'ID',
      'Code', 
      'Name',
      'Description',
      'Category',
      'Category ID',
      'Is Active',
      'Is Default', 
      'Requires Follow-up',
      'Is Successful',
      'Sort Order',
      'Created At',
      'Updated At'
    ];

    const rows = dispositions.map(disp => [
      disp.id,
      disp.key,
      disp.name,
      disp.description || '',
      disp.category?.name || '',
      disp.categoryId,
      disp.isActive ? 'Yes' : 'No',
      disp.isDefault ? 'Yes' : 'No',
      disp.requiresFollowUp ? 'Yes' : 'No', 
      disp.isSuccessful ? 'Yes' : 'No',
      disp.sortOrder || 0,
      disp.createdAt,
      disp.updatedAt
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.map(field => 
        // Escape fields that contain commas, quotes, or newlines
        typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
          ? `"${field.replace(/"/g, '""')}"` 
          : field
      ).join(','))
    ];

    return csvLines.join('\n');
  }

  /**
   * Generate summary report content
   */
  private generateSummaryReport(
    dispositions: Disposition[], 
    categories: DispositionCategory[], 
    stats: DispositionStats
  ): string {
    const report = [];
    const timestamp = new Date().toLocaleString();

    report.push('='.repeat(60));
    report.push('CALL DISPOSITIONS SUMMARY REPORT');
    report.push('='.repeat(60));
    report.push(`Generated: ${timestamp}`);
    report.push('');

    // Overall Statistics
    report.push('OVERVIEW STATISTICS');
    report.push('-'.repeat(30));
    report.push(`Total Dispositions: ${stats.totalDispositions}`);
    report.push(`Active Dispositions: ${stats.activeDispositions}`);
    report.push(`Inactive Dispositions: ${stats.totalDispositions - stats.activeDispositions}`);
    report.push(`Total Categories: ${stats.categoriesCount}`);
    report.push('');

    // Categories Breakdown
    report.push('CATEGORIES BREAKDOWN');
    report.push('-'.repeat(30));
    categories.forEach(category => {
      const categoryDispositions = dispositions.filter(d => d.categoryId === category.id);
      const activeCount = categoryDispositions.filter(d => d.isActive).length;
      
      report.push(`${category.name}:`);
      report.push(`  Total: ${categoryDispositions.length}`);
      report.push(`  Active: ${activeCount}`);
      report.push(`  Inactive: ${categoryDispositions.length - activeCount}`);
      report.push('');
    });

    // Detailed Dispositions List
    report.push('DETAILED DISPOSITIONS LIST');
    report.push('-'.repeat(30));
    
    categories.forEach(category => {
      const categoryDispositions = dispositions.filter(d => d.categoryId === category.id);
      if (categoryDispositions.length === 0) return;

      report.push(`\n[${category.name.toUpperCase()}]`);
      categoryDispositions
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .forEach(disp => {
          const flags = [];
          if (!disp.isActive) flags.push('INACTIVE');
          if (disp.isDefault) flags.push('DEFAULT');
          if (disp.requiresFollowUp) flags.push('FOLLOW-UP');
          if (disp.isSuccessful) flags.push('SUCCESS');
          
          const flagsStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
          report.push(`  ${disp.key}: ${disp.name}${flagsStr}`);
          if (disp.description) {
            report.push(`    Description: ${disp.description}`);
          }
        });
    });

    report.push('');
    report.push('='.repeat(60));
    report.push('End of Report');
    report.push('='.repeat(60));

    return report.join('\n');
  }

  /**
   * Download file to user's computer
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    URL.revokeObjectURL(url);
  }

  // ================================
  // STATISTICS
  // ================================

  /**
   * Get disposition statistics
   */
  async getDispositionStats(): Promise<DispositionStats> {
    try {
      const dispositions = await this.getDispositions();
      const categories = await this.getCategories();
      
      return {
        totalDispositions: dispositions.length,
        activeDispositions: dispositions.filter(d => d.isActive).length,
        categoriesCount: categories.length,
        usageStats: [] // TODO: Implement when call statistics are available
      };
    } catch (error) {
      console.error('Failed to fetch disposition stats:', error);
      return {
        totalDispositions: 0,
        activeDispositions: 0,
        categoriesCount: 0,
        usageStats: []
      };
    }
  }

  // ================================
  // HELPER METHODS
  // ================================

  /**
   * Get disposition display name
   */
  getDispositionDisplay(key: string, dispositions?: Disposition[]): string {
    if (!dispositions) return key;
    
    const disposition = dispositions.find(d => d.key === key);
    return disposition ? disposition.name : key;
  }

  /**
   * Get disposition color by category
   */
  getDispositionColor(disposition: Disposition): string {
    if (disposition.color) return disposition.color;
    
    // Default colors by category
    const categoryColors = {
      'Successful': 'success',
      'No Contact': 'warning', 
      'Unsuccessful': 'destructive',
      'System': 'muted'
    };
    
    return categoryColors[disposition.category?.name || ''] || 'muted';
  }

  /**
   * Transform backend disposition to frontend format
   */
  transformDisposition(backendDisp: any): Disposition {
    return {
      id: backendDisp.id,
      key: backendDisp.key || backendDisp.code,
      name: backendDisp.name,
      description: backendDisp.description,
      categoryId: backendDisp.categoryId,
      category: backendDisp.category,
      isActive: backendDisp.isActive ?? true,
      isDefault: backendDisp.isDefault ?? false,
      requiresFollowUp: backendDisp.requiresFollowUp,
      isSuccessful: backendDisp.isSuccessful,
      color: this.mapCategoryToColor(backendDisp.category?.name),
      sortOrder: backendDisp.sortOrder,
      createdAt: backendDisp.createdAt,
      updatedAt: backendDisp.updatedAt,
    };
  }

  /**
   * Map category name to UI color
   */
  private mapCategoryToColor(categoryName?: string): string {
    const colorMap = {
      'Successful': 'success',
      'No Contact': 'warning',
      'Unsuccessful': 'destructive', 
      'System': 'muted'
    };
    return colorMap[categoryName || ''] || 'accent';
  }

  // ================================
  // MOCK DATA FALLBACKS
  // ================================

  private getMockDispositions(): Disposition[] {
    return [
      {
        id: '1',
        key: 'CONTACT_MADE',
        name: 'Contact Made',
        description: 'Successfully connected with customer',
        categoryId: '1',
        category: { id: '1', name: 'Successful', description: 'Successful outcomes', color: 'success', sortOrder: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        isActive: true,
        isDefault: true,
        isSuccessful: true,
        color: 'success',
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        key: 'NO_ANSWER',
        name: 'No Answer',
        description: 'Phone rang but no answer',
        categoryId: '2',
        category: { id: '2', name: 'No Contact', description: 'Unable to reach', color: 'warning', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        isActive: true,
        isDefault: true,
        color: 'warning',
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        key: 'BUSY',
        name: 'Busy',
        description: 'Line was busy',
        categoryId: '2',
        category: { id: '2', name: 'No Contact', description: 'Unable to reach', color: 'warning', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        isActive: true,
        isDefault: true,
        color: 'warning',
        sortOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        key: 'PROMISE_TO_PAY',
        name: 'Promise to Pay',
        description: 'Customer promised payment',
        categoryId: '1',
        category: { id: '1', name: 'Successful', description: 'Successful outcomes', color: 'success', sortOrder: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        isActive: true,
        isDefault: true,
        isSuccessful: true,
        requiresFollowUp: true,
        color: 'success',
        sortOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        key: 'REFUSED_TO_PAY',
        name: 'Refused to Pay',
        description: 'Customer refused payment',
        categoryId: '3',
        category: { id: '3', name: 'Unsuccessful', description: 'Unsuccessful contact', color: 'destructive', sortOrder: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        isActive: true,
        isDefault: true,
        color: 'destructive',
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  }

  private getMockCategories(): DispositionCategory[] {
    return [
      {
        id: '1',
        name: 'Successful',
        description: 'Successful contact outcomes',
        color: 'success',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'No Contact',
        description: 'Unable to reach customer',
        color: 'warning',
        sortOrder: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Unsuccessful',
        description: 'Contact made but unsuccessful',
        color: 'destructive',
        sortOrder: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  }
}

// ================================
// SINGLETON INSTANCE
// ================================
export const dispositionsService = new DispositionsService();

// ================================
// CONVENIENCE EXPORTS
// ================================
export const dispositions = {
  getAll: () => dispositionsService.getDispositions(),
  getCategories: () => dispositionsService.getCategories(),
  create: (data: CreateDispositionRequest) => dispositionsService.createDisposition(data),
  update: (id: string, data: UpdateDispositionRequest) => dispositionsService.updateDisposition(id, data),
  delete: (id: string) => dispositionsService.deleteDisposition(id),
  toggleStatus: (id: string, isActive: boolean) => dispositionsService.toggleDispositionStatus(id, isActive),
  seed: () => dispositionsService.seedDispositions(),
  getStats: () => dispositionsService.getDispositionStats(),
};