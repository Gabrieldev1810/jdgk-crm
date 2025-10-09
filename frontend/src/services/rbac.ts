import { apiClient } from './api';
import type { ApiResponse } from '../types/api';

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isSystemRole: boolean;
  userCount?: number;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissions?: string[];
}

export interface CreatePermissionRequest {
  code: string;
  name: string;
  category: string;
  resource: string;
  action: string;
  description?: string;
}

class RbacService {
  private readonly baseUrl = '/rbac';

  // ===== ROLES =====
  async getRoles(): Promise<Role[]> {
    return await apiClient.get<Role[]>(`${this.baseUrl}/roles`);
  }

  async createRole(data: CreateRoleRequest): Promise<Role> {
    return await apiClient.post<Role>(`${this.baseUrl}/roles`, data);
  }

  async updateRole(id: string, data: UpdateRoleRequest): Promise<Role> {
    return await apiClient.put<Role>(`${this.baseUrl}/roles/${id}`, data);
  }

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/roles/${id}`);
  }

  // ===== PERMISSIONS =====
  async getPermissions(): Promise<Permission[]> {
    return await apiClient.get<Permission[]>(`${this.baseUrl}/permissions`);
  }

  async createPermission(data: CreatePermissionRequest): Promise<Permission> {
    return await apiClient.post<Permission>(`${this.baseUrl}/permissions`, data);
  }

  // ===== SEEDING =====
  async seedRoles(): Promise<{ message: string; roles: number; permissions: number }> {
    return await apiClient.post<{ message: string; roles: number; permissions: number }>(`${this.baseUrl}/seed/roles`);
  }

  async seedDispositions(): Promise<{ message: string; categories: number; dispositions: number }> {
    return await apiClient.post<{ message: string; categories: number; dispositions: number }>(`${this.baseUrl}/seed/dispositions`);
  }

  async seedAll(): Promise<{
    message: string;
    roles: { roles: number; permissions: number };
    dispositions: { categories: number; dispositions: number };
  }> {
    return await apiClient.post<any>(`${this.baseUrl}/seed/all`);
  }

  // ===== AUDIT LOGS =====
  async getAuditLogs(): Promise<any[]> {
    return await apiClient.get<any[]>(`${this.baseUrl}/audit-logs`);
  }

  // ===== DISPOSITIONS =====
  async getDispositions(): Promise<any[]> {
    return await apiClient.get<any[]>(`${this.baseUrl}/dispositions`);
  }
}

export const rbacService = new RbacService();