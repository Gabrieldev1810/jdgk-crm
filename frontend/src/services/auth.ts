import { api } from './api';
import { config } from '../config/environment';
import type { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse, 
  User 
} from '../types/api';

// ================================
// AUTHENTICATION SERVICE
// ================================
class AuthService {
  private currentUser: User | null = null;
  private authCallbacks: Array<(user: User | null) => void> = [];

  constructor() {
    this.initializeAuth();
  }

  // ================================
  // INITIALIZATION
  // ================================
  private initializeAuth() {
    const storedUser = localStorage.getItem(config.auth.userKey);
    const token = localStorage.getItem(config.auth.tokenKey);
    
    if (storedUser && token) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.notifyAuthChange();
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        this.clearAuth();
      }
    }
  }

  // ================================
  // AUTHENTICATION METHODS
  // ================================
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Backend returns { user, accessToken } format directly (not wrapped in ApiResponse)
      interface BackendLoginResponse {
        user: User;
        accessToken: string;
      }
      
      const response = await api.post<BackendLoginResponse>('/auth/login', credentials);
      
      // The backend returns data directly
      if (response && response.user && response.accessToken) {
        const { user, accessToken } = response;
        
        // Store authentication data
        localStorage.setItem(config.auth.tokenKey, accessToken);
        localStorage.setItem(config.auth.userKey, JSON.stringify(user));
        
        // Update current user
        this.currentUser = user;
        this.notifyAuthChange();
        
        // Return in expected format for consistency
        return {
          user,
          access_token: accessToken,
          refresh_token: '', // Backend uses httpOnly cookie for refresh token
          expires_in: 3600 // 1 hour default
        };
      } else {
        throw new Error('Invalid login response format');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint if we have a token
      const token = localStorage.getItem(config.auth.tokenKey);
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      // Don't throw error if logout API fails - still clear local auth
      console.warn('Logout API call failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await api.post('/auth/logout-all');
    } catch (error) {
      console.warn('Logout all API call failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  async refreshToken(): Promise<string> {
    try {
      // Backend expects refresh token from httpOnly cookie, no body needed
      interface BackendRefreshResponse {
        accessToken: string;
      }
      
      const response = await api.post<BackendRefreshResponse>('/auth/refresh');

      if (response && response.accessToken) {
        const { accessToken } = response;
        
        // Store new access token
        localStorage.setItem(config.auth.tokenKey, accessToken);
        
        return accessToken;
      } else {
        throw new Error('Invalid refresh token response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    const token = localStorage.getItem(config.auth.tokenKey);
    if (!token) {
      return null;
    }

    try {
      const response = await api.get<User>('/auth/me');
      
      if (response) {
        this.currentUser = response;
        localStorage.setItem(config.auth.userKey, JSON.stringify(response));
        this.notifyAuthChange();
        return response;
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      this.clearAuth();
    }

    return null;
  }

  // ================================
  // STATE MANAGEMENT
  // ================================
  private clearAuth() {
    localStorage.removeItem(config.auth.tokenKey);
    localStorage.removeItem(config.auth.userKey);
    // Note: refresh token is handled via httpOnly cookie by backend
    this.currentUser = null;
    this.notifyAuthChange();
  }

  private notifyAuthChange() {
    this.authCallbacks.forEach(callback => {
      try {
        callback(this.currentUser);
      } catch (error) {
        console.error('Auth callback error:', error);
      }
    });
  }

  // ================================
  // UTILITY METHODS
  // ================================
  isAuthenticated(): boolean {
    return !!localStorage.getItem(config.auth.tokenKey) && !!this.currentUser;
  }

  getUser(): User | null {
    return this.currentUser;
  }

  getUserRole(): string | null {
    return this.currentUser?.role || null;
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return !!this.currentUser?.role && roles.includes(this.currentUser.role);
  }

  isAdmin(): boolean {
    return this.hasAnyRole(['super_admin', 'admin']);
  }

  isSuperAdmin(): boolean {
    return this.hasRole('super_admin');
  }

  isManager(): boolean {
    return this.hasRole('manager');
  }

  isAgent(): boolean {
    return this.hasRole('agent');
  }

  getToken(): string | null {
    return localStorage.getItem(config.auth.tokenKey);
  }

  // ================================
  // EVENT SUBSCRIPTION
  // ================================
  onAuthChange(callback: (user: User | null) => void): () => void {
    this.authCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authCallbacks.indexOf(callback);
      if (index > -1) {
        this.authCallbacks.splice(index, 1);
      }
    };
  }

  // ================================
  // TOKEN VALIDATION
  // ================================
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Simple token expiration check (for JWT tokens)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch (error) {
      console.error('Failed to parse token:', error);
      return true;
    }
  }

  async ensureAuthenticated(): Promise<User> {
    if (!this.isAuthenticated() || this.isTokenExpired()) {
      throw new Error('User not authenticated');
    }

    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('Failed to get current user');
    }

    return user;
  }
}

// ================================
// SINGLETON INSTANCE
// ================================
export const authService = new AuthService();

// ================================
// CONVENIENCE METHODS
// ================================
export const auth = {
  login: (credentials: LoginRequest) => authService.login(credentials),
  logout: () => authService.logout(),
  logoutAll: () => authService.logoutAll(),
  getCurrentUser: () => authService.getCurrentUser(),
  isAuthenticated: () => authService.isAuthenticated(),
  getUser: () => authService.getUser(),
  getUserRole: () => authService.getUserRole(),
  hasRole: (role: string) => authService.hasRole(role),
  hasAnyRole: (roles: string[]) => authService.hasAnyRole(roles),
  isAdmin: () => authService.isAdmin(),
  isSuperAdmin: () => authService.isSuperAdmin(),
  isManager: () => authService.isManager(),
  isAgent: () => authService.isAgent(),
  onAuthChange: (callback: (user: User | null) => void) => authService.onAuthChange(callback),
  ensureAuthenticated: () => authService.ensureAuthenticated(),
};

export default authService;