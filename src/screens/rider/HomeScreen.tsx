import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { 
  Surface, 
  Card, 
  Button, 
  Text, 
  Portal, 
  Modal, 
  ActivityIndicator,
  FAB
} from 'react-native-paper';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface Driver {
  id: string;
  lat: number;
  lng: number;
  available: boolean;
}

interface RideLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
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
  
  // UI state
  const [isRequestingRide, setIsRequestingRide] = useState(false);
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      fetchNearbyDrivers();
    }
  }, [currentLocation]);

  useEffect(() => {
    if (socket && isConnected) {
      // Listen for ride updates
      socket.on('rideUpdate', handleRideUpdate);
      socket.on('driverLocation', handleDriverLocationUpdate);
      
      return () => {
        socket.off('rideUpdate');
        socket.off('driverLocation');
      };
    }
  }, [socket, isConnected]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to use the app.'
        );
        return;
      }
      
      setLocationPermission(true);
      getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const currentPos = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(currentPos);
      setPickupLocation(currentPos); // Default pickup to current location
      
      // Update map region
      setRegion({
        ...currentPos,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      
      // Animate map to current location
      mapRef.current?.animateToRegion({
        ...currentPos,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Could not get your current location');
    }
  };

  const fetchNearbyDrivers = async () => {
    if (!currentLocation) return;
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/drivers/nearby?lat=${currentLocation.latitude}&lng=${currentLocation.longitude}`);
      // const drivers = await response.json();
      
      // Mock data for now
      const mockDrivers: Driver[] = [
        {
          id: '1',
          lat: currentLocation.latitude + 0.01,
          lng: currentLocation.longitude + 0.01,
          available: true,
        },
        {
          id: '2',
          lat: currentLocation.latitude - 0.015,
          lng: currentLocation.longitude + 0.02,
          available: true,
        },
      ];
      
      setNearbyDrivers(mockDrivers);
    } catch (error) {
      console.error('Error fetching nearby drivers:', error);
    }
  };

  const handleMapPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    
    if (!pickupLocation) {
      setPickupLocation(coordinate);
    } else if (!dropoffLocation) {
      setDropoffLocation(coordinate);
    } else {
      // Reset and set new pickup
      setPickupLocation(coordinate);
      setDropoffLocation(null);
    }
  };

  const requestRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Error', 'Please select both pickup and dropoff locations');
      return;
    }
    
    setIsRequestingRide(true);
    setIsSearchingDriver(true);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/rides/request', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     pickup: pickupLocation,
      //     dropoff: dropoffLocation,
      //   }),
      // });
      
      // Mock ride request
      setTimeout(() => {
        handleRideUpdate({ status: 'ACCEPTED', rideId: 'mock-ride-123' });
      }, 3000);
      
    } catch (error) {
      console.error('Error requesting ride:', error);
      Alert.alert('Error', 'Failed to request ride');
      setIsRequestingRide(false);
      setIsSearchingDriver(false);
    }
  };

  const handleRideUpdate = (data: any) => {
    console.log('Ride update:', data);
    
    if (data.status === 'ACCEPTED') {
      setIsSearchingDriver(false);
      navigation.navigate('RideTracking', { 
        rideId: data.rideId,
        pickup: pickupLocation,
        dropoff: dropoffLocation 
      });
    }
  };

  const handleDriverLocationUpdate = (data: any) => {
    console.log('Driver location update:', data);
    // Update driver positions on map
    setNearbyDrivers(prev => 
      prev.map(driver => 
        driver.id === data.driverId 
          ? { ...driver, lat: data.lat, lng: data.lng }
          : driver
      )
    );
  };

  const resetLocations = () => {
    setPickupLocation(currentLocation);
    setDropoffLocation(null);
  };

  if (!locationPermission) {
    return (
      <View style={styles.centered}>
        <Text>Requesting location permission...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Pickup marker */}
        {pickupLocation && (
          <Marker
            coordinate={pickupLocation}
            title="Pickup Location"
            pinColor="green"
          />
        )}
        
        {/* Dropoff marker */}
        {dropoffLocation && (
          <Marker
            coordinate={dropoffLocation}
            title="Dropoff Location"
            pinColor="red"
          />
        )}
        
        {/* Driver markers */}
        {nearbyDrivers.map(driver => (
          <Marker
            key={driver.id}
            coordinate={{ latitude: driver.lat, longitude: driver.lng }}
            title={`Driver ${driver.id}`}
            description={driver.available ? 'Available' : 'Busy'}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverText}>🚗</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Location selection info */}
      <Surface style={styles.infoCard}>
        <Text variant="titleMedium">Select Locations</Text>
        <Text variant="bodyMedium">
          {!pickupLocation && "Tap on map to set pickup location"}
          {pickupLocation && !dropoffLocation && "Tap on map to set dropoff location"}
          {pickupLocation && dropoffLocation && "Ready to request ride!"}
        </Text>
        
        {pickupLocation && dropoffLocation && (
          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              onPress={resetLocations}
              style={styles.button}
            >
              Reset
            </Button>
            <Button 
              mode="contained" 
              onPress={requestRide}
              style={styles.button}
              loading={isRequestingRide}
              disabled={isRequestingRide}
            >
              Request Ride
            </Button>
          </View>
        )}
      </Surface>

      {/* Current location FAB */}
      <FAB
        style={styles.fab}
        icon="crosshairs-gps"
        onPress={getCurrentLocation}
        size="small"
      />

      {/* Searching for driver modal */}
      <Portal>
        <Modal 
          visible={isSearchingDriver} 
          dismissable={false}
          contentContainerStyle={styles.modalContent}
        >
          <Card>
            <Card.Content style={styles.searchingContent}>
              <ActivityIndicator size="large" />
              <Text variant="titleMedium" style={styles.searchingText}>
                Searching for driver...
              </Text>
              <Text variant="bodyMedium">
                We're finding the best driver for your ride
              </Text>
              <Button 
                mode="outlined" 
                onPress={() => {
                  setIsSearchingDriver(false);
                  setIsRequestingRide(false);
                }}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  button: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  driverMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  driverText: {
    fontSize: 20,
  },
  modalContent: {
    margin: 20,
  },
  searchingContent: {
    alignItems: 'center',
    padding: 20,
  },
  searchingText: {
    marginTop: 16,
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 20,
  },
});

export default HomeScreen;