import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Text,
  FAB,
  Chip,
  IconButton,
  Surface,
  Avatar,
  Portal,
  Modal,
  TextInput,
  ActivityIndicator,
  List,
} from 'react-native-paper';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNavigation } from '@react-navigation/native';
import {
  locationService,
  rideService,
  paymentService,
  type RideLocation,
  type Driver,
  type Ride,
} from '../../services';
import { spacing, radii, useAppTheme } from '../../theme';
import type { AppTheme } from '../../theme';
const { width, height } = Dimensions.get('window');

const LATITUDE_DELTA = 0.005;
const LONGITUDE_DELTA = LATITUDE_DELTA * (width / height);

const TUNISIA_BOUNDS = {
  minLatitude: 30.0,
  maxLatitude: 37.5,
  minLongitude: 7.0,
  maxLongitude: 12.0,
};

const MIN_LATITUDE_DELTA = 0.0025;
const MAX_LATITUDE_DELTA = 6;
const MIN_LONGITUDE_DELTA = 0.0025;
const MAX_LONGITUDE_DELTA = 6;

const GOOGLE_MAPS_API_KEY = (
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  ''
).trim();

const SANITIZED_GOOGLE_MAPS_API_KEY =
  GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'your_google_maps_key_here'
    ? GOOGLE_MAPS_API_KEY
    : '';

type LatLng = { latitude: number; longitude: number };

type LocationSuggestion = {
  id: string;
  description: string;
  placeId?: string;
  location?: RideLocation;
};

const decodePolyline = (encoded: string): LatLng[] => {
  if (!encoded) {
    return [];
  }

  const coordinates: LatLng[] = [];
  const len = encoded.length;
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < len) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    latitude += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    longitude += deltaLng;

    coordinates.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }

  return coordinates;
};

