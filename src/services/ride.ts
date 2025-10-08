import apiService from './api';

export interface RideLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  vehicle: {
    make: string;
    model: string;
    color: string;
    licensePlate: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  available: boolean;
  distance?: number; // in kilometers
  estimatedArrival?: number; // in minutes
}

export interface RideRequest {
  pickupLocation: RideLocation;
  dropoffLocation: RideLocation;
  rideType: 'standard' | 'premium' | 'shared';
  estimatedFare?: number;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'DRIVER_ARRIVING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  pickupLocation: RideLocation;
  dropoffLocation: RideLocation;
  rideType: string;
  estimatedFare: number;
  actualFare?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  driver?: Driver;
}

export interface PaymentLog {
  rideId: string;
  amount: number;
  method: 'cash' | 'card' | 'digital_wallet';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
}

class RideService {
  // Get nearby drivers
  async getNearbyDrivers(
    pickupLat: number, 
    pickupLng: number, 
    destinationLat?: number, 
    destinationLng?: number, 
    radius: number = 5
  ): Promise<Driver[]> {
    try {
      // Use pickup location as destination if no destination provided
      const destLat = destinationLat || pickupLat;
      const destLng = destinationLng || pickupLng;
      
      const url = `/matching/nearby-drivers?pickup_lat=${pickupLat}&pickup_lng=${pickupLng}&destination_lat=${destLat}&destination_lng=${destLng}&radius=${radius}`;
      console.log('Fetching nearby drivers with URL:', url);
      
      const response = await apiService.get<Driver[]>(url);
      console.log('Nearby drivers response:', response);
      
      // If no drivers from API, return mock drivers for development
      if (!response || response.length === 0) {
        console.log('No real drivers found, returning mock drivers for development');
        return this.getMockDrivers(pickupLat, pickupLng);
      }
      
      return response;
    } catch (error: any) {
      console.error('Error fetching nearby drivers:', error);
      console.error('Error response:', error.response?.data);
      // Return mock data for development
      console.log('API error, returning mock drivers for development');
      return this.getMockDrivers(pickupLat, pickupLng);
    }
  }

  // Request a ride
  async requestRide(rideRequest: RideRequest): Promise<Ride> {
    try {
      console.log('🚗 REQUESTING RIDE - Original data:', JSON.stringify(rideRequest, null, 2));
      
      // Transform the data to match backend expectations
      const requestData = {
        pickupLat: rideRequest.pickupLocation.latitude,
        pickupLng: rideRequest.pickupLocation.longitude,
        pickupAddress: rideRequest.pickupLocation.address,
        dropoffLat: rideRequest.dropoffLocation.latitude,
        dropoffLng: rideRequest.dropoffLocation.longitude,
        dropoffAddress: rideRequest.dropoffLocation.address,
        // Note: rideType is not expected by the backend
      };
      
      console.log('🔄 TRANSFORMED DATA for backend:', JSON.stringify(requestData, null, 2));
      
      const response = await apiService.post<Ride>('/rides', requestData);
      return response;
    } catch (error: any) {
      console.error('Error requesting ride:', error);
      console.error('Error response:', error.response?.data);
      
      // For development/testing - return a mock ride
      console.log('Creating mock ride for testing...');
      const mockRide: Ride = {
        id: 'mock-ride-' + Date.now(),
        riderId: 'current-user',
        driverId: 'mock-driver-1',
        pickupLocation: rideRequest.pickupLocation,
        dropoffLocation: rideRequest.dropoffLocation,
        rideType: rideRequest.rideType,
        status: 'REQUESTED',
        estimatedFare: rideRequest.estimatedFare || 10,
        actualFare: rideRequest.estimatedFare || 10,
        estimatedDuration: 15,
        createdAt: new Date().toISOString(),
        driver: {
          id: 'mock-driver-1',
          name: 'Ahmed Ben Salem',
          rating: 4.8,
          available: true,
          vehicle: {
            make: 'Renault',
            model: 'Symbol',
            color: 'White',
            licensePlate: 'TUN 1234'
          },
          location: {
            latitude: rideRequest.pickupLocation.latitude + 0.01,
            longitude: rideRequest.pickupLocation.longitude + 0.01
          }
        }
      };
      
      return mockRide;
    }
  }

  // Get ride details
  async getRideDetails(rideId: string): Promise<Ride> {
    try {
      const response = await apiService.get<Ride>(`/rides/${rideId}`);
      return response;
    } catch (error) {
      console.error('Error fetching ride details:', error);
      throw new Error('Failed to get ride details');
    }
  }

