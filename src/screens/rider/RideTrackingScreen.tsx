import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { 
  Surface, 
  Card, 
  Button, 
  Text, 
  Portal, 
  Modal, 
  Chip,
  Divider
} from 'react-native-paper';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { RideTrackingScreenProps } from '../../types/navigation';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface RideLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

const RideTrackingScreen: React.FC<RideTrackingScreenProps> = ({ route, navigation }) => {
  const { rideId, pickupLocation, dropoffLocation } = route.params;
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  // State
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [rideStatus, setRideStatus] = useState('ACCEPTED');
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [driverInfo, setDriverInfo] = useState({
    name: 'John Doe',
    vehicle: 'Toyota Camry',
    plateNumber: 'ABC-123',
    rating: 4.8,
  });
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (socket && isConnected) {
      // Subscribe to driver location updates
      socket.on('driverLocation', handleDriverLocationUpdate);
      socket.on('rideUpdate', handleRideStatusUpdate);
      
      // Request initial driver location
      socket.emit('subscribeToRide', { rideId });
      
      return () => {
        socket.off('driverLocation');
        socket.off('rideUpdate');
      };
    }
  }, [socket, isConnected, rideId]);

  useEffect(() => {
    // Fit map to show pickup, dropoff, and driver location
    if (pickupLocation && dropoffLocation) {
      const coordinates = [pickupLocation, dropoffLocation];
      if (driverLocation) {
        coordinates.push(driverLocation);
      }
      
      fitMapToCoordinates(coordinates);
    }
  }, [pickupLocation, dropoffLocation, driverLocation]);

  const handleDriverLocationUpdate = (data: any) => {
    if (data.rideId === rideId) {
      setDriverLocation({
        latitude: data.lat,
        longitude: data.lng,
        heading: data.heading,
        speed: data.speed,
      });
      
      // Calculate estimated arrival time (mock calculation)
      setEstimatedArrival('5 min');
    }
  };

  const handleRideStatusUpdate = (data: any) => {
    if (data.rideId === rideId) {
      setRideStatus(data.status);
      
      if (data.status === 'IN_PROGRESS') {
        Alert.alert('Ride Started', 'Your driver has started the trip');
      } else if (data.status === 'COMPLETED') {
        setShowCompleteModal(true);
      }
    }
  };

  const fitMapToCoordinates = (coordinates: RideLocation[]) => {
    if (coordinates.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const cancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            // TODO: API call to cancel ride
            socket?.emit('cancelRide', { rideId });
            navigation.goBack();
          },
        },
      ]
    );
  };

  const completeRide = async () => {
    try {
      // TODO: Call payment API
      // await fetch('/payments/log', { ... });
      
      setShowCompleteModal(false);
      navigation.navigate('RideReceipt', { 
        rideId,
        totalAmount: 15.50, // This would come from the ride data in a real app
        rideDetails: {
          pickupLocation: pickupLocation.address || 'Pickup Location',
          dropoffLocation: dropoffLocation.address || 'Dropoff Location',
          distance: 5.2, // This would be calculated
          duration: 12, // This would be tracked
          driverName: 'John Doe', // This would come from driver data
          vehicleInfo: 'Toyota Camry - ABC123' // This would come from driver data
        }
      });
    } catch (error) {
      console.error('Error completing ride:', error);
      Alert.alert('Error', 'Failed to process payment');
    }
  };

  const getStatusColor = () => {
    switch (rideStatus) {
      case 'ACCEPTED': return '#2196F3';
      case 'IN_PROGRESS': return '#4CAF50';
      case 'COMPLETED': return '#FF9800';
      default: return '#757575';
    }
  };

  const getStatusText = () => {
    switch (rideStatus) {
      case 'ACCEPTED': return 'Driver is on the way';
      case 'IN_PROGRESS': return 'In progress';
      case 'COMPLETED': return 'Ride completed';
      default: return 'Unknown status';
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
      >
        {/* Pickup marker */}
        <Marker
          coordinate={pickupLocation}
          title="Pickup Location"
          pinColor="green"
        />
        
        {/* Dropoff marker */}
        <Marker
          coordinate={dropoffLocation}
          title="Dropoff Location"
          pinColor="red"
        />
        
        {/* Driver marker */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Your Driver"
            rotation={driverLocation.heading || 0}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverText}>🚗</Text>
            </View>
          </Marker>
        )}
        
        {/* Route polyline */}
        {driverLocation && (
          <Polyline
            coordinates={[driverLocation, pickupLocation, dropoffLocation]}
            strokeColor="#2196F3"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Ride info card */}
      <Surface style={styles.rideInfoCard}>
        <View style={styles.statusContainer}>
          <Chip 
            mode="outlined" 
            textStyle={{ color: getStatusColor() }}
            style={{ borderColor: getStatusColor() }}
          >
            {getStatusText()}
          </Chip>
          {estimatedArrival && (
            <Text variant="bodyMedium">ETA: {estimatedArrival}</Text>
          )}
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.driverInfoContainer}>
          <Text variant="titleMedium">{driverInfo.name}</Text>
          <Text variant="bodyMedium">{driverInfo.vehicle}</Text>
          <Text variant="bodyMedium">Plate: {driverInfo.plateNumber}</Text>
          <Text variant="bodyMedium">Rating: ⭐ {driverInfo.rating}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <Button 
            mode="outlined" 
            onPress={() => {/* TODO: Call driver */}}
            style={styles.button}
            icon="phone"
          >
            Call
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => {/* TODO: Message driver */}}
            style={styles.button}
            icon="message"
          >
            Message
          </Button>
          <Button 
            mode="contained" 
            onPress={cancelRide}
            style={[styles.button, styles.cancelButton]}
            buttonColor="#f44336"
          >
            Cancel
          </Button>
        </View>
      </Surface>

      {/* Ride completion modal */}
      <Portal>
        <Modal 
          visible={showCompleteModal} 
          dismissable={false}
          contentContainerStyle={styles.modalContent}
        >
          <Card>
            <Card.Content style={styles.completeContent}>
              <Text variant="headlineSmall" style={styles.completeTitle}>
                Ride Completed!
              </Text>
              <Text variant="bodyMedium" style={styles.completeMessage}>
                Thank you for riding with us. How was your experience?
              </Text>
              
              {/* TODO: Add rating component */}
              
              <View style={styles.completeButtons}>
                <Button 
                  mode="contained" 
                  onPress={completeRide}
                  style={styles.completeButton}
                >
                  View Receipt
                </Button>
              </View>
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
  map: {
    flex: 1,
  },
  rideInfoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  driverInfoContainer: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  driverMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  driverText: {
    fontSize: 20,
  },
  modalContent: {
    margin: 20,
  },
  completeContent: {
    alignItems: 'center',
    padding: 20,
  },
  completeTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  completeMessage: {
    marginBottom: 24,
    textAlign: 'center',
  },
  completeButtons: {
    width: '100%',
  },
  completeButton: {
    marginTop: 16,
  },
});

export default RideTrackingScreen;