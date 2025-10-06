import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Text,
  FAB,
  Portal,
  Modal,
  TextInput,
  ActivityIndicator,
  Chip,
  IconButton,
  Surface,
  useTheme,
} from 'react-native-paper';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNavigation } from '@react-navigation/native';
import { 
  locationService,
  rideService,
  paymentService,
  notificationService,
  type RideLocation,
  type Driver,
  type Ride,
} from '../../services';
import { spacing, radii } from '../../theme';

const { width, height } = Dimensions.get('window');

const LATITUDE_DELTA = 0.005;
const LONGITUDE_DELTA = LATITUDE_DELTA * (width / height);

// Payment Method Selector Component
const PaymentMethodSelector: React.FC<{
  selectedMethod: string;
  availableMethods: Array<{ id: string; name: string; icon: string; disabled?: boolean }>;
  onMethodSelect: (methodId: string) => void;
  showTitle?: boolean;
}> = ({ selectedMethod, availableMethods, onMethodSelect, showTitle = true }) => {
  const theme = useTheme();
  
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
        >
          {method.name}
        </Button>
      ))}
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    socket,
    onRideUpdate,
    onDriverLocation,
    onRideAccepted,
    onRideCancelled,
    emitRideRequest,
    emitRideCancel,
  } = useSocket();

  // Location and Map State
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<RideLocation | null>(null);
  const [pickupLocation, setPickupLocation] = useState<RideLocation | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<RideLocation | null>(null);
  const [region, setRegion] = useState({
    latitude: 35.7664,
    longitude: 10.8147,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

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

  // Payment State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash');
  const [availablePaymentMethods] = useState([
    { id: 'cash', name: 'Cash on Delivery', icon: 'cash' },
    { id: 'card', name: 'Card (Coming Soon)', icon: 'credit-card', disabled: true },
  ]);

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

  const sendTestNotification = async (title: string, body: string) => {
    try {
      return await notificationService.sendTestNotification(title, body);
    } catch (error) {
      console.error('Notification error:', error);
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
        const newRegion = {
          ...position,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
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
        dropoffLocation?.longitude
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

    console.log('🔧 Setting up enhanced socket listeners for rider');
    
    // Use the enhanced socket context methods
    onRideUpdate(handleRideUpdate);
    onDriverLocation(handleDriverLocationUpdate);
    onRideAccepted(handleRideAccepted);
    onRideCancelled(handleRideCancelled);
    
    // Traditional socket listeners for compatibility
    socket.on('rideCompleted', handleRideCompleted);
    socket.on('driverAssigned', handleDriverAssigned);
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
    console.log('Driver location update:', locationData);
    
    // Update driver location on map if we have an active ride
    if (currentRide && locationData.driverId === currentRide.driverId) {
      // Update driver marker position
      setNearbyDrivers(prev => 
        prev.map(driver => 
          driver.id === locationData.driverId 
            ? { ...driver, location: locationData.location }
            : driver
        )
      );
    }
  };

  const handleRideAccepted = (rideData: any) => {
    setIsSearchingDriver(false);
    setCurrentRide(rideData);
    Alert.alert(
      'Ride Accepted!', 
      `Driver ${rideData.driver?.name || 'Unknown'} is on the way.`,
      [{ text: 'OK', onPress: () => (navigation as any).navigate('RideTracking', { ride: rideData }) }]
    );
  };

  const handleRideCompleted = async (rideData: any) => {
    setCurrentRide(null);
    setIsRequestingRide(false);
    
    console.log('🎉 Ride completed! Processing payment...', rideData);
    
    try {
      // Process payment using the payment service
      const paymentAmount = rideData.actualFare || rideData.estimatedFare || estimatedFare;
      
      await processRidePayment(rideData.id, paymentAmount);
      
      console.log('✅ Payment processed successfully');
      
      // Navigate to receipt screen with rideId
      (navigation as any).navigate('RideReceipt', { rideId: rideData.id });
      
    } catch (error) {
      console.error('❌ Error processing payment:', error);
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
    console.log('🚫 Ride cancelled by driver/system:', data);
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
    console.log('👨‍✈️ Driver assigned:', data);
    setCurrentRide(data.ride);
    setIsSearchingDriver(false);
    
    Alert.alert(
      'Driver Found!',
      `${data.driver?.name || 'A driver'} has been assigned to your ride.`,
      [{ text: 'Track Ride', onPress: () => (navigation as any).navigate('RideTracking', { ride: data.ride }) }]
    );
  };

  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    
    try {
      const address = await locationService.reverseGeocode(coordinate.latitude, coordinate.longitude);
      const location: RideLocation = {
        ...coordinate,
        address: address?.address || `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      };
      
      if (!pickupLocation) {
        setPickupLocation(location);
      } else if (!dropoffLocation) {
        setDropoffLocation(location);
      } else {
        // Reset and set new pickup
        setPickupLocation(location);
        setDropoffLocation(null);
      }
    } catch (error) {
      console.error('Error handling map press:', error);
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
      console.log('✅ Ride requested successfully:', ride);
      console.log('🔍 Ride ID received:', ride?.id);
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

  // 🔔 Test notification function
  const testNotifications = async () => {
    try {
      if (user?.role === 'rider') {
        await sendTestNotification(
          '🚗 Driver Found!', 
          'Ahmed Ben Salem has accepted your ride request.'
        );
      } else {
        await sendTestNotification(
          '📱 New Ride Request!', 
          'Pickup: Khniss, Monastir - 8.50 TND'
        );
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const searchLocation = async (query: string) => {
    if (query.length < 3) return;
    
    try {
      const results = await locationService.geocode(query);
      // For simplicity, just take the first result
      if (results.length > 0) {
        const location = results[0];
        
        if (showLocationSearch === 'pickup') {
          setPickupLocation(location);
        } else if (showLocationSearch === 'dropoff') {
          setDropoffLocation(location);
        }
        
        // Animate map to new location
        mapRef.current?.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }, 1000);
        
        setShowLocationSearch(null);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const getRideTypeText = (type: string) => {
    switch (type) {
      case 'premium': return '(Premium rates)';
      default: return '(Standard rates)';
    }
  };

  if (!locationPermission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
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
        region={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="You are here"
            pinColor="blue"
          />
        )}

        {/* Pickup Location Marker */}
        {pickupLocation && (
          <Marker
            coordinate={pickupLocation}
            title="Pickup Location"
            description={pickupLocation.address || 'Pickup point'}
            pinColor="green"
          />
        )}

        {/* Dropoff Location Marker */}
        {dropoffLocation && (
          <Marker
            coordinate={dropoffLocation}
            title="Dropoff Location"
            description={dropoffLocation.address || 'Destination'}
            pinColor="red"
          />
        )}

        {/* Driver Markers */}
        {nearbyDrivers.map((driver) => (
          <Marker
            key={driver.id}
            coordinate={driver.location}
            title={driver.name}
            description={`${driver.vehicle.make} ${driver.vehicle.model} - ${driver.distance?.toFixed(1)}km away`}
            pinColor="orange"
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{driver.name}</Text>
                <Text style={styles.calloutSubtitle}>
                  {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
                </Text>
                <Text style={styles.calloutSubtitle}>
                  Rating: {driver.rating} ⭐ {driver.distance?.toFixed(1)}km away
                </Text>
                <Text style={styles.calloutSubtitle}>
                  ETA: {driver.estimatedArrival} min
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Location Selection - Bolt Style */}
      <Surface elevation={1} style={styles.locationContainer}>
        <View style={styles.locationPanel}>
          <View style={styles.locationHeader}>
            <Text variant="titleSmall" style={styles.locationTitle}>
              Where to?
            </Text>
          </View>
          
          <View style={styles.locationInputs}>
            {/* Pickup Input */}
            <View style={styles.locationInputRow}>
              <View style={styles.locationIndicator}>
                <View style={styles.pickupDot} />
              </View>
              <Button
                mode="text"
                onPress={() => setShowLocationSearch('pickup')}
                style={styles.locationButton}
                contentStyle={styles.locationButtonContent}
                labelStyle={styles.locationButtonText}
              >
                {pickupLocation?.address || 'Current location'}
              </Button>
            </View>

            {/* Connector Line */}
            <View style={styles.locationConnector}>
              <View style={styles.connectorLine} />
            </View>

            {/* Dropoff Input */}
            <View style={styles.locationInputRow}>
              <View style={styles.locationIndicator}>
                <View style={styles.dropoffDot} />
              </View>
              <Button
                mode="text"
                onPress={() => setShowLocationSearch('dropoff')}
                style={styles.locationButton}
                contentStyle={styles.locationButtonContent}
                labelStyle={[
                  styles.locationButtonText,
                  !dropoffLocation && styles.locationButtonPlaceholder
                ]}
              >
                {dropoffLocation?.address || 'Where to?'}
              </Button>
            </View>
          </View>
        </View>
      </Surface>

      {/* Ride Type Selection - Bolt Style Bottom Sheet */}
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
          
          <View style={styles.rideTypeContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
            </ScrollView>
          </View>

          {estimatedFare > 0 && (
            <View style={styles.fareContainer}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Estimated Fare</Text>
                <Text style={styles.fareAmount}>{estimatedFare.toFixed(3)} TND</Text>
              </View>
              <Text style={styles.fareSubtext}>
                Includes: Base fare + Distance rate {getRideTypeText(rideType)}
              </Text>
            </View>
          )}

          {/* Payment Method Selection - Bolt Style */}
          <PaymentMethodSelector
            selectedMethod={selectedPaymentMethod}
            availableMethods={availablePaymentMethods}
            onMethodSelect={selectPaymentMethod}
            showTitle={true}
          />

          <Button
            mode="contained"
            onPress={requestRide}
            loading={isRequestingRide}
            disabled={isRequestingRide}
            style={styles.requestButton}
          >
            {isRequestingRide ? 'Requesting Ride...' : 'Request Ride'}
          </Button>
        </Surface>
      )}

      {/* My Location FAB */}
      <FAB
        icon="crosshairs-gps"
        style={styles.locationFab}
        onPress={getCurrentLocationFromService}
        size="small"
      />

      {/* Test Notification FAB - Development Only */}
      {__DEV__ && (
        <FAB
          icon="bell-ring"
          style={styles.testNotificationFab}
          onPress={testNotifications}
          size="small"
        />
      )}

      {/* Location Search Modal */}
      <Portal>
        <Modal
          visible={!!showLocationSearch}
          onDismiss={() => setShowLocationSearch(null)}
          contentContainerStyle={styles.searchModal}
        >
          <Text style={styles.searchTitle}>
            Search {showLocationSearch === 'pickup' ? 'Pickup' : 'Destination'} Location
          </Text>
          <TextInput
            mode="outlined"
            label="Enter address or place name"
            value={locationSearchText}
            onChangeText={setLocationSearchText}
            onSubmitEditing={() => searchLocation(locationSearchText)}
            style={styles.searchInput}
            autoFocus
          />
          <View style={styles.searchButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowLocationSearch(null)}
              style={styles.searchButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => searchLocation(locationSearchText)}
              style={styles.searchButton}
            >
              Search
            </Button>
          </View>
        </Modal>
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
          >
            Cancel Request
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) =>
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
    
    // Location Container - Bolt Style
    locationContainer: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 20,
      left: spacing(2),
      right: spacing(2),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
      shadowColor: theme.colors.onSurface,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    locationPanel: {
      padding: spacing(2),
    },
    locationHeader: {
      marginBottom: spacing(1.5),
    },
    locationTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      fontSize: 16,
    },
    locationInputs: {
      // Container for pickup and dropoff inputs
    },
    locationInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing(1),
    },
    locationIndicator: {
      width: 24,
      alignItems: 'center',
      marginRight: spacing(1.5),
    },
    pickupDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    dropoffDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.error,
    },
    locationConnector: {
      alignItems: 'center',
      paddingVertical: spacing(0.5),
    },
    connectorLine: {
      width: 2,
      height: 16,
      backgroundColor: theme.colors.outlineVariant,
    },
    locationButton: {
      flex: 1,
      borderRadius: radii.md,
    },
    locationButtonContent: {
      justifyContent: 'flex-start',
      paddingHorizontal: spacing(1),
      paddingVertical: spacing(1),
    },
    locationButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      textAlign: 'left',
    },
    locationButtonPlaceholder: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '400',
    },

    // Ride Options Bottom Sheet - Bolt Style
    rideOptionsContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      padding: spacing(3),
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
      marginBottom: spacing(2),
    },
    rideOptionsTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      fontSize: 18,
    },
    closeButton: {
      margin: 0,
    },
    rideTypeContainer: {
      marginBottom: spacing(2),
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
    requestButton: {
      marginTop: spacing(2),
      borderRadius: radii.md,
      backgroundColor: theme.colors.primary,
    },

    // FAB Buttons
    locationFab: {
      position: 'absolute',
      bottom: spacing(25),
      right: spacing(2),
      backgroundColor: theme.colors.primary,
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

    // Search Modal
    searchModal: {
      backgroundColor: theme.colors.surface,
      padding: spacing(3),
      margin: spacing(3),
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    searchTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: spacing(2),
      color: theme.colors.onSurface,
    },
    searchInput: {
      marginBottom: spacing(2),
    },
    searchButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    searchButton: {
      flex: 1,
      marginHorizontal: spacing(0.5),
      borderRadius: radii.md,
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
    },
  });

export default HomeScreen;