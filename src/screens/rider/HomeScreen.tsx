import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions, ScrollView } from 'react-native';
import { 
  Surface, 
  Card, 
  Button, 
  Text, 
  Portal, 
  Modal, 
  ActivityIndicator,
  FAB,
  Chip,
  IconButton,
  TextInput
} from 'react-native-paper';
import MapView, { Marker, Region, Callout } from 'react-native-maps';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import { usePayment } from '../../contexts/PaymentContext';
import { rideService, locationService } from '../../services';
import PaymentMethodSelector from '../../components/PaymentMethodSelector';
import type { Driver, RideLocation, Ride } from '../../services';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { sendTestNotification } = useNotification();
  const { 
    selectedPaymentMethod,
    availablePaymentMethods,
    selectPaymentMethod,
    processRidePayment,
    isProcessingPayment
  } = usePayment();
  const { 
    socket, 
    isConnected, 
    onRideUpdate, 
    onDriverLocation, 
    onIncomingRide, 
    onRideAccepted, 
    onRideCancelled,
    joinRoom,
    emitRideRequest,
    emitRideCancel
  } = useSocket();
  
  // Map state
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  
  // Location state
  const [currentLocation, setCurrentLocation] = useState<RideLocation | null>(null);
  const [pickupLocation, setPickupLocation] = useState<RideLocation | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<RideLocation | null>(null);
  
  // Drivers state
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  
  // Ride state
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [estimatedFare, setEstimatedFare] = useState<number>(0);
  const [rideType, setRideType] = useState<'standard' | 'premium' | 'shared'>('standard');
  
  // UI state
  const [isRequestingRide, setIsRequestingRide] = useState(false);
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState<'pickup' | 'dropoff' | null>(null);
  const [locationSearchText, setLocationSearchText] = useState('');
  
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      fetchNearbyDrivers();
    }
  }, [currentLocation]);

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      calculateEstimatedFare();
    }
  }, [pickupLocation, dropoffLocation, rideType]);

  useEffect(() => {
    if (socket && isConnected) {
      setupSocketListeners();
      return () => {
        cleanupSocketListeners();
      };
    }
  }, [socket, isConnected]);

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
      navigation.navigate('RideTracking', { ride: rideData });
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
      [{ text: 'OK', onPress: () => navigation.navigate('RideTracking', { ride: rideData }) }]
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
      navigation.navigate('RideReceipt', { rideId: rideData.id });
      
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      Alert.alert(
        'Payment Error', 
        'There was an issue processing your payment. Please contact support.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('RideReceipt', { rideId: rideData.id })
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
      [{ text: 'Track Ride', onPress: () => navigation.navigate('RideTracking', { ride: data.ride }) }]
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

  const clearLocations = () => {
    setPickupLocation(currentLocation);
    setDropoffLocation(null);
    setEstimatedFare(0);
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
      case 'shared': return '(Shared discount)';
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
    <View style={styles.container}>
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
                  Rating: {driver.rating}  {driver.distance?.toFixed(1)}km away
                </Text>
                <Text style={styles.calloutSubtitle}>
                  ETA: {driver.estimatedArrival} min
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Location Cards */}
      <Surface style={styles.locationContainer}>
        {/* Pickup Location */}
        <Card style={styles.locationCard}>
          <Card.Content style={styles.locationCardContent}>
            <View style={styles.locationRow}>
              <View style={styles.locationDot} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {pickupLocation?.address || 'Select pickup location'}
                </Text>
              </View>
              <IconButton
                icon="map-marker-plus"
                size={20}
                onPress={() => setShowLocationSearch('pickup')}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Dropoff Location */}
        <Card style={styles.locationCard}>
          <Card.Content style={styles.locationCardContent}>
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: '#f44336' }]} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Dropoff</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {dropoffLocation?.address || 'Select destination'}
                </Text>
              </View>
              <IconButton
                icon="map-marker-plus"
                size={20}
                onPress={() => setShowLocationSearch('dropoff')}
              />
            </View>
          </Card.Content>
        </Card>
      </Surface>

      {/* Ride Type Selection */}
      {pickupLocation && dropoffLocation && (
        <Surface style={styles.rideOptionsContainer}>
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
              <Chip
                selected={rideType === 'shared'}
                onPress={() => setRideType('shared')}
                style={styles.rideTypeChip}
              >
                Shared
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

          {/* Payment Method Selection */}
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

      {/* Clear Locations FAB */}
      <FAB
        icon="refresh"
        style={styles.clearFab}
        onPress={clearLocations}
        size="small"
      />

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
          dismissable={false}
          contentContainerStyle={styles.searchingModal}
        >
          <ActivityIndicator size="large" />
          <Text style={styles.searchingText}>Searching for driver...</Text>
          <Text style={styles.searchingSubtext}>
            We're finding the best driver for your trip
          </Text>
          {currentRide && (
            <Button
              mode="outlined"
              onPress={() => cancelRideRequest(currentRide?.id)}
              style={styles.cancelButton}
            >
              Cancel Request
            </Button>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  locationContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    elevation: 4,
  },
  locationCard: {
    marginBottom: 8,
  },
  locationCardContent: {
    paddingVertical: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4caf50',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rideOptionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    elevation: 8,
  },
  rideTypeContainer: {
    marginBottom: 16,
  },
  rideTypeChip: {
    marginRight: 8,
  },
  fareContainer: {
    flexDirection: 'column',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  fareSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  requestButton: {
    paddingVertical: 8,
  },
  clearFab: {
    position: 'absolute',
    top: 100,
    right: 16,
  },
  locationFab: {
    position: 'absolute',
    bottom: 200,
    right: 16,
  },
  testNotificationFab: {
    position: 'absolute',
    bottom: 140,
    right: 16,
    backgroundColor: '#FF6B35',
  },
  calloutContainer: {
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  searchModal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 16,
  },
  searchButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  searchingModal: {
    backgroundColor: 'white',
    padding: 30,
    margin: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  searchingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 20,
  },
});

export default HomeScreen;
