import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { config, getApiUrl } from '../config/environment';
import type { ApiResponse, ApiError } from '../types/api';

// ================================
// HTTP CLIENT CONFIGURATION
// ================================
class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: getApiUrl(),
      timeout: config.api.timeout,
      withCredentials: true, // Include cookies for httpOnly refresh tokens
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor - Add auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor - Handle auth and errors
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 Unauthorized - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.instance(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.instance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.clearAuth();
            // Redirect to login
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(config.auth.tokenKey);
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private async refreshToken(): Promise<string> {
    // Refresh token is handled via httpOnly cookie by backend
    try {
      const response = await axios.post(getApiUrl('/auth/refresh'), {}, {
        withCredentials: true // Include httpOnly cookies
      });

      const { accessToken } = response.data;
      
      // Store new access token
      localStorage.setItem(config.auth.tokenKey, accessToken);

      return accessToken;
    } catch (error) {
      // If refresh fails, clear stored data and throw error
      this.clearAuth();
      throw new Error('Unable to refresh token');
    }
  }

  private clearAuth() {
    localStorage.removeItem(config.auth.tokenKey);
    localStorage.removeItem(config.auth.userKey);
  }

  private formatError(error: AxiosError): ApiError {
    if (error.response?.data) {
      return error.response.data as ApiError;
    }

    return {
      success: false,
      error: {
        code: error.code || 'NETWORK_ERROR',
        message: error.message || 'Network error occurred',
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  // ================================
  // HTTP METHODS
  // ================================
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.instance.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.instance.put(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.instance.patch(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.instance.delete(url);
    return response.data;
  }

  // ================================
  // FILE UPLOAD METHODS
  // ================================
  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // ================================
  // UTILITY METHODS
  // ================================
  setAuthToken(token: string) {
    localStorage.setItem(config.auth.tokenKey, token);
  }

  getAuthToken(): string | null {
    return this.getStoredToken();
  }

  clearAuthToken() {
    this.clearAuth();
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }
}

// ================================
// SINGLETON INSTANCE
// ================================
export const apiClient = new ApiClient();

// ================================
// CONVENIENCE METHODS
// ================================
export const api = {
  get: <T>(url: string, params?: any) => apiClient.get<T>(url, params),
  post: <T>(url: string, data?: any) => apiClient.post<T>(url, data),
  put: <T>(url: string, data?: any) => apiClient.put<T>(url, data),
  patch: <T>(url: string, data?: any) => apiClient.patch<T>(url, data),
  delete: <T>(url: string) => apiClient.delete<T>(url),
  upload: <T>(url: string, file: File, onProgress?: (progress: number) => void) => 
    apiClient.uploadFile<T>(url, file, onProgress),
};

export default apiClient;