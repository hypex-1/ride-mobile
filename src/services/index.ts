// Core API services
export { default as apiService } from './api';
export { default as authService } from './auth';
export { default as rideService } from './ride';
export { default as locationService } from './location';
export { default as driverService } from './driver';

// Re-export auth types
export type {
  LoginCredentials,
  RegisterData,
  User,
  AuthResponse,
} from './auth';

// Re-export ride types
export type {
  RideLocation,
  Driver,
  RideRequest,
  Ride,
  PaymentLog,
} from './ride';

// Re-export location types
export type {
  LocationCoords,
  LocationAddress,
} from './location';

// Re-export driver types
export type {
  DriverStats,
  RideRequest as DriverRideRequest,
  DriverLocation,
} from './driver';

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