import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions, AppState, StatusBar, Vibration } from 'react-native';
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
  Avatar,
  Snackbar
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

  const emitWithAck = React.useCallback(
    (
      eventName: string,
      payload: any,
      options?: { label?: string; timeout?: number; fallbackOnTimeout?: boolean }
    ) => {
      if (!socket) {
        return;
      }

      const { label, timeout = 5000, fallbackOnTimeout = false } = options ?? {};
      const eventLabel = label ?? eventName;

      const logAck = (ack: any) => {
        if (ack?.error) {
          console.warn(` ${eventLabel} ack reported error:`, ack.error);
        } else if (ack) {
          console.log(` ${eventLabel} ack:`, ack);
        } else {
          console.log(`ℹ ${eventLabel} acknowledged without payload`);
        }
      };

      const emitDirect = () => {
        socket.emit(eventName, payload, (ack: any) => {
          logAck(ack);
        });
      };

      try {
        // @ts-ignore Timeout helper exists on socket.io-client >= 4
        if (typeof socket.timeout === 'function') {
          // @ts-ignore
          socket.timeout(timeout).emit(eventName, payload, (err: unknown, ack: any) => {
            if (err) {
              console.warn(` ${eventLabel} ack timed out or failed:`, err);
              if (fallbackOnTimeout) {
                emitDirect();
              }
              return;
            }
            logAck(ack);
          });
        } else {
          throw new Error('socket timeout helper not available');
        }
      } catch (error) {
        console.warn(` ${eventLabel} ack tracking not supported, emitting without timeout:`, error);
        emitDirect();
      }
    },
    [socket]
  );
  
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
  
  // Notification state
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Stats
  const [todayStats, setTodayStats] = useState({
    ridesCompleted: 0,
    earnings: 0,
    onlineTime: 0
  });

  // Map state
  const [region, setRegion] = useState<Region>({
    latitude: 35.7811, // Monastir ISIMM coordinates
    longitude: 10.8167,
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

  // Update driver status when location or availability changes
  useEffect(() => {
    if (socket && isConnected && user && currentLocation) {
      updateDriverStatus(isAvailable, currentLocation);
    }
  }, [isAvailable, currentLocation, socket, isConnected, user]);

  useEffect(() => {
    if (socket && isConnected && user) {
      const driverProfileId = (user as any)?.driver?.id ?? user.id;

      console.log(' Driver profile info:', {
        userId: user.id,
        driverProfileId,
        hasDriverObject: Boolean((user as any)?.driver),
        driverObject: (user as any)?.driver ?? null,
      });

      const locationPayload = currentLocation
        ? {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          }
        : null;

      emitWithAck(
        'driver:connect',
        {
          driverId: driverProfileId,
          userId: user.id,
          location: locationPayload,
        },
        { label: 'driver:connect', fallbackOnTimeout: true }
      );

      emitWithAck(
        'driver:status',
        {
          driverId: driverProfileId,
          userId: user.id,
          isAvailable: true,
          location: locationPayload,
        },
        { label: 'driver:status (initial)', fallbackOnTimeout: true }
      );

      console.log(' Driver connected and set as available:', {
        driverId: user.id,
        hasLocation: !!currentLocation,
        coordinates: currentLocation
          ? `${currentLocation.coords.latitude}, ${currentLocation.coords.longitude}`
          : 'No location',
      });

      // Automatically set driver as available when app is active
      setIsAvailable(true);
    }
  }, [socket, isConnected, user, currentLocation, emitWithAck]);

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

    console.log(' Setting up enhanced socket listeners for driver');
    
    // Use enhanced socket context methods
    onIncomingRide(handleIncomingRide);
    onRideUpdate(handleRideUpdate);
    onRideCancelled(handleRideCancelled);
    
    // TEMPORARY: Direct listener for debugging - listen for both events
    socket.on('rideRequest', (data) => {
      console.log(' DIRECT: rideRequest event received:', data);
      // Treat rideRequest as incoming ride for now
      setActiveRideRequest(data);
      setShowIncomingRide(true);
      handleIncomingRide(data);
    });
    
    socket.on('incomingRide', (data) => {
      console.log(' DIRECT: incomingRide event received:', data);
      handleIncomingRide(data);
    });
    
    // Also listen for any ride-related events for debugging
    socket.onAny((eventName, ...args) => {
      if (eventName.includes('ride') || eventName.includes('driver')) {
        console.log(` DRIVER received event: ${eventName}`, args);
      }
    });
    
    // Ensure driver joins the correct room
    const driverProfileId = (user as any)?.driver?.id ?? user?.id;
    joinRoom(driverProfileId || '', user?.role || 'DRIVER');
  };

  const setupAppStateListener = () => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log(' App state changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        // App is in foreground - set driver online
        setIsAvailable(true);
        console.log(' Driver set online - app active');
      } else if (nextAppState === 'background') {
        // App is in background - keep driver online
        console.log(' Driver remains online - app in background');
      } else if (nextAppState === 'inactive') {
        // App is being closed - set driver offline
        setIsAvailable(false);
        console.log(' Driver set offline - app inactive');
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
    console.log(' DRIVER: Incoming ride request received:', rideRequest);
    setActiveRideRequest(rideRequest);
    setShowIncomingRide(true);
    
    // Add haptic feedback for better user experience
    Vibration.vibrate([0, 250, 100, 250]);
    
    // Center map on the pickup location to show the rider
    if (mapRef.current && rideRequest.pickupLocation) {
      mapRef.current.animateToRegion({
        latitude: rideRequest.pickupLocation.latitude,
        longitude: rideRequest.pickupLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
    
    // Show system notification with enhanced details
    Alert.alert(
      ' New Ride Request!',
      ` Pickup: ${rideRequest.pickupLocation.address}\n Destination: ${rideRequest.dropoffLocation?.address || 'Unknown'}\n Fare: ${rideRequest.estimatedFare.toFixed(2)} TND\n Distance: ${rideRequest.estimatedDistance?.toFixed(1)} km`,
      [
        { text: 'Decline', style: 'cancel', onPress: () => declineRide(rideRequest.id) },
        { text: 'View Details', onPress: () => {}, style: 'default' },
        { text: 'Accept', onPress: () => acceptRide(rideRequest.id) }
      ]
    );
  };

  const updateDriverStatus = async (available: boolean, location?: Location.LocationObject) => {
    if (!user) return;

    const driverProfileId = (user as any)?.driver?.id ?? user.id;

    console.log(' Updating driver status:', {
      userId: user.id,
      driverProfileId,
      isAvailable: available,
      hasSocket: !!socket && isConnected,
      location: location ? `${location.coords.latitude}, ${location.coords.longitude}` : 'No location'
    });

    // Notify backend via REST so the matching service knows driver availability
    try {
      await driverService.updateStatus(available ? 'available' : 'offline');
    } catch (error) {
      console.error(' Failed to update driver availability via API:', error);
    }

    if (location) {
      try {
        await driverService.updateLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: new Date().toISOString(),
          speed: location.coords.speed ?? undefined,
          heading: location.coords.heading ?? undefined,
        });
      } catch (error) {
        console.error(' Failed to update driver location via API:', error);
      }
    }

    // Emit in real-time via sockets when available
    if (socket && isConnected) {
      emitWithAck(
        'driver:status',
        {
          driverId: driverProfileId,
          userId: user.id,
          isAvailable: available,
          location: location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }
            : null,
        },
        { label: 'driver:status (update)', fallbackOnTimeout: true }
      );

      if (location && available) {
        emitDriverLocation({
          driverId: driverProfileId,
          userId: user.id,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  };

  const handleRideUpdate = (rideData: any) => {
    console.log(' DRIVER: Ride update received:', rideData);
    // Handle ride status changes
  };

  const handleRideCancelled = (rideData: any) => {
    console.log(' DRIVER: Ride cancelled:', rideData);
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
          if (user) {
            const driverProfileId = (user as any)?.driver?.id ?? user.id;
            if (socket && isConnected) {
              emitDriverLocation({
                driverId: driverProfileId,
                userId: user.id,
                location: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  timestamp: new Date().toISOString(),
                },
              });
            }

            try {
              await driverService.updateLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: new Date().toISOString(),
                speed: location.coords.speed ?? undefined,
                heading: location.coords.heading ?? undefined,
              });
            } catch (error) {
              console.error(' Background location update failed:', error);
            }
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
      
      // Show success notification
      setSuccessMessage(' Ride accepted! Heading to pickup location.');
      setShowSuccessSnackbar(true);
      
      // Add success haptic feedback
      Vibration.vibrate(200);
      
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
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverMarkerText}></Text>
            </View>
          </Marker>
        )}
        
        {/* Active Ride Request Markers */}
        {activeRideRequest && showIncomingRide && (
          <>
            <Marker
              coordinate={{
                latitude: activeRideRequest.pickupLocation.latitude,
                longitude: activeRideRequest.pickupLocation.longitude,
              }}
              title="Pickup Location"
              description={activeRideRequest.pickupLocation.address}
              pinColor="#4CAF50"
            />
            {activeRideRequest.dropoffLocation && (
              <Marker
                coordinate={{
                  latitude: activeRideRequest.dropoffLocation.latitude,
                  longitude: activeRideRequest.dropoffLocation.longitude,
                }}
                title="Destination"
                description={activeRideRequest.dropoffLocation.address}
                pinColor="#F44336"
              />
            )}
          </>
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

      {/* Debug Status Panel - Remove in production */}
      {__DEV__ && (
        <Surface style={styles.debugPanel} elevation={2}>
          <Text style={styles.debugTitle}> Debug Status</Text>
          <Text style={styles.debugText}>
             Socket: {isConnected ? ' Connected' : ' Disconnected'}
          </Text>
          <Text style={styles.debugText}>
             Location: {currentLocation ? 
              ` ${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}` : 
              ' No location'}
          </Text>
          <Text style={styles.debugText}>
             Available: {isAvailable ? ' Online' : ' Offline'}
          </Text>
          <Text style={styles.debugText}>
             User: {user?.name} (ID: {user?.id})
          </Text>
          <Button
            mode="outlined"
            onPress={() => updateDriverStatus(true, currentLocation || undefined)}
            style={styles.debugButton}
            compact
          >
             Refresh Status
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              console.log(' Testing socket connectivity...');
              if (socket && isConnected) {
                // Test basic socket communication
                socket.emit('driver:ping', { driverId: user?.id, timestamp: Date.now() });
                
                // Re-join rooms
                joinRoom(user?.id || '', 'DRIVER');
                
                // Test if we can receive our own test event
                socket.emit('test:echo', { message: 'Driver test message', driverId: user?.id });
                
                console.log(' Test signals sent from driver');
              } else {
                console.log(' Driver socket not connected');
              }
            }}
            style={styles.debugButton}
            compact
          >
             Test Socket
          </Button>
        </Surface>
      )}

      {/* Enhanced Incoming Ride Modal with Map */}
      <Portal>
        <Modal
          visible={showIncomingRide}
          dismissable={false}
          contentContainerStyle={styles.rideModal}
        >
          {activeRideRequest && (
            <>
              <Text style={styles.modalTitle}> New Ride Request!</Text>
              
              {/* Mini Map showing pickup and destination */}
              <Surface style={styles.miniMapContainer} elevation={2}>
                <MapView
                  style={styles.miniMap}
                  initialRegion={{
                    latitude: activeRideRequest.pickupLocation.latitude,
                    longitude: activeRideRequest.pickupLocation.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                >
                  {/* Pickup marker */}
                  <Marker
                    coordinate={{
                      latitude: activeRideRequest.pickupLocation.latitude,
                      longitude: activeRideRequest.pickupLocation.longitude,
                    }}
                    title="Pickup"
                    pinColor="#4CAF50"
                  />
                  
                  {/* Destination marker */}
                  {activeRideRequest.dropoffLocation && (
                    <Marker
                      coordinate={{
                        latitude: activeRideRequest.dropoffLocation.latitude,
                        longitude: activeRideRequest.dropoffLocation.longitude,
                      }}
                      title="Destination"
                      pinColor="#F44336"
                    />
                  )}
                  
                  {/* Your current location */}
                  {currentLocation && (
                    <Marker
                      coordinate={{
                        latitude: currentLocation.coords.latitude,
                        longitude: currentLocation.coords.longitude,
                      }}
                      title="Your Location"
                    >
                      <View style={styles.driverMarker}>
                        <Text style={styles.driverMarkerText}></Text>
                      </View>
                    </Marker>
                  )}
                </MapView>
              </Surface>
              
              <List.Item
                title="Pickup Location"
                description={activeRideRequest.pickupLocation.address}
                left={() => <List.Icon icon="map-marker" color={theme.colors.primary} />}
              />
              
              <List.Item
                title="Destination"
                description={activeRideRequest.dropoffLocation.address}
                left={() => <List.Icon icon="flag" color={theme.colors.secondary} />}
              />
              
              <View style={styles.rideDetailsRow}>
                <View style={styles.rideDetailItem}>
                  <List.Icon icon="cash" color={theme.colors.tertiary} />
                  <Text style={styles.rideDetailText}>
                    {activeRideRequest.estimatedFare.toFixed(3)} TND
                  </Text>
                </View>
                
                <View style={styles.rideDetailItem}>
                  <List.Icon icon="map" color={theme.colors.tertiary} />
                  <Text style={styles.rideDetailText}>
                    {activeRideRequest.estimatedDistance?.toFixed(1)} km
                  </Text>
                </View>
                
                <View style={styles.rideDetailItem}>
                  <List.Icon icon="clock" color={theme.colors.tertiary} />
                  <Text style={styles.rideDetailText}>
                    {Math.ceil((activeRideRequest.estimatedDistance || 0) / 30 * 60)} min
                  </Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => declineRide(activeRideRequest.id)}
                  style={styles.declineButton}
                  disabled={acceptingRide}
                  textColor={theme.colors.error}
                  icon="close"
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
                  icon="check"
                >
                  Accept Ride
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>
      
      {/* Success Notification */}
      <Snackbar
        visible={showSuccessSnackbar}
        onDismiss={() => setShowSuccessSnackbar(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setShowSuccessSnackbar(false),
        }}
        style={{ backgroundColor: theme.colors.primary }}
      >
        {successMessage}
      </Snackbar>
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
    miniMapContainer: {
      height: 180,
      borderRadius: radii.lg,
      overflow: 'hidden',
      marginBottom: spacing(3),
    },
    miniMap: {
      flex: 1,
    },
    driverMarker: {
      backgroundColor: theme.colors.primary,
      padding: spacing(1),
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    driverMarkerText: {
      fontSize: 16,
    },
    rideDetailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginVertical: spacing(2),
      paddingHorizontal: spacing(1),
    },
    rideDetailItem: {
      alignItems: 'center',
      flex: 1,
    },
    rideDetailText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: spacing(0.5),
      textAlign: 'center',
    },
    debugPanel: {
      margin: spacing(2),
      padding: spacing(2),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surfaceVariant,
    },
    debugTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(1),
    },
    debugText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(0.5),
    },
    debugButton: {
      marginTop: spacing(1),
      borderRadius: radii.md,
    },
  });

export default DriverHomeScreen;