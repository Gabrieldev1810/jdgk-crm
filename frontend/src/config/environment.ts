// Environment configuration for the Dial-Craft CRM
export const config = {
  // API Configuration
  api: {
    // Use proxy during development, direct URL in production
    baseUrl: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000'),
    prefix: '/api',
    timeout: 30000, // 30 seconds
  },
  
  // Authentication Configuration
  auth: {
    tokenKey: 'dial_craft_token',
    userKey: 'dial_craft_user',
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  
  // Application Configuration
  app: {
    name: 'Dial-Craft CRM',
    version: '1.0.0',
    environment: import.meta.env.MODE || 'development',
  },
  
  // Feature Flags
  features: {
    enableRealTimeUpdates: true,
    enableAuditLogs: true,
    enableBulkOperations: true,
    enableAdvancedReporting: true,
  },
  
  // UI Configuration
  ui: {
    itemsPerPage: 25,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['.csv', '.xlsx', '.xls'],
    theme: 'light',
  },
} as const;

// Type-safe environment variables
export const env = {
  NODE_ENV: import.meta.env.MODE,
  API_URL: import.meta.env.VITE_API_URL,
  WS_URL: import.meta.env.VITE_WS_URL,
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
} as const;

// Helper functions
export const isDevelopment = () => config.app.environment === 'development';
export const isProduction = () => config.app.environment === 'production';
export const getApiUrl = (endpoint?: string) => 
  `${config.api.baseUrl}${config.api.prefix}${endpoint || ''}`;