  // Cancel a ride
  async cancelRide(rideId: string | number, reason?: string): Promise<void> {
    try {
      console.log('🚫 cancelRide called with:', { rideId, type: typeof rideId, reason });
      
      // Convert rideId to string if it's a number
      const rideIdStr = String(rideId);
      
      // Check if rideId is valid
      if (!rideIdStr || rideIdStr === 'undefined' || rideIdStr === 'null') {
        console.error('Cannot cancel ride: rideId is invalid:', rideIdStr);
        return;
      }
      
      // Handle mock rides
      if (rideIdStr.startsWith('mock-ride-')) {
        console.log('Cancelling mock ride:', rideIdStr);
        return;
      }
      
      console.log('🔄 Sending cancel request to backend for ride:', rideIdStr);
      await apiService.post(`/rides/${rideIdStr}/cancel`, { reason });
      console.log('✅ Ride cancelled successfully');
    } catch (error: any) {
      console.error('Error cancelling ride:', error);
      console.error('Cancel ride error response:', error.response?.data);
      
      // For mock rides or development, don't throw error
      const rideIdStr = String(rideId);
      if (rideIdStr && rideIdStr.startsWith('mock-ride-')) {
        return;
      }
      
      throw new Error('Failed to cancel ride');
    }
  }

  // Get user's ride history
  async getRideHistory(): Promise<Ride[]> {
    try {
      const response = await apiService.get<Ride[]>('/rides');
      return response;
    } catch (error) {
      console.error('Error fetching ride history:', error);
      return [];
    }
  }

  // Get user's ride statistics
  async getRideStatistics(): Promise<{ completedTrips: number; totalSpent: number }> {
    try {
      const rides = await this.getRideHistory();
      
      // Filter only completed rides
      const completedRides = rides.filter(ride => ride.status === 'COMPLETED');
      
      // Calculate total spent from actual or estimated fare
      const totalSpent = completedRides.reduce((sum, ride) => {
        const fare = ride.actualFare || ride.estimatedFare || 0;
        return sum + fare;
      }, 0);
      
      return {
        completedTrips: completedRides.length,
        totalSpent: totalSpent
      };
    } catch (error) {
      console.error('Error fetching ride statistics:', error);
      return {
        completedTrips: 0,
        totalSpent: 0
      };
    }
  }

  // Log payment for completed ride
  async logPayment(paymentData: PaymentLog): Promise<void> {
    try {
      await apiService.post('/payments', paymentData);
    } catch (error) {
      console.error('Error logging payment:', error);
      throw new Error('Failed to log payment');
    }
  }

  // Get payment receipt
  async getPaymentReceipt(rideId: string): Promise<any> {
    try {
      const response = await apiService.get(`/payments/ride/${rideId}`);
      return response;
    } catch (error) {
      console.error('Error fetching payment receipt:', error);
      throw new Error('Failed to get payment receipt');
    }
  }

  // Calculate estimated fare using Tunisian taxi fare structure
  async calculateFare(pickupLocation: RideLocation, dropoffLocation: RideLocation, rideType: string): Promise<number> {
    try {
      // Calculate distance using Haversine formula
      const distance = this.calculateDistance(pickupLocation, dropoffLocation);
      
      // Tunisian taxi fare structure (in TND) - Official rates 2024-2025
      // Based on Ministry of Transport regulations for licensed taxis
      const TUNISIA_TAXI_RATES = {
        standard: {
          baseFare: 0.650,          // Base fare (prise en charge): 650 millimes
          perKmRate: 0.850,         // Per km rate: 850 millimes/km (day rate)
          minimumFare: 1.500,       // Minimum fare: 1.5 TND
          nightSurcharge: 0.25,     // 25% surcharge 22h-06h
          holidaySurcharge: 0.30,   // 30% surcharge weekends/holidays
        },
        premium: {
          baseFare: 1.000,          // Premium base fare: 1 TND
          perKmRate: 1.200,         // Premium per km: 1.2 TND/km
          minimumFare: 2.500,       // Premium minimum: 2.5 TND
          nightSurcharge: 0.25,
          holidaySurcharge: 0.30,
        },
        shared: {
          baseFare: 0.500,          // Shared base fare: 500 millimes
          perKmRate: 0.650,         // Shared per km: 650 millimes/km (reduced)
          minimumFare: 1.200,       // Shared minimum: 1.2 TND
          nightSurcharge: 0.20,     // Reduced surcharge for shared rides
          holidaySurcharge: 0.25,
        }
      };

      const rates = TUNISIA_TAXI_RATES[rideType as keyof typeof TUNISIA_TAXI_RATES];
      
      // Base calculation: Base fare + (Distance × Rate per km)
      let estimatedFare = rates.baseFare + (distance * rates.perKmRate);
      
      // Apply minimum fare (as per Tunisian taxi regulations)
      estimatedFare = Math.max(estimatedFare, rates.minimumFare);
      
      // Apply time-based surcharges per Tunisian taxi law
      const currentHour = new Date().getHours();
      const isNightTime = currentHour >= 22 || currentHour <= 6; // 22h-06h night rate
      const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6; // Weekend surcharge
      
      if (isNightTime) {
        estimatedFare *= (1 + rates.nightSurcharge);
      }
      
      if (isWeekend) {
        estimatedFare *= (1 + rates.holidaySurcharge);
      }
      
      // Round to nearest 50 millimes (0.050 TND) as per Tunisia's currency conventions
      estimatedFare = Math.round(estimatedFare * 20) / 20;
      
      return estimatedFare;
    } catch (error) {
      console.error('Error calculating fare:', error);
      return 1.500; // Return minimum standard fare as fallback
    }
  }

