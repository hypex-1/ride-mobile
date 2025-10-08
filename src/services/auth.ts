import { apiService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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
  role: 'rider' | 'driver' | 'RIDER' | 'DRIVER';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

const resolveCustomDeleteEndpoints = (): string[] => {
  const extraConfig = (Constants as any)?.expoConfig?.extra;
  const extraEndpoints = extraConfig?.deleteAccountEndpoints;
  const envEndpoints =
    process.env.EXPO_PUBLIC_DELETE_ACCOUNT_ENDPOINTS ||
    process.env.DELETE_ACCOUNT_ENDPOINTS ||
    process.env.DELETE_ACCOUNT_ENDPOINT;

  const normalize = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter(Boolean).map((item) => String(item));
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  return [...new Set([...normalize(extraEndpoints), ...normalize(envEndpoints)])];
};

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileParams {
  name?: string;
  email?: string;
  phoneNumber?: string;
  profilePictureUri?: string | null;
  profilePictureName?: string | null;
  profilePictureMimeType?: string | null;
}

class AuthService {
  private normalizeUser(user: User): User {
    if (!user) {
      return user;
    }

    let profilePicture = user.profilePicture;
    if (profilePicture) {
      const baseURL = apiService.getBaseURL();
      if (baseURL && !/^https?:\/\//i.test(profilePicture)) {
        const normalizedBase = baseURL.replace(/\/+$/, '');
        const normalizedPath = profilePicture.replace(/^\/+/, '');
        profilePicture = `${normalizedBase}/${normalizedPath}`;
      }
    }

    return {
      ...user,
      profilePicture,
    };
  }

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

  // Save tokens and user data
  await apiService.saveTokens(response.accessToken, response.refreshToken);
  const normalizedUser = this.normalizeUser(response.user);
  await apiService.saveUserData(normalizedUser);

  return { ...response, user: normalizedUser };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  // Login user
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
  const response = await apiService.post<AuthResponse>('/auth/login', credentials);

  // Save tokens and user data
  await apiService.saveTokens(response.accessToken, response.refreshToken);
  const normalizedUser = this.normalizeUser(response.user);
  await apiService.saveUserData(normalizedUser);

  return { ...response, user: normalizedUser };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  // Get current user from backend
  public async getCurrentUser(): Promise<User | null> {
    try {
  const user = await apiService.get<User>('/auth/me');
  const normalizedUser = this.normalizeUser(user);
  await apiService.saveUserData(normalizedUser);
  return normalizedUser;
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
  public async updateProfile(data: UpdateProfileParams): Promise<User> {
    const { profilePictureUri, profilePictureName, profilePictureMimeType, ...rest } = data;

    try {
      let updatedUser: User;

      if (profilePictureUri) {
        // If we have a profile picture, send as multipart form data
        const formData = new FormData();
        
        // Add text fields
        Object.entries(rest).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        // Add the profile picture file
        formData.append('profilePicture', {
          uri: profilePictureUri,
          name: profilePictureName || 'profile.jpg',
          type: profilePictureMimeType || 'image/jpeg',
        } as any);

        // Send multipart request
        updatedUser = await apiService.patch<User>('/auth/me', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // If no profile picture, send as regular JSON
        updatedUser = await apiService.patch<User>('/auth/me', rest);
      }

      const normalizedUser = this.normalizeUser(updatedUser);
      await apiService.saveUserData(normalizedUser);
      return normalizedUser;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error?.response?.data?.message || 'Profile update failed');
    }
  }  
  
  // Verify password for sensitive operations
  public async verifyPassword(password: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user?.email) {
        throw new Error('User email not found');
      }
      
      // Attempt to verify password by making a verification request
      await apiService.post('/auth/verify-password', { password });
      return true;
    } catch (error: any) {
      console.error('Password verification error:', error);
      return false;
    }
  }
  
  // Delete account with password confirmation
  public async deleteAccountWithPassword(password: string): Promise<void> {
    if (!password) {
      throw new Error('Password is required');
    }

    let deletionSucceeded = false;
    let lastError: any = null;

    try {
      // 1) Try dedicated delete endpoint that accepts password in payload
      try {
        await apiService.post('/auth/delete-account', { password });
        deletionSucceeded = true;
        return;
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status && ![404, 405].includes(error.response.status)) {
          throw this.normalizeAxiosError(error, 'Account deletion failed');
        }
        console.log('Primary delete endpoint unavailable, attempting password verification fallbacks');
      }

      // 2) Attempt password verification via dedicated endpoint
      let passwordVerified = false;
      try {
        await apiService.post('/auth/verify-password', { password });
        passwordVerified = true;
      } catch (verifyError: any) {
        if (verifyError?.response?.status && ![404, 405].includes(verifyError.response.status)) {
          throw this.normalizeAxiosError(verifyError, 'Password verification failed');
        }
        console.log('Password verification endpoint unavailable, using login-based verification');
      }

      // 3) Fall back to login-based verification if needed
      if (!passwordVerified) {
        const user = await this.getCurrentUser();
        if (!user?.email) {
          throw new Error('Unable to determine your email address for verification. Please login again.');
        }

        try {
          await this.login({ email: user.email, password });
          passwordVerified = true;
        } catch (loginError: any) {
          throw new Error('Incorrect password. Please try again.');
        }
      }

      // 4) Attempt deletion using known fallback endpoints
      const userId = (await this.getCurrentUser())?.id;

      const customDeleteAttempts = resolveCustomDeleteEndpoints()
        .map((entry) => {
          const trimmed = entry.trim();
          if (!trimmed) return null;

          const [maybeMethod, ...rest] = trimmed.split(/\s+/);
          const normalizedMethod = maybeMethod?.toLowerCase();
          const isExplicitMethod = normalizedMethod === 'delete' || normalizedMethod === 'post';
          const method: 'delete' | 'post' = isExplicitMethod ? (normalizedMethod as 'delete' | 'post') : 'delete';
          const url = (isExplicitMethod ? rest.join(' ') : trimmed).trim();

          if (!url) {
            return null;
          }

          const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
          return {
            method,
            url: normalizedUrl,
            data: method === 'post' ? { password } : undefined,
          };
        })
        .filter(Boolean) as Array<{ method: 'delete' | 'post'; url: string; data?: any }>;

      const deleteAttempts: Array<{ method: 'delete' | 'post'; url: string; data?: any }> = [
        ...customDeleteAttempts,
        { method: 'delete', url: '/users/me' },
        { method: 'delete', url: '/auth/account' },
        { method: 'post', url: '/users/delete', data: { password } },
        userId ? { method: 'delete', url: `/users/${userId}` } : null,
        userId ? { method: 'post', url: `/users/${userId}/delete`, data: { password } } : null,
        { method: 'post', url: '/auth/delete', data: { password } },
      ].filter(Boolean) as Array<{ method: 'delete' | 'post'; url: string; data?: any }>;

      for (const attempt of deleteAttempts) {
        try {
          if (attempt.method === 'delete') {
            await apiService.delete(attempt.url);
          } else {
            await apiService.post(attempt.url, attempt.data);
          }
          deletionSucceeded = true;
          console.log(`Account deleted via endpoint ${attempt.method.toUpperCase()} ${attempt.url}`);
          break;
        } catch (attemptError: any) {
          lastError = attemptError;
          const status = attemptError?.response?.status;
          if (status && ![404, 405].includes(status)) {
            throw this.normalizeAxiosError(attemptError, 'Account deletion failed');
          }
          console.log(`Endpoint ${attempt.method.toUpperCase()} ${attempt.url} unavailable (status ${status}). Trying next option.`);
        }
      }

      if (!deletionSucceeded) {
        const errorMessage = lastError?.response?.status === 404
          ? 'Account deletion service is unavailable. Please contact support.'
          : 'Account deletion failed. Please try again later.';
        throw new Error(errorMessage);
      }
    } finally {
      if (deletionSucceeded) {
        await apiService.clearAuthData();
      }
    }
  }

  private normalizeAxiosError(error: any, fallbackMessage: string): Error {
    const message = error?.response?.data?.message || error?.message || fallbackMessage;
    return new Error(message);
  }
  
  // Delete account (legacy method without password verification)
  public async deleteAccount(): Promise<void> {
    try {
      await apiService.delete('/auth/account');
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw new Error(error.response?.data?.message || 'Account deletion failed');
    } finally {
      await apiService.clearAuthData();
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;