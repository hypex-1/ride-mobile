// Core API services
export { default as apiService } from './api';
export { default as authService } from './auth';

// Re-export auth types
export type {
  LoginCredentials,
  RegisterData,
  User,
  AuthResponse,
} from './auth';

// Service initialization helper
export const initializeServices = async () => {
  try {
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
};

// Service cleanup helper
export const cleanupServices = () => {
  try {
    console.log('Services cleaned up successfully');
  } catch (error) {
    console.error('Failed to cleanup services:', error);
  }
};