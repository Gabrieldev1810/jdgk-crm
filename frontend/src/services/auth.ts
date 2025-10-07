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
      console.log('🔍 Attempting login with credentials:', { email: credentials.email });
      
      // Try debug endpoint first to bypass cookie issues
      interface BackendLoginResponse {
        success: boolean;
        user: User;
        accessToken: string;
        refreshToken?: string;
        message: string;
      }
      
      let response: BackendLoginResponse;
      
      try {
        console.log('🧪 Trying debug login endpoint...');
        response = await api.post<BackendLoginResponse>('/auth/login-debug', credentials);
      } catch (debugError) {
        console.log('⚠️ Debug login failed, falling back to regular login:', debugError);
        // Fallback to regular login
        interface RegularLoginResponse {
          user: User;
          accessToken: string;
        }
        
        const regularResponse = await api.post<RegularLoginResponse>('/auth/login', credentials);
        response = {
          success: true,
          user: regularResponse.user,
          accessToken: regularResponse.accessToken,
          message: 'Login successful (regular endpoint)'
        };
      }
      
      console.log('✅ Login response received:', { 
        success: response.success, 
        hasUser: !!response.user, 
        hasToken: !!response.accessToken 
      });
      
      // The backend returns data directly
      if (response && response.user && response.accessToken) {
        const { user, accessToken, refreshToken } = response;
        
        // Store authentication data
        localStorage.setItem(config.auth.tokenKey, accessToken);
        localStorage.setItem(config.auth.userKey, JSON.stringify(user));
        
        // Store refresh token if provided (for debug mode)
        if (refreshToken) {
          localStorage.setItem('refresh_token_debug', refreshToken);
        }
        
        // Update current user
        this.currentUser = user;
        this.notifyAuthChange();
        
        console.log('✅ Login successful, user authenticated:', user.email);
        
        // Return in expected format for consistency
        return {
          user,
          access_token: accessToken,
          refresh_token: refreshToken || '', // Backend uses httpOnly cookie for refresh token
          expires_in: 3600 // 1 hour default
        };
      } else {
        console.log('❌ Invalid login response format:', response);
        throw new Error('Invalid login response format');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
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
      console.log('🔄 Attempting token refresh...');
      
      // Check if we have a debug refresh token
      const debugRefreshToken = localStorage.getItem('refresh_token_debug');
      
      if (debugRefreshToken) {
        console.log('🧪 Using debug refresh token method');
        // For debug mode, we can't use the refresh token easily, so just return current token
        const currentToken = localStorage.getItem(config.auth.tokenKey);
        if (currentToken) {
          console.log('⚠️ Debug mode: returning current token instead of refreshing');
          return currentToken;
        }
      }
      
      // Backend expects refresh token from httpOnly cookie, no body needed
      interface BackendRefreshResponse {
        accessToken: string;
      }
      
      const response = await api.post<BackendRefreshResponse>('/auth/refresh');

      if (response && response.accessToken) {
        const { accessToken } = response;
        
        // Store new access token
        localStorage.setItem(config.auth.tokenKey, accessToken);
        
        console.log('✅ Token refreshed successfully');
        return accessToken;
      } else {
        throw new Error('Invalid refresh token response');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // In debug mode, don't clear auth immediately
      const debugRefreshToken = localStorage.getItem('refresh_token_debug');
      if (debugRefreshToken) {
        console.log('⚠️ Debug mode: keeping auth despite refresh failure');
        const currentToken = localStorage.getItem(config.auth.tokenKey);
        if (currentToken) {
          return currentToken;
        }
      }
      
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
    localStorage.removeItem('refresh_token_debug'); // Clear debug refresh token
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