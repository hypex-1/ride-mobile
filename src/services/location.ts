import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationAddress {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

class LocationService {
  private hasPermission = false;

  // Request location permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Get current position
  async getCurrentPosition(): Promise<LocationCoords | null> {
    try {
      if (!this.hasPermission) {
        const permissionGranted = await this.requestPermissions();
        if (!permissionGranted) {
          throw new Error('Location permission not granted');
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 1,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }

  // Watch position changes
  async watchPosition(
    callback: (position: LocationCoords) => void,
    errorCallback?: (error: Error) => void
  ): Promise<Location.LocationSubscription | null> {
    try {
      if (!this.hasPermission) {
        const permissionGranted = await this.requestPermissions();
        if (!permissionGranted) {
          throw new Error('Location permission not granted');
        }
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error('Error watching position:', error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
      return null;
    }
  }

  // Reverse geocoding - convert coordinates to address
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationAddress | null> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results && results.length > 0) {
        const result = results[0];
        const addressParts = [
          result.streetNumber,
          result.street,
          result.city,
          result.region,
        ].filter(Boolean);

        return {
          latitude,
          longitude,
          address: addressParts.join(', '),
          city: result.city || undefined,
          region: result.region || undefined,
          country: result.country || undefined,
          postalCode: result.postalCode || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return {
        latitude,
        longitude,
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      };
    }
  }

  // Forward geocoding - convert address to coordinates
  async geocode(address: string): Promise<LocationAddress[]> {
    try {
      const results = await Location.geocodeAsync(address);
      
      const locations: LocationAddress[] = [];
      
      for (const result of results) {
        // Try to get detailed address info
        const detailedAddress = await this.reverseGeocode(
          result.latitude,
          result.longitude
        );
        
        locations.push({
          latitude: result.latitude,
          longitude: result.longitude,
          address: detailedAddress?.address || address,
          city: detailedAddress?.city,
          region: detailedAddress?.region,
          country: detailedAddress?.country,
          postalCode: detailedAddress?.postalCode,
        });
      }
      
      return locations;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return [];
    }
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(point1: LocationCoords, point2: LocationCoords): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(point2.latitude - point1.latitude);
    const dLon = this.degreesToRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degreesToRadians(point1.latitude)) * 
      Math.cos(this.degreesToRadians(point2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  // Calculate bearing between two points
  calculateBearing(point1: LocationCoords, point2: LocationCoords): number {
    const dLon = this.degreesToRadians(point2.longitude - point1.longitude);
    const lat1 = this.degreesToRadians(point1.latitude);
    const lat2 = this.degreesToRadians(point2.latitude);
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    const bearing = Math.atan2(y, x);
    return (this.radiansToDegrees(bearing) + 360) % 360;
  }

  // Helper methods
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  // Check if location services are enabled
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  // Get location accuracy
  async getLocationAccuracy(): Promise<Location.LocationAccuracy> {
    // Return high accuracy for ride-sharing app
    return Location.Accuracy.High;
  }
}

export default new LocationService();