import { apiClient } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // Legacy field, will be replaced by roles array
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  // RBAC fields
  roles?: Array<{
    id: string;
    name: string;
    description: string;
    isActive: boolean;
  }>;
  vicidialUserId?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds?: string[];
  role?: string;
  isActive?: boolean;
  vicidialUserId?: string;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  vicidialUserId?: string;
}

class UsersService {
  private baseUrl = '/users';

  async getUsers(skip = 0, take = 50): Promise<User[]> {
    return await apiClient.get<User[]>(`${this.baseUrl}?skip=${skip}&take=${take}`);
  }

  async getUserById(id: string): Promise<User> {
    return await apiClient.get<User>(`${this.baseUrl}/${id}`);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return await apiClient.post<User>(this.baseUrl, data);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    return await apiClient.patch<User>(`${this.baseUrl}/${id}`, data);
  }

  async deleteUser(id: string, force: boolean = false): Promise<void> {
    const url = force ? `${this.baseUrl}/${id}?force=true` : `${this.baseUrl}/${id}`;
    await apiClient.delete(url);
  }

  // RBAC User-Role Assignment Methods
  async getUserRoles(userId: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    isActive: boolean;
  }>> {
    return await apiClient.get<Array<{
      id: string;
      name: string;
      description: string;
      isActive: boolean;
    }>>(`${this.baseUrl}/${userId}/roles`);
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${userId}/roles/${roleId}`);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${userId}/roles/${roleId}`);
  }

  async updateUserRoles(userId: string, roleIds: string[]): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/${userId}/roles`, { roleIds });
  }

  async getUserPermissions(userId: string): Promise<Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    category: string;
    resource: string;
    action: string;
  }>> {
    return await apiClient.get<Array<{
      id: string;
      code: string;
      name: string;
      description: string;
      category: string;
      resource: string;
      action: string;
    }>>(`${this.baseUrl}/${userId}/permissions`);
  }
}

export const usersService = new UsersService();