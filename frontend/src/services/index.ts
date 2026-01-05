// Service layer exports for the Dial-Craft CRM frontend

export { api, apiClient } from './api';
export { auth, authService } from './auth';
export { accountService } from './accounts';
export { callsService } from './calls';
export { rbacService } from './rbac';
export { usersService } from './users';
export { vicidialService } from './vicidial';
export { settingsService } from './settings';

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