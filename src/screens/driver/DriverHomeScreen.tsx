import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions, AppState, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Surface, 
  Card, 
  Button, 
  Text, 
  Switch, 
  ActivityIndicator,
  Portal, 
  Modal,
  List,
  Divider,
  IconButton,
  Avatar
} from 'react-native-paper';
import MapView, { Marker, Region } from 'react-native-maps';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { driverService, locationService } from '../../services';
import type { RideRequest } from '../../services/driver';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';
import type { DriverHomeScreenProps } from '../../types/navigation';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Background location task name
const BACKGROUND_LOCATION_TASK = 'background-location-task';

const DriverHomeScreen: React.FC<DriverHomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { 
    socket, 
    isConnected, 
    onIncomingRide, 
    onRideUpdate,
    onRideCancelled,
    joinRoom,
    emitDriverLocation,
    emitRideAccept
  } = useSocket();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  // Driver state
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  
  // Ride request state
  const [incomingRides, setIncomingRides] = useState<RideRequest[]>([]);
  const [showIncomingRide, setShowIncomingRide] = useState(false);
  const [activeRideRequest, setActiveRideRequest] = useState<RideRequest | null>(null);
  const [acceptingRide, setAcceptingRide] = useState(false);
  
  // Stats
  const [todayStats, setTodayStats] = useState({
    ridesCompleted: 0,
    earnings: 0,
    onlineTime: 0
  });

  // Map state
  const [region, setRegion] = useState<Region>({
    latitude: 36.8065, // Tunis coordinates
    longitude: 10.1815,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    initializeDriver();
    setupSocketListeners();
    const appStateSubscription = setupAppStateListener();
    
    return () => {
      cleanupLocationTracking();
      cleanupSocketListeners();
      appStateSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (socket && isConnected && user) {
      // Connect as driver and set online automatically
      socket.emit('driver:connect', {
        driverId: user.id,
        location: currentLocation ? {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
        } : null
      });
      // Automatically set driver as available when app is active
      setIsAvailable(true);
    }
  }, [socket, isConnected, user, currentLocation]);

  const initializeDriver = async () => {
    try {
      // Request location permissions
      const hasPermission = await locationService.requestPermissions();
      setLocationPermission(hasPermission);
      
      if (hasPermission) {
        await getCurrentLocation();
      }
      
      // Load driver stats
      await loadTodayStats();
    } catch (error) {
      console.error('Error initializing driver:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation(location);
      
      // Update map region
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    console.log('🔧 Setting up enhanced socket listeners for driver');
    
    // Use enhanced socket context methods
    onIncomingRide(handleIncomingRide);
    onRideUpdate(handleRideUpdate);
    onRideCancelled(handleRideCancelled);
    
    // Ensure driver joins the correct room
    joinRoom(user?.id || '', user?.role || 'DRIVER');
  };

  const setupAppStateListener = () => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('🔄 App state changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        // App is in foreground - set driver online
        setIsAvailable(true);
        console.log('📱 Driver set online - app active');
      } else if (nextAppState === 'background') {
        // App is in background - keep driver online
        console.log('📱 Driver remains online - app in background');
      } else if (nextAppState === 'inactive') {
        // App is being closed - set driver offline
        setIsAvailable(false);
        console.log('📱 Driver set offline - app inactive');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Set initial state based on current app state
    setIsAvailable(AppState.currentState === 'active');
    
    return subscription;
  };

  const cleanupAppStateListener = () => {
    // Cleanup will be handled by the useEffect return function
  };

  const cleanupSocketListeners = () => {
    if (!socket) return;

    socket.off('incomingRide');
    socket.off('rideUpdate');
    socket.off('rideCancelled');
  };

  const handleIncomingRide = (rideRequest: RideRequest) => {
    console.log('🔔 DRIVER: Incoming ride request received:', rideRequest);
    setActiveRideRequest(rideRequest);
    setShowIncomingRide(true);
    
    // Show system notification if app is in background
    Alert.alert(
      '🚗 New Ride Request!',
      `Pickup: ${rideRequest.pickupLocation.address}\nDropoff: ${rideRequest.dropoffLocation?.address || 'Unknown'}\nFare: ${rideRequest.estimatedFare.toFixed(2)} TND`,
      [
        { text: 'Decline', style: 'cancel', onPress: () => declineRide(rideRequest.id) },
        { text: 'Accept', onPress: () => acceptRide(rideRequest.id) }
      ]
    );
  };

  const handleRideUpdate = (rideData: any) => {
    console.log('🔄 DRIVER: Ride update received:', rideData);
    // Handle ride status changes
  };

  const handleRideCancelled = (rideData: any) => {
    console.log('❌ DRIVER: Ride cancelled:', rideData);
    setShowIncomingRide(false);
    setActiveRideRequest(null);
    Alert.alert('Ride Cancelled', 'The ride has been cancelled by the rider.');
  };

  const startLocationTracking = async () => {
    try {
      // Define the background location task
      TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
        if (error) {
          console.error('Background location error:', error);
          return;
        }
        if (data) {
          const { locations } = data as any;
          const location = locations[0];
          
          // Emit location update via enhanced socket
          if (socket && isConnected) {
            emitDriverLocation({
              driverId: user?.id,
              location: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: new Date().toISOString()
              }
            });
          }
        }
      });

      // Start background location updates
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Update every 10 meters
        foregroundService: {
          notificationTitle: 'RideMobile Driver',
          notificationBody: 'Tracking your location for ride requests',
        },
      });

      setIsLocationTracking(true);
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = async () => {
    try {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      setIsLocationTracking(false);
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  const cleanupLocationTracking = async () => {
    if (isLocationTracking) {
      await stopLocationTracking();
    }
  };

  const acceptRide = async (rideId: string) => {
    if (!user || acceptingRide) return;
    
    setAcceptingRide(true);
    try {
      await driverService.acceptRide(rideId);
      
      // Emit socket event for real-time ride acceptance
      emitRideAccept(rideId);
      
      setShowIncomingRide(false);
      setActiveRideRequest(null);
      
      // Navigate to pickup screen
      navigation.navigate('DriverPickup', { rideId });
    } catch (error) {
      console.error('Error accepting ride:', error);
      Alert.alert('Error', 'Failed to accept ride request.');
    } finally {
      setAcceptingRide(false);
    }
  };

  const declineRide = async (rideId: string) => {
    try {
      await driverService.declineRide(rideId);
      setShowIncomingRide(false);
      setActiveRideRequest(null);
    } catch (error) {
      console.error('Error declining ride:', error);
    }
  };

  const loadTodayStats = async () => {
    try {
      const stats = await driverService.getTodayStats();
      setTodayStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
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
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      
      {/* Header - Enhanced Bolt Style */}
      <Surface elevation={0} style={styles.header}>
        <View style={styles.headerPlaceholder} />
        <View style={styles.headerContent}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Driver Dashboard
          </Text>
        </View>
        <View style={styles.profileContainer}>
          <IconButton
            icon="account-circle"
            iconColor={theme.colors.primary}
            size={28}
            onPress={() => navigation.navigate('DriverProfile')}
            style={styles.profileButton}
          />
          {isAvailable && (
            <View style={styles.onlineIndicator} />
          )}
        </View>
      </Surface>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        mapType="standard"
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            title="Your Location"
            description="Driver position"
            pinColor={isAvailable ? theme.colors.primary : theme.colors.error}
          />
        )}
      </MapView>

      {/* Stats Panel */}
      <View style={styles.statsPanel}>
        <Text style={styles.statsTitle}>Today</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todayStats.ridesCompleted}</Text>
            <Text style={styles.statLabel}>Rides</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todayStats.earnings.toFixed(0)} TND</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.floor(todayStats.onlineTime / 60)}h</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
        </View>
      </View>

      {/* Incoming Ride Modal */}
      <Portal>
        <Modal
          visible={showIncomingRide}
          dismissable={false}
          contentContainerStyle={styles.rideModal}
        >
          {activeRideRequest && (
            <>
              <Text style={styles.modalTitle}>New Ride Request!</Text>
              
              <List.Item
                title="Pickup Location"
                description={activeRideRequest.pickupLocation.address}
                left={() => <List.Icon icon="map-marker" />}
              />
              
              <List.Item
                title="Destination"
                description={activeRideRequest.dropoffLocation.address}
                left={() => <List.Icon icon="flag" />}
              />
              
              <List.Item
                title="Estimated Fare"
                description={`${activeRideRequest.estimatedFare.toFixed(3)} TND`}
                left={() => <List.Icon icon="cash" />}
              />
              
              <List.Item
                title="Distance"
                description={`${activeRideRequest.estimatedDistance?.toFixed(1)} km`}
                left={() => <List.Icon icon="map" />}
              />

              <Divider style={styles.divider} />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => declineRide(activeRideRequest.id)}
                  style={styles.declineButton}
                  disabled={acceptingRide}
                  textColor={theme.colors.error}
                >
                  Decline
                </Button>
                <Button
                  mode="contained"
                  onPress={() => acceptRide(activeRideRequest.id)}
                  style={styles.acceptButton}
                  loading={acceptingRide}
                  disabled={acceptingRide}
                  buttonColor={theme.colors.primary}
                >
                  Accept Ride
                </Button>
              </View>
            </>
          )}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1.5),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
      minHeight: 56, // Ensure header doesn't get cropped
    },
    headerPlaceholder: {
      width: 48,
      height: 48,
    },
    profileContainer: {
      position: 'relative',
    },
    profileButton: {
      margin: 0,
      backgroundColor: theme.colors.primaryContainer,
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      left: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#4CAF50', // Green color
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: spacing(2),
    },
    headerTitle: {
      color: theme.colors.onSurface,
      fontWeight: '700',
      fontSize: 20,
    },
    headerSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing(0.5),
      fontSize: 14,
      textAlign: 'center',
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
    statsPanel: {
      position: 'absolute',
      bottom: 0, // Right where nav buttons start
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      padding: spacing(3),
      paddingBottom: spacing(6), // Extra padding to account for nav buttons
      elevation: 4,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(2),
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: spacing(0.5),
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    rideModal: {
      backgroundColor: theme.colors.surface,
      margin: spacing(4),
      borderRadius: radii.xl,
      padding: spacing(4),
      maxHeight: '75%',
      borderWidth: 1,
      borderColor: theme.colors.outline,
      shadowColor: theme.colors.onSurface,
      shadowOpacity: 0.15,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: spacing(3),
      color: theme.colors.primary,
    },
    divider: {
      marginVertical: spacing(3),
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outline,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing(3),
      gap: spacing(2),
    },
    declineButton: {
      flex: 1,
      borderRadius: radii.lg,
      borderColor: theme.colors.error,
      borderWidth: 2,
    },
    acceptButton: {
      flex: 1,
      borderRadius: radii.lg,
      elevation: 2,
    },
  });

export default DriverHomeScreen;