// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000',
  TIMEOUT: 10000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'RideShare',
  VERSION: '1.0.0',
  ENVIRONMENT: __DEV__ ? 'development' : 'production',
} as const;