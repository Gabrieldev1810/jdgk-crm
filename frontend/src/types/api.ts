// TypeScript interfaces for API responses and data models

// ================================
// AUTHENTICATION TYPES
// ================================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// ================================
// USER MANAGEMENT TYPES
// ================================
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  department?: string;
  location?: string;
  phoneNumber?: string;
  employeeId?: string;
  avatar?: string;
  vicidialUserId?: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'AGENT';

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

// ================================
// ACCOUNT MANAGEMENT TYPES
// ================================
export interface AccountPhone {
  id: string;
  phoneNumber: string;
  phoneType: string;
  isValid: boolean;
}

export interface Account {
  id: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  originalAmount: number;
  currentBalance: number;
  amountPaid: number;
  interestRate?: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  status: AccountStatus;
  secondaryStatus?: string;
  priority: AccountPriority;
  assignedAgentId?: string;
  assignedAgent?: User;
  assignedDate?: string;
  preferredContactMethod?: string;
  bestTimeToCall?: string;
  timezone?: string;
  language?: string;
  daysPastDue: number;
  lastContactDate?: string;
  nextContactDate?: string;
  contactAttempts: number;
  doNotCall: boolean;
  disputeFlag: boolean;
  bankruptcyFlag: boolean;
  deceasedFlag: boolean;
  notes?: string;
  source?: string;
  batchId?: string;
  createdAt: string;
  updatedAt: string;
  phoneNumbers?: AccountPhone[];
}

export type AccountStatus = 'NEW' | 'ACTIVE' | 'PTP' | 'PAID' | 'SKIP' | 'DELETED';
export type AccountPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CreateAccountPhoneRequest {
  phoneNumber: string;
  phoneType?: string;
  isValid?: boolean;
}

export interface CreateAccountRequest {
  accountNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  originalAmount: number;
  currentBalance: number;
  assignedAgentId?: string;
  priority?: AccountPriority;
  preferredContactMethod?: string;
  notes?: string;
  phoneNumbers?: CreateAccountPhoneRequest[];
}

export interface UpdateAccountRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  currentBalance?: number;
  status?: AccountStatus;
  priority?: AccountPriority;
  assignedAgentId?: string;
  notes?: string;
}

export interface AccountSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AccountStatus;
  agentId?: string;
  assignedTo?: string; // Deprecated, use agentId
  campaignId?: string;
  minBalance?: number;
  maxBalance?: number;
  sortBy?: 'firstName' | 'lastName' | 'currentBalance' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  phoneNumbers?: string[];
}

export interface AccountStatistics {
  totalAccounts: number;
  totalCollections: number;
  totalBalance: number;
  teamQuota?: number;
  accountsByStatus: {
    active: number;
    new: number;
    ptp: number;
    paid: number;
    touched?: number;
    [key: string]: number | undefined;
  };
  financialMetrics?: {
    totalBalance: number;
    averageBalance: number;
  };
}

// ================================
// CALL MANAGEMENT TYPES
// ================================
export enum CallDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export enum CallStatus {
  RINGING = 'RINGING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  BUSY = 'BUSY',
  NO_ANSWER = 'NO_ANSWER',
  CANCELLED = 'CANCELLED'
}

export enum CallDisposition {
  CONTACT_MADE = 'CONTACT_MADE',
  LEFT_MESSAGE = 'LEFT_MESSAGE',
  NO_ANSWER = 'NO_ANSWER',
  BUSY = 'BUSY',
  WRONG_NUMBER = 'WRONG_NUMBER',
  DISCONNECTED = 'DISCONNECTED',
  PROMISE_TO_PAY = 'PROMISE_TO_PAY',
  PAYMENT_MADE = 'PAYMENT_MADE',
  CALLBACK_REQUESTED = 'CALLBACK_REQUESTED',
  DO_NOT_CALL = 'DO_NOT_CALL',
  DISPUTE = 'DISPUTE'
}

export interface Call {
  id: string;
  accountId: string;
  accountPhoneId?: string;
  agentId: string;
  direction: CallDirection;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: CallStatus;
  disposition?: CallDisposition;
  notes?: string;
  followUpDate?: string;
  amountPromised?: number;
  amountCollected?: number;
  recordingPath?: string;
  callerId?: string;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
  agent?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  account?: {
    id: string;
    accountNumber: string;
    fullName: string;
  };
  accountPhone?: {
    id: string;
    phoneNumber: string;
    phoneType: string;
  };
}

export interface CreateCallRequest {
  accountId: string;
  accountPhoneId?: string;
  agentId: string;
  direction: CallDirection;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: CallStatus;
  disposition?: CallDisposition;
  notes?: string;
  followUpDate?: string;
  amountPromised?: number;
  amountCollected?: number;
  recordingPath?: string;
  callerId?: string;
  campaignId?: string;
}

export interface UpdateCallRequest {
  accountPhoneId?: string;
  direction?: CallDirection;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status?: CallStatus;
  disposition?: CallDisposition;
  notes?: string;
  followUpDate?: string;
  amountPromised?: number;
  amountCollected?: number;
  recordingPath?: string;
  callerId?: string;
  campaignId?: string;
}

export interface CallSearchParams {
  page?: number;
  limit?: number;
  accountId?: string;
  agentId?: string;
  direction?: CallDirection;
  status?: CallStatus;
  disposition?: CallDisposition;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CallStatistics {
  totalCalls: number;
  completedCalls: number;
  avgDuration: number;
  successRate: number;
  dispositionBreakdown: Record<string, number>;
}

// ================================
// RBAC TYPES
// ================================
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
  isActive: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: string[];
  isActive?: boolean;
}

// ================================
// API RESPONSE WRAPPERS
// ================================
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// ================================
// AUDIT LOG TYPES
// ================================
export interface AuditLog {
  id: string;
  actorId: string;
  actor?: User;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ================================
// DASHBOARD & METRICS TYPES
// ================================
export interface DashboardMetrics {
  totalAccounts: number;
  activeAccounts: number;
  collectedAmount: number;
  totalCallsToday: number;
  averageCallDuration: number;
  conversionRate: number;
  agentPerformance: AgentPerformance[];
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  callsCompleted: number;
  averageCallDuration: number;
  successfulContacts: number;
  paymentsCollected: number;
  conversionRate: number;
}

// ================================
// BULK UPLOAD TYPES
// ================================
export interface BulkUploadRequest {
  file: File;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  campaignId?: string;
}

export interface BulkUploadResponse {
  success: boolean;
  message?: string;
  data?: BulkUploadResult;
  error?: string;
  errors?: BulkUploadError[];
}

export interface BulkUploadResult {
  batchId: string;
  status: 'processing' | 'completed' | 'failed';
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  duplicates: number;
  message: string;
  errors?: BulkUploadError[];
}

export interface BulkUploadError {
  row: number;
  field: string;
  value: any;
  error: string;
}

