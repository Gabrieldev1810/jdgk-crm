// Debug API configuration
console.log('=== API Configuration Debug ===');
console.log('NODE_ENV:', import.meta.env.MODE);
console.log('DEV mode:', import.meta.env.DEV);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

import { config, getApiUrl } from './src/config/environment.js';

console.log('Config baseUrl:', config.api.baseUrl);
console.log('Config prefix:', config.api.prefix);
console.log('getApiUrl():', getApiUrl());
console.log('getApiUrl("/users"):', getApiUrl('/users'));

// Test axios instance
import { apiClient } from './src/services/api.js';
console.log('Axios baseURL:', apiClient.defaults?.baseURL);