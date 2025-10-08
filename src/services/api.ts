import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// API Configuration Helpers
type ExpoExtra = Record<string, any> | undefined;

const normalizeUrl = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/\/$/, '');
};

const extractHostFromUri = (uri?: string | null): string | undefined => {
  if (!uri) {
    return undefined;
  }

  const normalized = uri.trim();
  if (!normalized) {
    return undefined;
  }

  const withoutProtocol = normalized.replace(/^https?:\/\//i, '').replace(/^wss?:\/\//i, '');
  const hostSegment = withoutProtocol.split('/')[0];
  if (!hostSegment) {
    return undefined;
  }

  const [host] = hostSegment.split(':');
  return host || undefined;
};

const resolveBaseHost = (): { host?: string; port?: string | number } => {
  const expoConfig = Constants.expoConfig as Record<string, any> | undefined;
  const expoExtra: ExpoExtra = expoConfig?.extra;
  const expoGoConfig = (Constants as any).expoGoConfig as { hostUri?: string; debuggerHost?: string } | undefined;

  const explicitHost =
    (expoExtra?.apiHost as string | undefined) ||
    (a => (typeof a === 'string' ? a : undefined))(process.env.EXPO_PUBLIC_API_HOST);

  const explicitPort =
    (expoExtra && typeof expoExtra.apiPort !== 'undefined' ? expoExtra.apiPort : undefined) ||
    process.env.EXPO_PUBLIC_API_PORT ||
    process.env.API_PORT;

  const hostCandidates = [
    explicitHost,
    extractHostFromUri(expoExtra?.apiUrl as string | undefined),
    extractHostFromUri(expoConfig?.hostUri),
    extractHostFromUri(expoGoConfig?.hostUri),
    extractHostFromUri(expoGoConfig?.debuggerHost),
    extractHostFromUri((Constants as any).manifest?.hostUri),
    extractHostFromUri((Constants as any).manifest?.debuggerHost),
  ].filter(Boolean) as string[];

  return {
    host: hostCandidates[0],
    port: explicitPort,
  };
};

const resolveBaseUrl = (): string => {
  const envUrl = normalizeUrl(process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || process.env.API_BASE_URL);
  if (envUrl) {
    return envUrl;
  }

  const expoConfig = Constants.expoConfig as Record<string, any> | undefined;
  const expoExtra: ExpoExtra = expoConfig?.extra;
  const extraUrl = normalizeUrl((expoExtra?.apiUrl as string | undefined) || (expoExtra?.baseUrl as string | undefined));
  if (extraUrl) {
    return extraUrl;
  }

  const { host, port } = resolveBaseHost();
  if (host) {
    const normalizedPort = port ?? 3000;
    return `http://${host}:${normalizedPort}`;
  }

  return 'http://localhost:3000';
};

const resolveWsUrl = (httpUrl: string): string => {
  const envWsUrl = normalizeUrl(process.env.EXPO_PUBLIC_WS_URL || process.env.WS_URL);
  if (envWsUrl) {
    return envWsUrl;
  }

  try {
    const url = new URL(httpUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.toString();
  } catch {
    return 'ws://localhost:3000';
  }
};

const API_BASE_URL = resolveBaseUrl();
const WS_URL = resolveWsUrl(API_BASE_URL);

if (__DEV__) {
  console.info('[api] Using base URL:', API_BASE_URL);
  console.info('[api] Using websocket URL:', WS_URL);
}

// Storage Keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        if (!this.accessToken) {
          await this.loadTokenFromStorage();
        }
        
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.clearAuthData();
            // TODO: Navigate to login screen
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token Management
  private async loadTokenFromStorage(): Promise<void> {
    try {
      this.accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  public async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      this.accessToken = accessToken;
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      await this.saveTokens(accessToken, newRefreshToken);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  public async clearAuthData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      this.accessToken = null;
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // Generic API methods
  public async get<T>(endpoint: string): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(endpoint);
    return response.data;
  }

  public async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(endpoint, data, config);
    return response.data;
  }

  public async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(endpoint, data, config);
    return response.data;
  }

  public async patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.patch(endpoint, data, config);
    return response.data;
  }

  public async delete<T>(endpoint: string): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(endpoint);
    return response.data;
  }

  // Check if user is authenticated
  public async isAuthenticated(): Promise<boolean> {
    try {
      await this.loadTokenFromStorage();
      return !!this.accessToken;
    } catch {
      return false;
    }
  }

  // Get current user data from storage
  public async getCurrentUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Save user data to storage
  public async saveUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  public getBaseURL(): string | undefined {
    return this.axiosInstance.defaults.baseURL;
  }

  public setBaseURL(url: string): void {
    this.axiosInstance.defaults.baseURL = url;
  }

  public setDefaultHeader(key: string, value: string): void {
    this.axiosInstance.defaults.headers.common[key] = value;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;