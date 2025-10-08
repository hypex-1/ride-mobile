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
  }  // Delete account
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