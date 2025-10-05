import { apiService } from './api';

export interface DriverStats {
  ridesCompleted: number;
  earnings: number;
  onlineTime: number; // in minutes
  rating: number;
  totalRides: number;
}

export interface RideRequest {
  id: string;
  riderId: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dropoffLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  rideType: 'standard' | 'premium' | 'shared';
  estimatedFare: number;
  estimatedDistance: number; // in km
  estimatedDuration: number; // in minutes
  createdAt: string;
  rider: {
    id: string;
    name: string;
    rating: number;
    phone?: string;
  };
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  heading?: number;
  speed?: number;
}

class DriverService {
  // Update driver availability status
  async updateStatus(status: 'available' | 'busy' | 'offline'): Promise<void> {
    try {
      await apiService.patch('/drivers/status', { status });
      console.log(`Driver status updated to: ${status}`);
    } catch (error) {
      console.error('Error updating driver status:', error);
      throw error;
    }
  }

  // Update driver location
  async updateLocation(location: DriverLocation): Promise<void> {
    try {
      await apiService.put('/drivers/location', location);
      console.log('Driver location updated:', location);
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  }

  // Accept a ride request
  async acceptRide(rideId: string): Promise<any> {
    try {
      const response = await apiService.post<any>(`/rides/${rideId}/accept`);
      console.log('Ride accepted:', response);
      return response;
    } catch (error) {
      console.error('Error accepting ride:', error);
      throw error;
    }
  }

  // Decline a ride request
  async declineRide(rideId: string, reason?: string): Promise<void> {
    try {
      await apiService.post(`/rides/${rideId}/decline`, { reason });
      console.log('Ride declined:', rideId);
    } catch (error) {
      console.error('Error declining ride:', error);
      throw error;
    }
  }

  // Start a ride (driver arrived at pickup)
  async startRide(rideId: string): Promise<any> {
    try {
      const response = await apiService.post<any>(`/rides/${rideId}/start`);
      console.log('Ride started:', response);
      return response;
    } catch (error) {
      console.error('Error starting ride:', error);
      throw error;
    }
  }

  // Complete a ride
  async completeRide(rideId: string, finalLocation?: DriverLocation): Promise<any> {
    try {
      const response = await apiService.post<any>(`/rides/${rideId}/complete`, {
        finalLocation
      });
      console.log('Ride completed:', response);
      return response;
    } catch (error) {
      console.error('Error completing ride:', error);
      throw error;
    }
  }

  // Get driver's today stats
  async getTodayStats(): Promise<DriverStats> {
    try {
      const response = await apiService.get<DriverStats>('/drivers/stats/today');
      return response;
    } catch (error) {
      console.error('Error fetching today stats:', error);
      return {
        ridesCompleted: 0,
        earnings: 0,
        onlineTime: 0,
        rating: 5.0,
        totalRides: 0
      };
    }
  }

  // Get driver's weekly stats
  async getWeeklyStats(): Promise<DriverStats[]> {
    try {
      const response = await apiService.get<DriverStats[]>('/drivers/stats/weekly');
      return response;
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      return [];
    }
  }

  // Get active ride requests for the driver
  async getActiveRideRequests(): Promise<RideRequest[]> {
    try {
      const response = await apiService.get<RideRequest[]>('/drivers/ride-requests');
      return response;
    } catch (error) {
      console.error('Error fetching ride requests:', error);
      return [];
    }
  }

  // Get current active ride
  async getActiveRide(): Promise<any> {
    try {
      const response = await apiService.get<any>('/drivers/active-ride');
      return response;
    } catch (error) {
      console.error('Error fetching active ride:', error);
      return null;
    }
  }

  // Update driver profile
  async updateProfile(profileData: {
    name?: string;
    phone?: string;
    vehicle?: {
      make?: string;
      model?: string;
      year?: number;
      color?: string;
      licensePlate?: string;
    };
  }): Promise<any> {
    try {
      const response = await apiService.put<any>('/drivers/profile', profileData);
      console.log('Driver profile updated:', response);
      return response;
    } catch (error) {
      console.error('Error updating driver profile:', error);
      throw error;
    }
  }

  // Report an issue
  async reportIssue(issueData: {
    type: 'rider' | 'vehicle' | 'payment' | 'app' | 'other';
    description: string;
    rideId?: string;
  }): Promise<void> {
    try {
      await apiService.post('/drivers/issues', issueData);
      console.log('Issue reported:', issueData);
    } catch (error) {
      console.error('Error reporting issue:', error);
      throw error;
    }
  }

  // Get navigation directions (if needed)
  async getDirections(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): Promise<any> {
    try {
      const response = await apiService.post<any>('/location/directions', { from, to });
      return response;
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }
}

export default new DriverService();