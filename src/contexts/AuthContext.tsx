import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, LoginCredentials, RegisterData, User } from '../services/auth';
import { notificationService } from '../services/notification';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if user has valid token
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        // Try to get current user from backend (/auth/me)
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // 🔔 Initialize push notifications for existing user
          await initializePushNotifications();
        } else {
          // If getting user fails, clear auth data
          await authService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear any potentially invalid auth data
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize push notifications and register token
  const initializePushNotifications = async () => {
    try {
      console.log('🔔 Initializing push notifications...');
      
      // Get push token
      const pushToken = await notificationService.initialize();
      
      if (pushToken) {
        // Register token with backend
        const success = await notificationService.registerPushToken(pushToken);
        if (success) {
          console.log('✅ Push notifications initialized successfully');
        } else {
          console.log('⚠️ Failed to register push token with backend');
        }
      } else {
        console.log('⚠️ Failed to get push token');
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      setUser(response.user);
      
      // 🔔 Initialize push notifications after successful login
      await initializePushNotifications();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);
      setUser(response.user);
      
      // 🔔 Initialize push notifications after successful registration
      await initializePushNotifications();
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Refresh user failed:', error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};