  // Get fare breakdown details for transparency
  async getFareBreakdown(pickupLocation: RideLocation, dropoffLocation: RideLocation, rideType: string): Promise<{
    distance: number;
    baseFare: number;
    distanceFare: number;
    surcharges: { night?: number; weekend?: number };
    total: number;
    currency: string;
  }> {
    const distance = this.calculateDistance(pickupLocation, dropoffLocation);
    const TUNISIA_TAXI_RATES = {
      standard: { baseFare: 0.650, perKmRate: 0.850, minimumFare: 1.500, nightSurcharge: 0.25, holidaySurcharge: 0.30 },
      premium: { baseFare: 1.000, perKmRate: 1.200, minimumFare: 2.500, nightSurcharge: 0.25, holidaySurcharge: 0.30 },
      shared: { baseFare: 0.500, perKmRate: 0.650, minimumFare: 1.200, nightSurcharge: 0.20, holidaySurcharge: 0.25 }
    };

    const rates = TUNISIA_TAXI_RATES[rideType as keyof typeof TUNISIA_TAXI_RATES];
    const baseFare = rates.baseFare;
    const distanceFare = distance * rates.perKmRate;
    let total = baseFare + distanceFare;
    
    // Apply minimum fare
    total = Math.max(total, rates.minimumFare);
    
    const surcharges: { night?: number; weekend?: number } = {};
    const currentHour = new Date().getHours();
    const isNightTime = currentHour >= 22 || currentHour <= 6;
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
    
    if (isNightTime) {
      surcharges.night = rates.nightSurcharge;
      total *= (1 + rates.nightSurcharge);
    }
    
    if (isWeekend) {
      surcharges.weekend = rates.holidaySurcharge;
      total *= (1 + rates.holidaySurcharge);
    }
    
    total = Math.round(total * 20) / 20; // Round to nearest 50 millimes

    return {
      distance: Math.round(distance * 100) / 100,
      baseFare,
      distanceFare: Math.round(distanceFare * 1000) / 1000,
      surcharges,
      total,
      currency: 'TND'
    };
  }

  // Calculate distance between two points
  private calculateDistance(point1: RideLocation, point2: RideLocation): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(point2.latitude - point1.latitude);
    const dLon = this.degreesToRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degreesToRadians(point1.latitude)) * Math.cos(this.degreesToRadians(point2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  // Mock data for development/testing
  private getMockDrivers(latitude: number, longitude: number): Driver[] {
    return [
      {
        id: '1',
        name: 'John Smith',
        rating: 4.8,
        vehicle: {
          make: 'Toyota',
          model: 'Camry',
          color: 'Silver',
          licensePlate: 'ABC123',
        },
        location: {
          latitude: latitude + 0.01,
          longitude: longitude + 0.01,
        },
        available: true,
        distance: 1.2,
        estimatedArrival: 5,
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        rating: 4.9,
        vehicle: {
          make: 'Honda',
          model: 'Civic',
          color: 'Blue',
          licensePlate: 'XYZ789',
        },
        location: {
          latitude: latitude - 0.005,
          longitude: longitude + 0.015,
        },
        available: true,
        distance: 0.8,
        estimatedArrival: 3,
      },
      {
        id: '3',
        name: 'Mike Davis',
        rating: 4.7,
        vehicle: {
          make: 'Ford',
          model: 'Focus',
          color: 'Black',
          licensePlate: 'DEF456',
        },
        location: {
          latitude: latitude + 0.008,
          longitude: longitude - 0.012,
        },
        available: true,
        distance: 1.5,
        estimatedArrival: 7,
      },
    ];
  }
}

export default new RideService();