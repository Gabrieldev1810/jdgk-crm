// Service layer exports for the Dial-Craft CRM frontend

export { api, apiClient } from './api';
export { auth, authService } from './auth';
export { accountService } from './accounts';

// Re-export types for convenience
export type {
  LoginRequest,
  LoginResponse,
  User,
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountSearchParams,
  ApiResponse,
  PaginatedResponse,
  ApiError,
} from '../types/api';

export { config, env, getApiUrl } from '../config/environment';