// Base Types
export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'rider' | 'driver';
  isVerified: boolean;
  profilePicture?: string;
  rating?: number;
  totalRides?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  pickupLocation: Location & { address: string };
  dropoffLocation: Location & { address: string };
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  estimatedFare: number;
  actualFare?: number;
  createdAt: string;
  updatedAt: string;
}