// Payment Method Selector Component
const PaymentMethodSelector: React.FC<{
  selectedMethod: string;
  availableMethods: Array<{ id: string; name: string; icon: string; disabled?: boolean }>;
  onMethodSelect: (methodId: string) => void;
  showTitle?: boolean;
}> = ({ selectedMethod, availableMethods, onMethodSelect, showTitle = true }) => {
  const theme = useAppTheme();
  
  return (
    <View style={{ marginBottom: spacing(2) }}>
      {showTitle && (
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: spacing(1), color: theme.colors.onSurface }}>
          Payment Method
        </Text>
      )}
      {availableMethods.map((method) => (
        <Button
          key={method.id}
          mode={selectedMethod === method.id ? 'contained' : 'outlined'}
          onPress={() => !method.disabled && onMethodSelect(method.id)}
          disabled={method.disabled}
          style={{ marginBottom: spacing(1) }}
          icon={method.icon}
          buttonColor={selectedMethod === method.id ? theme.colors.primary : undefined}
          textColor={selectedMethod === method.id ? theme.colors.onPrimary : theme.colors.onSurface}
        >
          {method.name}
        </Button>
      ))}
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    socket,
    isConnected,
    onRideUpdate,
    onDriverLocation,
    onRideAccepted,
    onRideCancelled,
    emitRideRequest,
    emitRideCancel,
  } = useSocket();

  // Location and Map State
  const mapRef = useRef<MapView>(null);
  const locationSearchCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentLocation, setCurrentLocation] = useState<RideLocation | null>(null);
  const [pickupLocation, setPickupLocation] = useState<RideLocation | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<RideLocation | null>(null);
  const [region, setRegion] = useState({
    latitude: 35.7714, // Monastir Marina coordinates
    longitude: 10.8269,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const mapBoundsSignatureRef = useRef<string | null>(null);

  // Ride State
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  const [rideType, setRideType] = useState<'standard' | 'premium'>('standard');
  const [estimatedFare, setEstimatedFare] = useState<number>(0);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [isRequestingRide, setIsRequestingRide] = useState<boolean>(false);
  const [isSearchingDriver, setIsSearchingDriver] = useState<boolean>(false);

  // UI State
  const [showRideOptions, setShowRideOptions] = useState<boolean>(false);
  const [showLocationSearch, setShowLocationSearch] = useState<'pickup' | 'dropoff' | null>(null);
  const [locationSearchText, setLocationSearchText] = useState<string>('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState<boolean>(false);
  const [placesSessionToken, setPlacesSessionToken] = useState<string | null>(null);

  // Payment State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash');
  const [availablePaymentMethods] = useState([
    { id: 'cash', name: 'Cash on Delivery', icon: 'cash' },
    { id: 'card', name: 'Card (Coming Soon)', icon: 'credit-card', disabled: true },
  ]);
  const hasDirectionsKey = SANITIZED_GOOGLE_MAPS_API_KEY.length > 0;
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState<boolean>(false);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationMin, setRouteDurationMin] = useState<number | null>(null);

  const shouldShowDriverMarkers = isSearchingDriver || currentRide !== null;

  const clampLatLng = useCallback(
    (lat: number, lng: number): LatLng => ({
      latitude: Math.max(
        TUNISIA_BOUNDS.minLatitude,
        Math.min(TUNISIA_BOUNDS.maxLatitude, lat),
      ),
      longitude: Math.max(
        TUNISIA_BOUNDS.minLongitude,
        Math.min(TUNISIA_BOUNDS.maxLongitude, lng),
      ),
    }),
    [],
  );

  const clampRegion = useCallback(
    (regionToClamp: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }) => {
      const { latitude, longitude } = clampLatLng(regionToClamp.latitude, regionToClamp.longitude);
      const latitudeDelta = Math.max(
        MIN_LATITUDE_DELTA,
        Math.min(MAX_LATITUDE_DELTA, regionToClamp.latitudeDelta || LATITUDE_DELTA),
      );
      const longitudeDelta = Math.max(
        MIN_LONGITUDE_DELTA,
        Math.min(MAX_LONGITUDE_DELTA, regionToClamp.longitudeDelta || LONGITUDE_DELTA),
      );

      return {
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
      };
    },
    [clampLatLng],
  );

  // Map region change handler with Tunisia constraints
  const handleRegionChange = useCallback((newRegion: any) => {
    setRegion(newRegion);
  }, []);

  const createPlacesSessionToken = useCallback(
    () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    [],
  );

  const fallbackRoute = useMemo<LatLng[]>(() => {
    if (!pickupLocation || !dropoffLocation) {
      return [];
    }

    return [
      { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
      { latitude: dropoffLocation.latitude, longitude: dropoffLocation.longitude },
    ];
  }, [pickupLocation, dropoffLocation]);

  const computeFallbackMetrics = useCallback(() => {
    if (!pickupLocation || !dropoffLocation) {
      setRouteDistanceKm(null);
      setRouteDurationMin(null);
      return;
    }

    const straightDistanceKm = locationService.calculateDistance(
      { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
      { latitude: dropoffLocation.latitude, longitude: dropoffLocation.longitude },
    );

    if (Number.isFinite(straightDistanceKm)) {
      setRouteDistanceKm(straightDistanceKm);
      const averageSpeedKmh = 32; // urban average speed
      const estimatedMinutes = Math.max(5, Math.round((straightDistanceKm / averageSpeedKmh) * 60));
      setRouteDurationMin(estimatedMinutes);
    } else {
      setRouteDistanceKm(null);
      setRouteDurationMin(null);
    }
  }, [pickupLocation, dropoffLocation]);

  const profileInitials = React.useMemo(() => {
    if (!user?.name) {
      return 'U';
    }
    return user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  const polylineCoordinates = useMemo<LatLng[]>(() => {
    if (routeCoordinates.length >= 2) {
      return routeCoordinates;
    }
    return fallbackRoute;
  }, [routeCoordinates, fallbackRoute]);

  useEffect(() => {
    if (!showLocationSearch) {
      setLocationSuggestions([]);
      setIsFetchingSuggestions(false);
      setPlacesSessionToken(null);
      return;
    }

    const presetAddress = showLocationSearch === 'pickup'
      ? pickupLocation?.address ?? ''
      : dropoffLocation?.address ?? '';

    if (presetAddress) {
      setLocationSearchText(presetAddress);
    }
    setLocationSuggestions([]);
    setPlacesSessionToken(createPlacesSessionToken());
  }, [showLocationSearch, pickupLocation?.address, dropoffLocation?.address, createPlacesSessionToken]);

  useEffect(() => {
    if (!pickupLocation || !dropoffLocation) {
      setRouteCoordinates([]);
      setRouteError(null);
      setIsFetchingRoute(false);
      setRouteDistanceKm(null);
      setRouteDurationMin(null);
      return;
    }

    if (!hasDirectionsKey) {
      setRouteCoordinates(fallbackRoute);
      setRouteError('missing-key');
      setIsFetchingRoute(false);
      computeFallbackMetrics();
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const fetchDirections = async () => {
      try {
        setIsFetchingRoute(true);

        const params = new URLSearchParams({
          origin: `${pickupLocation.latitude},${pickupLocation.longitude}`,
          destination: `${dropoffLocation.latitude},${dropoffLocation.longitude}`,
          mode: 'driving',
          alternatives: 'true', // Get multiple route options
          avoid: 'tolls', // Avoid toll roads for cost efficiency
          key: SANITIZED_GOOGLE_MAPS_API_KEY,
        });

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Directions request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'OK' && data.routes?.length) {
          // Find the shortest route by distance
          let shortestRoute = data.routes[0];
          let shortestDistance = data.routes[0]?.legs?.[0]?.distance?.value || Infinity;
          
          for (const route of data.routes) {
            const routeDistance = route?.legs?.[0]?.distance?.value || Infinity;
            if (routeDistance < shortestDistance) {
              shortestDistance = routeDistance;
              shortestRoute = route;
            }
          }

          const encoded = shortestRoute?.overview_polyline?.points ?? '';
          const decoded = decodePolyline(encoded);

          if (decoded.length > 0) {
            if (isActive) {
              setRouteCoordinates(decoded);
              setRouteError(null);
              setRouteDistanceKm(shortestDistance !== Infinity ? shortestDistance / 1000 : null);
              const durationSeconds = shortestRoute?.legs?.[0]?.duration?.value ?? null;
              setRouteDurationMin(
                durationSeconds != null ? Math.max(1, Math.round(durationSeconds / 60)) : null,
              );
              console.log(`Selected shortest route: ${(shortestDistance / 1000).toFixed(2)}km from ${data.routes.length} alternatives`);
            }
            return;
          }
        }

        if (isActive) {
          setRouteCoordinates(fallbackRoute);
          setRouteError(data.error_message || data.status || 'Unable to draw route');
          computeFallbackMetrics();
        }
      } catch (error: unknown) {
        if (!isActive || (error as any)?.name === 'AbortError') {
          return;
        }

        console.error('Directions fetch error:', error);

        if (isActive) {
          setRouteCoordinates(fallbackRoute);
          setRouteError((error as Error).message ?? 'Directions request failed');
          computeFallbackMetrics();
        }
      } finally {
        if (isActive) {
          setIsFetchingRoute(false);
        }
      }
    };

    fetchDirections();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [
    pickupLocation,
    dropoffLocation,
    hasDirectionsKey,
    fallbackRoute,
    computeFallbackMetrics,
  ]);

  useEffect(() => {
    if (!showLocationSearch) {
      return;
    }

    const query = locationSearchText.trim();

    if (query.length < 3) {
      setLocationSuggestions([]);
      setIsFetchingSuggestions(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const sessionToken = placesSessionToken ?? createPlacesSessionToken();
    if (!placesSessionToken) {
      setPlacesSessionToken(sessionToken);
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsFetchingSuggestions(true);

        if (hasDirectionsKey) {
          const params = new URLSearchParams({
            input: query,
            key: SANITIZED_GOOGLE_MAPS_API_KEY,
            sessiontoken: sessionToken,
          });

          if (currentLocation) {
            params.append(
              'locationbias',
              `point:${currentLocation.latitude},${currentLocation.longitude}`,
            );
          } else {
            // Default to Tunisia center if no current location
            params.append('locationbias', 'point:35.7664,10.8147');
          }
          
          // Restrict to Tunisia
          params.append('components', 'country:tn');

          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
            { signal: controller.signal },
          );

          if (!response.ok) {
            throw new Error(`Autocomplete failed with status ${response.status}`);
          }

          const data = await response.json();

          if (!isActive) {
            return;
          }

          if (data.status === 'OK' && Array.isArray(data.predictions)) {
            setLocationSuggestions(
              data.predictions.map((prediction: any) => ({
                id: prediction.place_id,
                placeId: prediction.place_id,
                description: prediction.description,
              })),
            );
          } else {
            setLocationSuggestions([]);
          }
        } else {
          const results = await locationService.geocode(query);

          if (!isActive) {
            return;
          }

          setLocationSuggestions(
            results.map((result, index) => ({
              id: `${result.latitude}-${result.longitude}-${index}`,
              description: result.address,
              location: result,
            })),
          );
        }
      } catch (error) {
        if (isActive) {
          console.error('Location suggestion error:', error);
          setLocationSuggestions([]);
        }
      } finally {
        if (isActive) {
          setIsFetchingSuggestions(false);
        }
      }
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    locationSearchText,
    showLocationSearch,
    hasDirectionsKey,
    currentLocation?.latitude,
    currentLocation?.longitude,
    placesSessionToken,
    createPlacesSessionToken,
  ]);

  const driverMarkers = React.useMemo(
    () =>
      nearbyDrivers
        .filter((driver) => driver.location)
        .slice(0, 8)
        .map((driver) => (
          <Marker
            key={driver.id}
            coordinate={driver.location!}
            title={driver.name}
            description={`${driver.vehicle.make} ${driver.vehicle.model} - ${driver.distance?.toFixed(1)}km away`}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMarkerContainer}>
              <Text style={styles.driverCarIcon}></Text>
            </View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}> {driver.name}</Text>
                <Text style={styles.calloutSubtitle}>
                  {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
                </Text>
                <Text style={styles.calloutSubtitle}>
                   Rating: {driver.rating} •  {driver.distance?.toFixed(1)}km away
                </Text>
                <Text style={styles.calloutSubtitle}>
                  ⏱ ETA: {driver.estimatedArrival} min
                </Text>
                <Text style={[styles.calloutSubtitle, { color: theme.colors.primary }]}>
                   Available Now
                </Text>
              </View>
            </Callout>
          </Marker>
        )),
    [nearbyDrivers, styles, theme.colors.primary],
  );

  const closeLocationSearch = useCallback((options?: { resetText?: boolean }) => {
    if (locationSearchCloseTimeout.current) {
      clearTimeout(locationSearchCloseTimeout.current);
      locationSearchCloseTimeout.current = null;
    }
    setShowLocationSearch(null);
    if (options?.resetText) {
      setLocationSearchText('');
    }
    setLocationSuggestions([]);
    setIsFetchingSuggestions(false);
    setPlacesSessionToken(null);
  }, []);

  const handleSuggestionSelect = useCallback(
    async (suggestion: LocationSuggestion) => {
      let resolvedLocation: RideLocation | null = null;

      try {
        if (suggestion.placeId && hasDirectionsKey) {
          const params = new URLSearchParams({
            place_id: suggestion.placeId,
            key: SANITIZED_GOOGLE_MAPS_API_KEY,
            fields: 'geometry/location,formatted_address,name',
          });

          if (placesSessionToken) {
            params.append('sessiontoken', placesSessionToken);
          }

          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
          );

          if (!response.ok) {
            throw new Error(`Place details failed with status ${response.status}`);
          }

          const data = await response.json();

          if (data.status === 'OK' && data.result?.geometry?.location) {
            resolvedLocation = {
              latitude: data.result.geometry.location.lat,
              longitude: data.result.geometry.location.lng,
              address: data.result.formatted_address ?? suggestion.description,
            };
          } else {
            throw new Error(data.error_message || data.status || 'Place details unavailable');
          }
        } else if (suggestion.location) {
          resolvedLocation = suggestion.location;
        } else if (suggestion.description) {
          const results = await locationService.geocode(suggestion.description);
          resolvedLocation = results[0] ?? null;
        }
      } catch (error) {
        console.error('Failed to resolve suggestion:', error);
        Alert.alert('Location Error', 'Unable to load the selected place. Please try another search.');
        return;
      }

      if (!resolvedLocation) {
        Alert.alert('Location Error', 'Unable to load the selected place. Please try another search.');
        return;
      }

      const clampedLatLng = clampLatLng(resolvedLocation.latitude, resolvedLocation.longitude);
      const outOfBounds =
        Math.abs(clampedLatLng.latitude - resolvedLocation.latitude) > 1e-5 ||
        Math.abs(clampedLatLng.longitude - resolvedLocation.longitude) > 1e-5;

      if (outOfBounds) {
        Alert.alert('Out of Service Area', 'Please choose a location within Tunisia.');
        return;
      }

      const sanitizedLocation: RideLocation = {
        ...resolvedLocation,
        latitude: clampedLatLng.latitude,
        longitude: clampedLatLng.longitude,
      };

      if (showLocationSearch === 'pickup') {
        setPickupLocation(sanitizedLocation);
      } else {
        setDropoffLocation(sanitizedLocation);
      }

      const displayAddress = sanitizedLocation.address ?? suggestion.description ?? '';
      setLocationSearchText(displayAddress);

      const targetRegion = clampRegion({
        latitude: sanitizedLocation.latitude,
        longitude: sanitizedLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      setRegion(targetRegion);
      mapRef.current?.animateToRegion(targetRegion, 750);

      closeLocationSearch();
    },
    [
      hasDirectionsKey,
      placesSessionToken,
      showLocationSearch,
      clampRegion,
      closeLocationSearch,
    ],
  );

  // Enhanced Payment Service Methods
  const selectPaymentMethod = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const processRidePayment = async (rideId: string, amount: number) => {
    try {
      // For cash payments, just return success
      if (selectedPaymentMethod === 'cash') {
        return { success: true, method: 'cash' };
      }
      
      // For card payments (when available)
      return await paymentService.processCardPayment({
        rideId,
        amount,
        cardToken: 'dummy-token', // Will be replaced with actual card token
      });
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  };

  useEffect(() => {
    initializeLocation();
    setupSocketListeners();
    
    return () => {
      cleanupSocketListeners();
    };
  }, []);

  useEffect(() => {
    if (currentLocation) {
      fetchNearbyDrivers();
    }
  }, [currentLocation]);

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      calculateEstimatedFare();
      setShowRideOptions(true);
    }
  }, [pickupLocation, dropoffLocation, rideType]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    const coordinates: LatLng[] = [];

    if (polylineCoordinates.length >= 2) {
      coordinates.push(...polylineCoordinates.map((coord) => clampLatLng(coord.latitude, coord.longitude)));
    } else {
      if (pickupLocation) {
        coordinates.push(clampLatLng(pickupLocation.latitude, pickupLocation.longitude));
      }

      if (dropoffLocation) {
        coordinates.push(clampLatLng(dropoffLocation.latitude, dropoffLocation.longitude));
      }
    }

    if (shouldShowDriverMarkers) {
      nearbyDrivers
        .filter((driver) => driver.location)
        .slice(0, 3)
        .forEach((driver) => {
          coordinates.push(clampLatLng(driver.location!.latitude, driver.location!.longitude));
        });
    }

    if (coordinates.length === 0) {
      return;
    }

    const signature = JSON.stringify(
      coordinates.map(({ latitude, longitude }) => [latitude.toFixed(5), longitude.toFixed(5)]),
    );

    if (mapBoundsSignatureRef.current === signature) {
      return;
    }

    mapBoundsSignatureRef.current = signature;

    if (coordinates.length === 1) {
      const targetRegion = clampRegion({
        latitude: coordinates[0].latitude,
        longitude: coordinates[0].longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      setRegion(targetRegion);
      mapRef.current.animateToRegion(targetRegion, 600);
      return;
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: spacing(12),
        right: spacing(12),
        bottom: spacing(18),
        left: spacing(12),
      },
      animated: true,
    });
  }, [
    mapReady,
    polylineCoordinates,
    pickupLocation,
    dropoffLocation,
    nearbyDrivers,
    shouldShowDriverMarkers,
    clampLatLng,
    clampRegion,
  ]);

  const initializeLocation = async () => {
    try {
      const hasPermission = await locationService.requestPermissions();
      setLocationPermission(hasPermission);
      
      if (hasPermission) {
        await getCurrentLocationFromService();
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to use the ride service.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => initializeLocation() },
          ]
        );
      }
    } catch (error) {
      console.error('Error initializing location:', error);
    }
  };

  const getCurrentLocationFromService = async () => {
    try {
      const position = await locationService.getCurrentPosition();
      
      if (position) {
        const location: RideLocation = {
          latitude: position.latitude,
          longitude: position.longitude,
        };
        
        // Get address for current location
        const address = await locationService.reverseGeocode(position.latitude, position.longitude);
        if (address) {
          location.address = address.address;
        }
        
        setCurrentLocation(location);
        setPickupLocation(location);
        
        // Update map region
        const newRegion = clampRegion({
          latitude: position.latitude,
          longitude: position.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
        setRegion(newRegion);
        
        // Animate to current location
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Could not get your current location. Please try again.');
    }
  };

  const fetchNearbyDrivers = async () => {
    if (!currentLocation) return;
    
    try {
      const drivers = await rideService.getNearbyDrivers(
        currentLocation.latitude,
        currentLocation.longitude,
        dropoffLocation?.latitude,
        dropoffLocation?.longitude,
        15 // Increased radius to 15km for better driver coverage
      );
      setNearbyDrivers(drivers);
    } catch (error) {
      console.error('Error fetching nearby drivers:', error);
    }
  };

  const calculateEstimatedFare = async () => {
    if (!pickupLocation || !dropoffLocation) return;
    
    try {
      const fare = await rideService.calculateFare(pickupLocation, dropoffLocation, rideType);
      setEstimatedFare(fare);
    } catch (error) {
      console.error('Error calculating fare:', error);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    console.log(' Setting up enhanced socket listeners for rider');
    
    // Use the enhanced socket context methods
    onRideUpdate(handleRideUpdate);
    onDriverLocation(handleDriverLocationUpdate);
    onRideAccepted(handleRideAccepted);
    onRideCancelled(handleRideCancelled);
    
    // Traditional socket listeners for compatibility
    socket.on('rideCompleted', handleRideCompleted);
    socket.on('driverAssigned', handleDriverAssigned);
    
    // Debug: Listen for any socket events
    socket.onAny((eventName, ...args) => {
      if (eventName.includes('ride') || eventName.includes('driver')) {
        console.log(` RIDER received event: ${eventName}`, args);
      }
    });
    
    console.log(' Rider socket listeners setup complete');
  };

  const cleanupSocketListeners = () => {
    if (!socket) return;

    socket.off('rideUpdate');
    socket.off('driverLocation');
    socket.off('rideAccepted');
    socket.off('rideCompleted');
  };

  const handleRideUpdate = (rideData: any) => {
    console.log('Ride update received:', rideData);
    
    if (rideData.status === 'ACCEPTED') {
      setIsSearchingDriver(false);
      setCurrentRide(rideData);
      Alert.alert('Ride Accepted!', 'Your driver is on the way.');
      (navigation as any).navigate('RideTracking', { ride: rideData });
    } else if (rideData.status === 'COMPLETED') {
      handleRideCompleted(rideData);
    }
  };

  const handleDriverLocationUpdate = (locationData: any) => {
    console.log(' Real-time driver location update:', locationData);
    
    // Update driver location in real-time for all nearby drivers
    setNearbyDrivers(prev => 
      prev.map(driver => {
        if (driver.id === locationData.driverId) {
          return { 
            ...driver, 
            location: {
              latitude: locationData.location.latitude,
              longitude: locationData.location.longitude,
            },
            // Update estimated arrival time based on current distance
            estimatedArrival: Math.ceil(locationData.distance || driver.distance || 5)
          };
        }
        return driver;
      })
    );
    
    // If we have an active ride, also update the specific driver for tracking
    if (currentRide && locationData.driverId === currentRide.driverId) {
      console.log(' Updating active ride driver location');
      // This could trigger a map center update or notification
    }
  };

  const handleRideAccepted = (rideData: any) => {
    setIsSearchingDriver(false);
    setCurrentRide(rideData);
    
    // Add haptic feedback for successful ride acceptance
    Platform.select({
      ios: () => require('react-native').Vibration.vibrate(),
      android: () => require('react-native').Vibration.vibrate(500),
    })?.();
    
    Alert.alert(
      ' Ride Accepted!', 
      ` Driver ${rideData.driver?.name || 'Unknown'} is on the way!\n ETA: ${rideData.driver?.estimatedArrival || '5-10'} minutes\n You can track your driver in real-time.`,
      [
        { text: 'Track Ride', onPress: () => (navigation as any).navigate('RideTracking', { ride: rideData }), style: 'default' },
        { text: 'OK', style: 'cancel' }
      ]
    );
  };

  const handleRideCompleted = async (rideData: any) => {
    setCurrentRide(null);
    setIsRequestingRide(false);
    
    console.log(' Ride completed! Processing payment...', rideData);
    
    try {
      // Process payment using the payment service
      const paymentAmount = rideData.actualFare || rideData.estimatedFare || estimatedFare;
      
      await processRidePayment(rideData.id, paymentAmount);
      
      console.log(' Payment processed successfully');
      
      // Navigate to receipt screen with rideId
      (navigation as any).navigate('RideReceipt', { rideId: rideData.id });
      
    } catch (error) {
      console.error(' Error processing payment:', error);
      Alert.alert(
        'Payment Error', 
        'There was an issue processing your payment. Please contact support.',
        [
          {
            text: 'OK',
            onPress: () => (navigation as any).navigate('RideReceipt', { rideId: rideData.id })
          }
        ]
      );
    }
  };

  const handleRideCancelled = (data: any) => {
    console.log(' Ride cancelled by driver/system:', data);
    setCurrentRide(null);
    setIsRequestingRide(false);
    setIsSearchingDriver(false);
    
    Alert.alert(
      'Ride Cancelled',
      data.reason || 'Your ride has been cancelled.',
      [{ text: 'OK' }]
    );
  };

  const handleDriverAssigned = (data: any) => {
    console.log('‍ Driver assigned:', data);
    setCurrentRide(data.ride);
    setIsSearchingDriver(false);
    
    Alert.alert(
      'Driver Found!',
      `${data.driver?.name || 'A driver'} has been assigned to your ride.`,
      [{ text: 'Track Ride', onPress: () => (navigation as any).navigate('RideTracking', { ride: data.ride }) }]
    );
  };

  const handleMapPress = async (event: any) => {
    const tapped = event.nativeEvent.coordinate;
    const coordinate = clampLatLng(tapped.latitude, tapped.longitude);
    
    try {
      const address = await locationService.reverseGeocode(coordinate.latitude, coordinate.longitude);
      if (address?.country && address.country !== 'Tunisia') {
        Alert.alert('Out of Service Area', 'Please choose a location within Tunisia.');
        return;
      }
      const location: RideLocation = {
        ...coordinate,
        address: address?.address || `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      };
      
      if (!pickupLocation) {
        setPickupLocation(location);
      } else {
        setDropoffLocation(location);
        if (location.address) {
          setLocationSearchText(location.address);
        }
      }
      closeLocationSearch();
    } catch (error) {
      console.error('Error handling map press:', error);
      closeLocationSearch();
    }
  };

  const requestRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Error', 'Please select both pickup and dropoff locations');
      return;
    }
    
    console.log('Current user:', user);
    console.log('User role:', user?.role);
    
    setIsRequestingRide(true);
    setIsSearchingDriver(true);
    
    try {
      const rideRequest = {
        pickupLocation,
        dropoffLocation,
        rideType,
        estimatedFare,
      };
      
      const ride = await rideService.requestRide(rideRequest);
      console.log(' Ride requested successfully:', ride);
      console.log(' Ride ID received:', ride?.id);
      setCurrentRide(ride);
      
      // Emit socket event for real-time driver matching
      emitRideRequest({
        rideId: ride.id,
        riderId: user?.id,
        pickupLocation,
        dropoffLocation,
        rideType,
        estimatedFare,
      });
      
    } catch (error) {
      console.error('Error requesting ride:', error);
      setIsRequestingRide(false);
      setIsSearchingDriver(false);
      Alert.alert('Error', 'Failed to request ride. Please try again.');
    }
  };

  const cancelRideRequest = async (rideId: string | number) => {
    try {
      console.log('Attempting to cancel ride with ID:', rideId);
      console.log('Current ride object:', currentRide);
      
      if (!rideId && rideId !== 0) {
        console.error('Cannot cancel: rideId is undefined');
        setCurrentRide(null);
        setIsRequestingRide(false);
        setIsSearchingDriver(false);
        return;
      }
      
      await rideService.cancelRide(rideId, 'User cancelled');
      
      // Emit socket event for real-time cancellation
      emitRideCancel(rideId, 'User cancelled');
      
      setCurrentRide(null);
      setIsRequestingRide(false);
      setIsSearchingDriver(false);
    } catch (error) {
      console.error('Error cancelling ride:', error);
    }
  };

  const clearRideOptions = () => {
    setShowRideOptions(false);
  };

  const searchLocation = async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) return;

    if (locationSuggestions.length > 0) {
      await handleSuggestionSelect(locationSuggestions[0]);
      return;
    }

    try {
      const results = await locationService.geocode(trimmed);
      // For simplicity, just take the first result
      if (results.length > 0) {
        const location = results[0];
        const clampedLatLng = clampLatLng(location.latitude, location.longitude);
        const outOfBounds =
          Math.abs(clampedLatLng.latitude - location.latitude) > 1e-5 ||
          Math.abs(clampedLatLng.longitude - location.longitude) > 1e-5;

        if (outOfBounds) {
          Alert.alert('Out of Service Area', 'Please choose a location within Tunisia.');
          return;
        }

        const sanitizedLocation: RideLocation = {
          ...location,
          latitude: clampedLatLng.latitude,
          longitude: clampedLatLng.longitude,
        };
        
        if (showLocationSearch === 'pickup') {
          setPickupLocation(sanitizedLocation);
        } else if (showLocationSearch === 'dropoff') {
          setDropoffLocation(sanitizedLocation);
        }

        const displayAddress = sanitizedLocation.address ?? location.address ?? '';
        if (displayAddress) {
          setLocationSearchText(displayAddress);
        }
        
        // Animate map to new location
        const targetRegion = clampRegion({
          latitude: sanitizedLocation.latitude,
          longitude: sanitizedLocation.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
        setRegion(targetRegion);
        mapRef.current?.animateToRegion(targetRegion, 750);
        
        closeLocationSearch();
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const navigateTo = (route: string) => {
    (navigation as any).navigate(route);
  };

  useEffect(() => {
    if (__DEV__ && !hasDirectionsKey) {
      console.warn(
        'Google Directions API key not found. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY in .env to show turn-by-turn routing.',
      );
    }
  }, [hasDirectionsKey]);

  const getRideTypeText = (type: string) => {
    switch (type) {
      case 'premium': return '(Premium rates)';
      default: return '(Standard rates)';
    }
  };

  if (!locationPermission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Requesting location permissions...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChange}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsIndoorLevelPicker={false}
        showsTraffic={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
    loadingEnabled
  onMapReady={() => setMapReady(true)}
  mapType="standard"
      >
        {/* Pickup Location Marker */}
        {pickupLocation && (
          <Marker
            coordinate={pickupLocation}
            title="Pickup Location"
            description={pickupLocation.address || 'Pickup point'}
            pinColor={theme.colors.primary}
          />
        )}

        {/* Dropoff Location Marker */}
        {dropoffLocation && (
          <Marker
            coordinate={dropoffLocation}
            title="Dropoff Location"
            description={dropoffLocation.address || 'Destination'}
            pinColor={theme.colors.error}
          />
        )}

        {/* Route polyline or directions */}
        {pickupLocation && dropoffLocation && polylineCoordinates.length >= 2 && (
          <Polyline
            coordinates={polylineCoordinates}
            strokeColor={theme.colors.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
            geodesic
          />
        )}

  {/* Driver Markers */}
  {shouldShowDriverMarkers ? driverMarkers : null}
      </MapView>

      {/* Header Overlay */}
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.headerBar}>
          <View style={styles.headerSearchBar}>
            <IconButton 
              icon="magnify" 
              size={14} 
              iconColor={theme.colors.onSurfaceVariant}
              style={styles.searchIcon}
            />
            <TextInput
              mode="flat"
              dense
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              style={styles.headerSearchInput}
              contentStyle={styles.headerInputContent}
              placeholder={dropoffLocation?.address || 'Where to?'}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={locationSearchText}
              onChangeText={setLocationSearchText}
              onFocus={() => {
                if (locationSearchCloseTimeout.current) {
                  clearTimeout(locationSearchCloseTimeout.current);
                  locationSearchCloseTimeout.current = null;
                }
                setShowLocationSearch('dropoff');
              }}
              onBlur={() => {
                // Keep modal open briefly for suggestion selection
                locationSearchCloseTimeout.current = setTimeout(() => {
                  closeLocationSearch();
                  locationSearchCloseTimeout.current = null;
                }, 200);
              }}
              returnKeyType="search"
              onSubmitEditing={() => searchLocation(locationSearchText)}
            />
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.8}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            onPress={() => navigateTo('Profile')}
          >
            {user?.profilePicture ? (
              <Avatar.Image
                size={32}
                source={{ uri: user.profilePicture }}
                style={styles.profileAvatar}
              />
            ) : (
              <Avatar.Text
                size={32}
                label={profileInitials}
                style={styles.profileAvatar}
                color={theme.colors.onPrimary}
              />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Ride Type Selection - Optimized Bottom Sheet */}
      {pickupLocation && dropoffLocation && showRideOptions && (
        <Surface style={styles.rideOptionsContainer}>
          <View style={styles.rideOptionsHeader}>
            <Text variant="titleMedium" style={styles.rideOptionsTitle}>
              Ride Options
            </Text>
            <IconButton
              icon="close"
              size={20}
              onPress={clearRideOptions}
              style={styles.closeButton}
            />
          </View>
          
          {/* Ride Type and Fare in single row */}
          <View style={styles.rideInfoRow}>
            <View style={styles.rideTypeContainer}>
              <Chip
                selected={rideType === 'standard'}
                onPress={() => setRideType('standard')}
                style={styles.rideTypeChip}
              >
                Standard
              </Chip>
              <Chip
                selected={rideType === 'premium'}
                onPress={() => setRideType('premium')}
                style={styles.rideTypeChip}
              >
                Premium
              </Chip>
            </View>
            
            {estimatedFare > 0 && (
              <View style={styles.fareQuickInfo}>
                <Text style={styles.fareAmount}>{estimatedFare.toFixed(3)} TND</Text>
                <View style={styles.tripMetrics}>
                  {routeDistanceKm != null && (
                    <Text style={styles.fareEta}>{routeDistanceKm.toFixed(1)} km</Text>
                  )}
                  {routeDurationMin != null && (
                    <Text style={styles.fareEta}>{routeDurationMin} min</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Payment Method - Compact */}
          <View style={styles.paymentMethodCompact}>
            <Text style={styles.paymentLabel}>Payment</Text>
            <View style={styles.paymentOptions}>
              {availablePaymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentOption,
                    selectedPaymentMethod === method.id && styles.paymentOptionSelected,
                    method.disabled && styles.paymentOptionDisabled,
                  ]}
                  onPress={() => !method.disabled && selectPaymentMethod(method.id)}
                  disabled={method.disabled}
                >
                  <Text style={[
                    styles.paymentOptionText,
                    selectedPaymentMethod === method.id && styles.paymentOptionTextSelected,
                    method.disabled && styles.paymentOptionTextDisabled,
                  ]}>
                    {method.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Real-time Status Indicator */}
          <View style={styles.statusIndicator}>
            <Text style={styles.statusText}>
               {nearbyDrivers.length} drivers nearby •  Real-time tracking
            </Text>
            {isConnected ? (
              <Text style={[styles.connectionStatus, { color: theme.colors.primary }]}>
                🟢 Connected
              </Text>
            ) : (
              <Text style={[styles.connectionStatus, { color: theme.colors.error }]}>
                 Connecting...
              </Text>
            )}
          </View>

          {/* Debug Test Button - Remove in production */}
          {__DEV__ && (
            <Button
              mode="outlined"
              onPress={() => {
                console.log(' DEBUG: Manually triggering ride request notification test');
                console.log(' DEBUG: Current user:', user);
                console.log(' DEBUG: Socket connected:', isConnected);
                console.log(' DEBUG: Socket object:', !!socket);
                
                if (socket && isConnected) {
                  const testRideData = {
                    rideId: 'test-' + Date.now(),
                    riderId: user?.id,
                    pickupLocation: {
                      latitude: 35.7714,
                      longitude: 10.8269,
                      address: 'Monastir Marina (Test)'
                    },
                    dropoffLocation: {
                      latitude: 35.7811,
                      longitude: 10.8167,
                      address: 'ISIMM (Test)'
                    },
                    rideType: 'standard',
                    estimatedFare: 5.5,
                    estimatedDistance: 1.2
                  };
                  
                  console.log(' Sending test ride request:', testRideData);
                  emitRideRequest(testRideData);
                  
                  console.log(' Test ride request sent to nearby drivers');
                } else {
                  console.log(' Socket not connected for test');
                }
              }}
              style={{ margin: spacing(1) }}
              compact
            >
               Test Driver Notification
            </Button>
          )}

          {/* Request Button - Moved up */}
          <Button
            mode="contained"
            onPress={requestRide}
            loading={isRequestingRide}
            disabled={isRequestingRide}
            style={styles.requestButton}
            buttonColor={theme.colors.primary}
          >
            {isRequestingRide ? 'Requesting...' : 'Request Ride'}
          </Button>
        </Surface>
      )}

      {/* My Location FAB - Dynamic positioning */}
      <FAB
        icon="crosshairs-gps"
        style={[
          styles.locationFab,
          showRideOptions && styles.locationFabWithPanel
        ]}
        onPress={getCurrentLocationFromService}
        size={showRideOptions ? "small" : "small"}
      />

      {/* Location Search Suggestions */}
      <Portal>
        {showLocationSearch && locationSearchText.trim().length >= 3 && (
          <View pointerEvents="box-none" style={styles.suggestionsOverlay}>
            <Surface style={styles.suggestionsDropdown} elevation={4}>
              {isFetchingSuggestions && (
                <ActivityIndicator size="small" style={styles.suggestionsLoading} />
              )}
              <FlatList
                data={locationSuggestions}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <List.Item
                    title={item.description}
                    onPress={() => handleSuggestionSelect(item)}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={showLocationSearch === 'pickup' ? 'map-marker' : 'map-marker-outline'}
                      />
                    )}
                  />
                )}
                ItemSeparatorComponent={() => <View style={styles.suggestionSeparator} />}
                ListEmptyComponent={
                  !isFetchingSuggestions ? (
                    <Text style={styles.noSuggestionsText}>
                      No matches found. Try a different search term.
                    </Text>
                  ) : null
                }
                style={styles.suggestionsList}
                contentContainerStyle={
                  locationSuggestions.length === 0 && !isFetchingSuggestions
                    ? styles.emptySuggestionsContent
                    : undefined
                }
              />
            </Surface>
          </View>
        )}
      </Portal>

      {/* Searching Driver Modal */}
      <Portal>
        <Modal
          visible={isSearchingDriver}
          dismissable={true}
          onDismiss={() => {
            setIsSearchingDriver(false);
            setIsRequestingRide(false);
          }}
          contentContainerStyle={styles.searchingModal}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.searchingText}>Searching for driver...</Text>
          <Text style={styles.searchingSubtext}>
            We're finding the best driver for your trip
          </Text>
          <Button
            mode="outlined"
            onPress={() => {
              if (currentRide?.id) {
                cancelRideRequest(currentRide.id);
              } else {
                setIsSearchingDriver(false);
                setIsRequestingRide(false);
              }
            }}
            style={styles.cancelButton}
            textColor={theme.colors.error}
          >
            Cancel Request
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: spacing(3),
    },
    loadingText: {
      marginTop: spacing(2),
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    map: {
      flex: 1,
    },
    
    headerSafeArea: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: spacing(1.5),
      paddingTop: spacing(0.15),
      paddingBottom: spacing(0.15),
      zIndex: 30,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(1),
      minHeight: 40,
    },
    headerSearchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: radii.md,
      paddingHorizontal: spacing(0.5),
      paddingVertical: spacing(0.1),
      minHeight: 32,
    },
    searchIcon: {
      margin: 0,
    },
    headerSearchInput: {
      flex: 1,
      fontSize: 12.5,
      color: theme.colors.onSurface,
      marginLeft: spacing(0.5),
      backgroundColor: 'transparent',
      paddingVertical: 0,
    },
    headerInputContent: {
      paddingVertical: 0,
      marginVertical: 0,
    },
    profileButton: {
      borderRadius: radii.pill,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceVariant,
      padding: spacing(0.25),
    },
    profileAvatar: {
      backgroundColor: theme.colors.primary,
    },
    // Ride Options Bottom Sheet - Optimized
    rideOptionsContainer: {
      position: 'absolute',
      bottom: 0, // Back to bottom to start where phone navigation ends
      left: 0,
      right: 0,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      padding: spacing(2.5),
      paddingBottom: spacing(4), // Extra bottom padding for phone navigation area
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderColor: theme.colors.outline,
      elevation: 12,
      shadowColor: theme.colors.onSurface,
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -4 },
    },
    rideOptionsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(1.5), // Reduced margin
    },
    rideOptionsTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      fontSize: 16, // Slightly smaller
    },
    closeButton: {
      margin: 0,
    },
    rideTypeContainer: {
      flexDirection: 'row',
      gap: spacing(1),
    },
    rideTypeChip: {
      marginRight: spacing(1),
    },
    fareContainer: {
      marginBottom: spacing(2),
      paddingVertical: spacing(2),
      paddingHorizontal: spacing(2),
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    fareRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fareLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    fareAmount: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    fareSubtext: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing(0.5),
    },
    fareMetricsText: {
      fontSize: 12,
      color: theme.colors.onSurface,
      marginTop: spacing(0.5),
      fontWeight: '500',
    },
    requestButton: {
      marginTop: spacing(2),
      marginBottom: spacing(1), // Extra margin for phone navigation area
      borderRadius: radii.md,
    },

    // FAB Buttons
    locationFab: {
      position: 'absolute',
      bottom: spacing(25), // Default position when no ride options
      right: spacing(2),
      backgroundColor: theme.colors.primary,
    },
    locationFabWithPanel: {
      bottom: '50%', // Position in middle of screen vertically
      marginBottom: spacing(-3), // Center it properly
      right: spacing(2), // Keep on right side
      top: 'auto', // Remove top positioning
    },
    testNotificationFab: {
      position: 'absolute',
      bottom: spacing(18),
      right: spacing(2),
      backgroundColor: theme.colors.secondary,
    },

    // Callout Styles
    calloutContainer: {
      minWidth: 160,
      paddingRight: spacing(1),
    },
    calloutTitle: {
      fontWeight: '600',
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    calloutSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },

    // Search Suggestions Dropdown
    suggestionsOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: Platform.OS === 'ios' ? spacing(10.5) : spacing(9.5),
      paddingHorizontal: spacing(1.5),
    },
    suggestionsDropdown: {
      backgroundColor: theme.colors.surface,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
      maxHeight: Dimensions.get('window').height * 0.45,
      overflow: 'hidden',
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
      marginTop: spacing(0.5),
    },
    suggestionsLoading: {
      paddingVertical: spacing(1),
    },
    suggestionsList: {
      backgroundColor: theme.colors.surface,
    },
    suggestionSeparator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outlineVariant,
      marginLeft: spacing(2.5),
    },
    noSuggestionsText: {
      paddingVertical: spacing(1.5),
      paddingHorizontal: spacing(2),
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      textAlign: 'center',
    },
    emptySuggestionsContent: {
      paddingVertical: spacing(2),
    },

    // Searching Modal
    searchingModal: {
      backgroundColor: theme.colors.surface,
      padding: spacing(4),
      margin: spacing(4),
      borderRadius: radii.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    searchingText: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: spacing(2),
      textAlign: 'center',
      color: theme.colors.onSurface,
    },
    searchingSubtext: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing(1),
      textAlign: 'center',
    },
    cancelButton: {
      marginTop: spacing(2),
      borderRadius: radii.md,
      borderColor: theme.colors.error,
    },

    // New optimized ride options styles
    rideInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(2),
    },
    fareQuickInfo: {
      alignItems: 'flex-end',
    },
    tripMetrics: {
      flexDirection: 'row',
      gap: spacing(1),
      marginTop: spacing(0.25),
    },
    fareEta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    paymentMethodCompact: {
      marginBottom: spacing(2),
    },
    paymentLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: spacing(1),
    },
    paymentOptions: {
      flexDirection: 'row',
      gap: spacing(1),
    },
    paymentOption: {
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    paymentOptionSelected: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    paymentOptionDisabled: {
      opacity: 0.5,
    },
    paymentOptionText: {
      fontSize: 12,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    paymentOptionTextSelected: {
      color: theme.colors.onPrimaryContainer,
    },
    paymentOptionTextDisabled: {
      color: theme.colors.onSurfaceVariant,
    },
    driverMarkerContainer: {
      backgroundColor: theme.colors.primary,
      padding: spacing(1),
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
      shadowColor: theme.colors.onSurface,
      shadowOpacity: 0.3,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    driverCarIcon: {
      fontSize: 18,
      color: theme.colors.onPrimary,
    },
    statusIndicator: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing(1.5),
      paddingHorizontal: spacing(2),
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: radii.md,
      marginBottom: spacing(2),
    },
    statusText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    connectionStatus: {
      fontSize: 11,
      fontWeight: '600',
    },
  });

export default HomeScreen;