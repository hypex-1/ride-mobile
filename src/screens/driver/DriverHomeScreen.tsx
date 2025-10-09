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
    
    return () => {
      cleanupLocationTracking();
      cleanupSocketListeners();
    };
  }, []);

  useEffect(() => {
    if (socket && isConnected && user) {
      // Connect as driver
      socket.emit('driver:connect', {
        driverId: user.id,
        location: currentLocation ? {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
        } : null
      });
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

  const toggleAvailability = async () => {
    try {
      if (!isAvailable) {
        // Going online
        if (!locationPermission) {
          Alert.alert('Location Required', 'Please enable location services to go online.');
          return;
        }
        
        await startLocationTracking();
        await driverService.updateStatus('available');
        setIsAvailable(true);
      } else {
        // Going offline
        await stopLocationTracking();
        await driverService.updateStatus('offline');
        setIsAvailable(false);
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      Alert.alert('Error', 'Failed to update availability status.');
    }
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
      {/* Header with navigation and profile */}
      <Surface elevation={0} style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={theme.colors.onSurface}
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <View style={styles.headerContent}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            Driver Dashboard
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {isAvailable ? 'Online - Accepting rides' : 'Offline'}
          </Text>
        </View>
        <IconButton
          icon="account-circle"
          iconColor={theme.colors.onSurface}
          size={24}
          onPress={() => navigation.navigate('DriverProfile')}
          style={styles.profileButton}
        />
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

      {/* Status Panel */}
      <Surface style={styles.statusPanel}>
        <Card>
          <Card.Content style={styles.statusContent}>
            <View style={styles.availabilityRow}>
              <View>
                <Text style={styles.statusTitle}>
                  {isAvailable ? 'Online' : 'Offline'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {isAvailable ? 'Ready for ride requests' : 'Not accepting rides'}
                </Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={toggleAvailability}
                color={theme.colors.primary}
              />
            </View>
          </Card.Content>
        </Card>
      </Surface>

      {/* Stats Panel */}
      <Surface style={styles.statsPanel}>
        <Card>
          <Card.Content>
            <Text style={styles.panelTitle}>Today's Summary</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{todayStats.ridesCompleted}</Text>
                <Text style={styles.statLabel}>Rides</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{todayStats.earnings.toFixed(3)} TND</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.floor(todayStats.onlineTime / 60)}h</Text>
                <Text style={styles.statLabel}>Online</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </Surface>

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
      paddingHorizontal: spacing(1),
      paddingVertical: spacing(1),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    backButton: {
      margin: 0,
    },
    profileButton: {
      margin: 0,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    headerSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing(0.25),
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
    statusPanel: {
      position: 'absolute',
      top: spacing(8),
      left: spacing(2),
      right: spacing(2),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      elevation: 6,
      shadowColor: theme.colors.onSurface,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
    statusContent: {
      paddingVertical: spacing(2),
      paddingHorizontal: spacing(2.5),
    },
    availabilityRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    statusSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing(0.5),
    },
    statsPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderColor: theme.colors.outline,
      elevation: 10,
      shadowColor: theme.colors.onSurface,
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: -4 },
    },
    panelTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: spacing(2),
      color: theme.colors.onSurface,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing(0.5),
    },
    rideModal: {
      backgroundColor: theme.colors.surface,
      margin: spacing(3),
      borderRadius: radii.lg,
      padding: spacing(3),
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: spacing(2.5),
      color: theme.colors.primary,
    },
    divider: {
      marginVertical: spacing(2),
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outline,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing(2),
    },
    declineButton: {
      flex: 1,
      marginRight: spacing(1),
      borderRadius: radii.md,
      borderColor: theme.colors.error,
    },
    acceptButton: {
      flex: 1,
      marginLeft: spacing(1),
      borderRadius: radii.md,
    },
  });

export default DriverHomeScreen;