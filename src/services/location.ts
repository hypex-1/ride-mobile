import * as Location from 'expo-location';
import { logger } from '../utils/logger';

const RAW_GOOGLE_MAPS_API_KEY = (
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  ''
).trim();

const GOOGLE_GEOCODING_API_KEY =
  RAW_GOOGLE_MAPS_API_KEY && RAW_GOOGLE_MAPS_API_KEY !== 'your_google_maps_key_here'
    ? RAW_GOOGLE_MAPS_API_KEY
    : '';

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

const TUNISIA_BOUNDS = {
  minLatitude: 30.0,
  maxLatitude: 37.5,
  minLongitude: 7.0,
  maxLongitude: 12.0,
};

// Development mock location for emulator testing
const MOCK_LOCATIONS = {
  monastir_isimm: { latitude: 35.7811, longitude: 10.8167, address: 'ISIMM - Institut Supérieur d\'Informatique et de Mathématiques, Monastir, Tunisia' },
  monastir_marina: { latitude: 35.7714, longitude: 10.8269, address: 'Monastir Marina, Monastir, Tunisia' },
  monastir_center: { latitude: 35.7781, longitude: 10.8267, address: 'Centre Ville Monastir, Tunisia' },
  monastir_airport: { latitude: 35.7581, longitude: 10.7547, address: 'Monastir Habib Bourguiba International Airport, Tunisia' },
};

// Function to get a random mock location for different emulator instances
const getRandomMockLocation = () => {
  const locations = Object.values(MOCK_LOCATIONS);
  const randomIndex = Math.floor(Math.random() * locations.length);
  return locations[randomIndex];
};

// Function to get mock location based on device/emulator
const getMockLocationForDevice = () => {
  // Try to get a consistent location per device based on device characteristics
  const deviceId = Math.abs(Date.now() % 2); // Simple way to differentiate devices
  
  if (deviceId === 0) {
    logger.log(' Assigning ISIMM location for this device (Driver)');
    return MOCK_LOCATIONS.monastir_isimm;
  } else {
    logger.log(' Assigning Marina location for this device (Rider)');
    return MOCK_LOCATIONS.monastir_marina;
  }
};

const isDevelopment = __DEV__;
const USE_MOCK_LOCATION = isDevelopment; // Set to true for emulator testing

const isWithinTunisia = (latitude: number, longitude: number): boolean =>
  latitude >= TUNISIA_BOUNDS.minLatitude &&
  latitude <= TUNISIA_BOUNDS.maxLatitude &&
  longitude >= TUNISIA_BOUNDS.minLongitude &&
  longitude <= TUNISIA_BOUNDS.maxLongitude;

class LocationService {
  private hasPermission = false;

  // Request location permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      logger.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Get current position
  async getCurrentPosition(): Promise<LocationCoords | null> {
    try {
      // Use mock location for development/emulator testing
      if (USE_MOCK_LOCATION) {
        const mockLocation = getMockLocationForDevice();
        logger.log(' Using mock location for emulator testing:', mockLocation.address);
        return mockLocation;
      }

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
      logger.error('Error getting current position:', error);
      // Fallback to mock location if real location fails
      if (isDevelopment) {
        const fallbackLocation = getMockLocationForDevice();
        logger.log(' Falling back to mock location:', fallbackLocation.address);
        return fallbackLocation;
      }
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
      logger.error('Error watching position:', error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
      return null;
    }
  }

  // Reverse geocoding - convert coordinates to address
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationAddress | null> {
    const fallbackAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const baseRecord: LocationAddress = {
        latitude,
        longitude,
        address: fallbackAddress,
      };

      if (results && results.length > 0) {
        const result = results[0];

        const expoAddress = this.buildExpoAddressLine(result);

        baseRecord.city = result.city || result.subregion || result.district || baseRecord.city;
        baseRecord.region = result.region || result.subregion || baseRecord.region;
        baseRecord.country = result.country || baseRecord.country;
        baseRecord.postalCode = result.postalCode || baseRecord.postalCode;

        const googleAddress = await this.reverseGeocodeWithGoogle(latitude, longitude, {
          ...baseRecord,
          address: expoAddress || baseRecord.address,
        });

        if (googleAddress) {
          return googleAddress;
        }

        if (expoAddress) {
          return {
            ...baseRecord,
            address: expoAddress,
          };
        }

        return baseRecord;
      }

      const googleAddress = await this.reverseGeocodeWithGoogle(latitude, longitude);
      if (googleAddress) {
        return googleAddress;
      }

      return baseRecord;
    } catch (error) {
      logger.error('Error reverse geocoding:', error);
      const googleAddress = await this.reverseGeocodeWithGoogle(latitude, longitude);
      if (googleAddress) {
        return googleAddress;
      }
      return {
        latitude,
        longitude,
        address: fallbackAddress,
      };
    }
  }

