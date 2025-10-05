import { apiService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: 'rider' | 'driver';
}

export interface BackendRegisterData {
  email: string;
  password: string;
  name?: string;
  role?: 'RIDER' | 'DRIVER';
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'rider' | 'driver';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  // Register new user
  public async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Transform mobile app data to backend format
      const backendData: BackendRegisterData = {
        email: userData.email,
        password: userData.password,
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        role: userData.role.toUpperCase() as 'RIDER' | 'DRIVER',
      };
      
      const response = await apiService.post<AuthResponse>('/auth/register', backendData);
      
      // Save user data and tokens
      await apiService.saveUserData(response.user);
      
      return response;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  // Login user
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      
      // Save user data and tokens
      await apiService.saveUserData(response.user);
      
      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  // Get current user from backend
  public async getCurrentUser(): Promise<User | null> {
    try {
      const user = await apiService.get<User>('/auth/me');
      await apiService.saveUserData(user);
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Logout
  public async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await apiService.clearAuthData();
    }
  }

  // Check if authenticated
  public async isAuthenticated(): Promise<boolean> {
    return await apiService.isAuthenticated();
  }

  // Update profile
  public async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const updatedUser = await apiService.put<User>('/auth/profile', data);
      await apiService.saveUserData(updatedUser);
      return updatedUser;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;