  // Forward geocoding - convert address to coordinates
  async geocode(address: string): Promise<LocationAddress[]> {
    try {
      const results = await Location.geocodeAsync(address);
      
      const locations: LocationAddress[] = [];
      
      for (const result of results) {
        if (!isWithinTunisia(result.latitude, result.longitude)) {
          continue;
        }

        // Try to get detailed address info
        const detailedAddress = await this.reverseGeocode(
          result.latitude,
          result.longitude
        );

        if (detailedAddress?.country && detailedAddress.country !== 'Tunisia') {
          continue;
        }
        
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
      
      return locations.filter((location) =>
        isWithinTunisia(location.latitude, location.longitude)
      );
    } catch (error) {
      logger.error('Error geocoding address:', error);
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
  private buildExpoAddressLine(result: Location.LocationGeocodedAddress): string {
    const parts: string[] = [];

    if (!this.isGenericName(result.name, result)) {
      this.pushIfUnique(parts, result.name);
    }

    const streetLine = [result.streetNumber, result.street]
      .filter(Boolean)
      .join(' ')
      .trim();
    this.pushIfUnique(parts, streetLine);

    this.pushIfUnique(parts, result.district);
    this.pushIfUnique(parts, result.subregion);
    this.pushIfUnique(parts, result.city);

    if (result.region && result.region !== result.city) {
      this.pushIfUnique(parts, result.region);
    }

    return parts.join(', ');
  }

  private isGenericName(
    name: string | null | undefined,
    result: Location.LocationGeocodedAddress,
  ): boolean {
    if (!name) {
      return true;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return true;
    }

    const lower = trimmed.toLowerCase();
    if (lower === 'unnamed road') {
      return true;
    }

    const genericTokens = ['governorate', 'gouvernorat', 'tunisia'];
    if (genericTokens.some((token) => lower.includes(token))) {
      return true;
    }

    const comparable = [
      result.city,
      result.region,
      result.subregion,
      result.district,
      result.country,
    ]
      .filter(Boolean)
      .map((value) => value?.trim().toLowerCase()) as string[];

    return comparable.includes(lower);
  }

  private pushIfUnique(parts: string[], value?: string | null) {
    if (!value) {
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    if (parts.some((part) => part.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    parts.push(trimmed);
  }

  private extractComponent(
    components: Array<{ long_name: string; types: string[] }> | undefined,
    wantedTypes: string[],
  ): string | undefined {
    if (!components?.length) {
      return undefined;
    }

    const match = components.find((component) =>
      component.types?.some((type) => wantedTypes.includes(type)),
    );

    return match?.long_name;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  private async reverseGeocodeWithGoogle(
    latitude: number,
    longitude: number,
    fallback?: Partial<LocationAddress>,
  ): Promise<LocationAddress | null> {
    if (!GOOGLE_GEOCODING_API_KEY) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_GEOCODING_API_KEY,
        language: 'en',
      });

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`Google Geocoding request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'OK' && data.results?.length) {
        const prioritizedTypes = [
          'street_address',
          'premise',
          'point_of_interest',
          'establishment',
          'natural_feature',
          'route',
        ];

        const bestResult =
          data.results.find((result: any) =>
            result.types?.some((type: string) => prioritizedTypes.includes(type)),
          ) ?? data.results[0];

        if (!bestResult) {
          return null;
        }

        const components = bestResult.address_components ?? [];

        const placeName = this.extractComponent(components, [
          'point_of_interest',
          'establishment',
          'premise',
          'natural_feature',
          'transit_station',
        ]);
        const streetNumber = this.extractComponent(components, ['street_number']);
        const route = this.extractComponent(components, ['route']);
        const neighborhood = this.extractComponent(components, [
          'neighborhood',
          'sublocality',
          'sublocality_level_1',
          'administrative_area_level_3',
        ]);
        const city =
          this.extractComponent(components, ['locality', 'administrative_area_level_2']) ||
          fallback?.city;
        const region =
          this.extractComponent(components, ['administrative_area_level_1']) ||
          fallback?.region;
        const country = this.extractComponent(components, ['country']) || fallback?.country;
        const postalCode =
          this.extractComponent(components, ['postal_code']) || fallback?.postalCode;

        const addressParts: string[] = [];
        this.pushIfUnique(addressParts, placeName);

        const streetLine = [streetNumber, route].filter(Boolean).join(' ').trim();
        this.pushIfUnique(addressParts, streetLine);
        this.pushIfUnique(addressParts, neighborhood);
        this.pushIfUnique(addressParts, city);
        if (region && region !== city) {
          this.pushIfUnique(addressParts, region);
        }

        const address =
          addressParts.filter(Boolean).join(', ') ||
          bestResult.formatted_address ||
          fallback?.address ||
          `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        return {
          latitude,
          longitude,
          address,
          city,
          region,
          country,
          postalCode,
        };
      }

      return null;
    } catch (error) {
      logger.error('Error reverse geocoding with Google:', error);
      return null;
    }
  }

  // Check if location services are enabled
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      logger.error('Error checking location services:', error);
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
