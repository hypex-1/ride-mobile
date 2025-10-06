import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions, SafeAreaView, Linking, StatusBar } from 'react-native';
import {
  Surface,
  Button,
  Text,
  IconButton,
  TouchableRipple,
  Avatar,
} from 'react-native-paper';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { RideTrackingScreenProps } from '../../types/navigation';
import { useAppTheme, spacing, radii } from '../../theme';

const { width } = Dimensions.get('window');

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
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  // State
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [rideStatus, setRideStatus] = useState('ACCEPTED');
  const [estimatedArrival, setEstimatedArrival] = useState<string>('5 min');
  const [driverInfo] = useState({
    name: 'John Doe',
    vehicle: 'Toyota Camry',
    plateNumber: 'ABC-123',
    rating: 4.8,
    phone: '+1234567890',
  });
  const [panelExpanded, setPanelExpanded] = useState(false);
  
  const mapRef = useRef<MapView>(null);

  const getStatusText = () => {
    switch (rideStatus) {
      case 'ACCEPTED':
        return 'Driver is on the way';
      case 'ARRIVED':
        return 'Driver has arrived';
      case 'IN_PROGRESS':
        return 'Ride in progress';
      case 'COMPLETED':
        return 'Ride completed';
      default:
        return 'Tracking driver';
    }
  };

  const handleCallDriver = async () => {
    const phoneUrl = `tel:${driverInfo.phone}`;
    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Call Driver', 'Phone calls are not supported on this device.');
      }
    } catch (error) {
      Alert.alert('Call Driver', 'Unable to launch the dialer right now.');
    }
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            socket?.emit('cancelRide', { rideId });
            navigation.goBack();
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('driverLocation', (data: any) => {
        if (data.rideId === rideId) {
          setDriverLocation({
            latitude: data.lat,
            longitude: data.lng,
            heading: data.heading,
            speed: data.speed,
          });
        }
      });
      
      socket.on('rideUpdate', (data: any) => {
        if (data.rideId === rideId) {
          setRideStatus(data.status);
          if (data.status === 'COMPLETED') {
            navigation.navigate('RideReceipt', { 
              rideId,
              totalAmount: 15.50,
              rideDetails: {
                pickupLocation: pickupLocation.address || 'Pickup Location',
                dropoffLocation: dropoffLocation.address || 'Dropoff Location',
                distance: 5.2,
                duration: 12,
                driverName: driverInfo.name,
                vehicleInfo: `${driverInfo.vehicle} - ${driverInfo.plateNumber}`
              }
            });
          }
        }
      });
      
      socket.emit('subscribeToRide', { rideId });
      
      return () => {
        socket.off('driverLocation');
        socket.off('rideUpdate');
      };
    }
  }, [socket, isConnected, rideId]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        initialRegion={{
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Pickup marker */}
        <Marker
          coordinate={pickupLocation}
          title="Pickup"
          pinColor="#34D186"
        />
        
        {/* Dropoff marker */}
        <Marker
          coordinate={dropoffLocation}
          title="Destination"
          pinColor="#FF4444"
        />
        
        {/* Driver marker */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Your Driver"
            rotation={driverLocation.heading || 0}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverMarkerText}>🚗</Text>
            </View>
          </Marker>
        )}
        
        {/* Route polyline */}
        {driverLocation && (
          <Polyline
            coordinates={[driverLocation, pickupLocation, dropoffLocation]}
            strokeColor="#34D186"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            iconColor="#000000"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {dropoffLocation.address?.split(',')[0] || 'Destination'}
            </Text>
            <Text style={styles.headerSubtitle}>
              ETA {estimatedArrival}
            </Text>
          </View>
          <IconButton
            icon="phone"
            iconColor="#34D186"
            size={24}
            onPress={handleCallDriver}
            style={styles.callButton}
          />
        </View>
      </SafeAreaView>

      {/* Bottom Panel */}
      <Surface style={styles.bottomPanel} elevation={5}>
        {/* Panel Handle */}
        <TouchableRipple
          onPress={() => setPanelExpanded(!panelExpanded)}
          style={styles.panelHandle}
        >
          <View style={styles.handleBar} />
        </TouchableRipple>

        {panelExpanded ? (
          <View style={styles.expandedContent}>
            {/* Driver Info */}
            <View style={styles.driverSection}>
              <Avatar.Text
                size={48}
                label={driverInfo.name.split(' ').map(n => n[0]).join('')}
                style={styles.driverAvatar}
                labelStyle={styles.driverAvatarText}
              />
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{driverInfo.name}</Text>
                <Text style={styles.driverDetails}>
                  {driverInfo.vehicle} • {driverInfo.plateNumber}
                </Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}>★ {driverInfo.rating}</Text>
                </View>
              </View>
            </View>

            {/* Trip Status */}
            <View style={styles.statusSection}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
              <Text style={styles.statusSubtitle}>
                {rideStatus === 'ACCEPTED' ? 'Your driver is coming to pick you up' : 'Track your ride in real time'}
              </Text>
            </View>

            {/* Route Info */}
            <View style={styles.routeSection}>
              <View style={styles.routeItem}>
                <View style={[styles.routeDot, styles.pickupDot]} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {pickupLocation.address || 'Pickup location'}
                </Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeItem}>
                <View style={[styles.routeDot, styles.dropoffDot]} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {dropoffLocation.address || 'Destination'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={handleCancelRide}
                style={styles.cancelButton}
                textColor="#FF4444"
              >
                Cancel ride
              </Button>
              <Button
                mode="contained"
                onPress={handleCallDriver}
                style={styles.callButtonMain}
                buttonColor="#34D186"
              >
                Call driver
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.collapsedContent}>
            <View style={styles.collapsedInfo}>
              <Text style={styles.collapsedStatus}>{getStatusText()}</Text>
              <Text style={styles.collapsedEta}>ETA {estimatedArrival}</Text>
            </View>
            <View style={styles.collapsedDriver}>
              <Text style={styles.collapsedDriverName}>{driverInfo.name}</Text>
              <Text style={styles.collapsedVehicle}>{driverInfo.vehicle}</Text>
            </View>
          </View>
        )}
      </Surface>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8F9FA',
    },
    
    // Map
    map: {
      flex: 1,
    },
    driverMarker: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#34D186',
      justifyContent: 'center',
      alignItems: 'center',
    },
    driverMarkerText: {
      fontSize: 16,
    },

    // Header - Bolt Style
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      backgroundColor: '#FFFFFF',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E7EB',
    },
    backButton: {
      margin: 0,
    },
    headerInfo: {
      flex: 1,
      marginLeft: spacing(2),
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      marginTop: spacing(0.5),
    },
    callButton: {
      margin: 0,
      backgroundColor: 'rgba(52, 209, 134, 0.1)',
    },

    // Bottom Panel - Bolt Style
    bottomPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      maxHeight: '60%',
    },
    panelHandle: {
      alignItems: 'center',
      paddingVertical: spacing(1.5),
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: '#D1D5DB',
      borderRadius: radii.sm,
    },

    // Collapsed State
    collapsedContent: {
      paddingHorizontal: spacing(3),
      paddingBottom: spacing(3),
    },
    collapsedInfo: {
      marginBottom: spacing(2),
    },
    collapsedStatus: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      marginBottom: spacing(0.5),
    },
    collapsedEta: {
      fontSize: 14,
      color: '#34D186',
      fontWeight: '500',
    },
    collapsedDriver: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#E5E7EB',
      paddingTop: spacing(2),
    },
    collapsedDriverName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#111827',
      marginBottom: spacing(0.5),
    },
    collapsedVehicle: {
      fontSize: 14,
      color: '#6B7280',
    },

    // Expanded State
    expandedContent: {
      paddingHorizontal: spacing(3),
      paddingBottom: spacing(4),
    },

    // Driver Section
    driverSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing(3),
      paddingBottom: spacing(3),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E7EB',
    },
    driverAvatar: {
      backgroundColor: '#34D186',
    },
    driverAvatarText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    driverInfo: {
      flex: 1,
      marginLeft: spacing(2),
    },
    driverName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      marginBottom: spacing(0.5),
    },
    driverDetails: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: spacing(1),
    },
    ratingContainer: {
      alignSelf: 'flex-start',
    },
    rating: {
      fontSize: 14,
      color: '#F59E0B',
      fontWeight: '500',
    },

    // Status Section
    statusSection: {
      marginBottom: spacing(3),
    },
    statusText: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: spacing(1),
    },
    statusSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20,
    },

    // Route Section
    routeSection: {
      marginBottom: spacing(4),
    },
    routeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing(1),
    },
    routeDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: spacing(2),
    },
    pickupDot: {
      backgroundColor: '#34D186',
    },
    dropoffDot: {
      backgroundColor: '#FF4444',
    },
    routeLine: {
      width: 2,
      height: 20,
      backgroundColor: '#D1D5DB',
      marginLeft: 5,
      marginVertical: spacing(0.5),
    },
    routeText: {
      flex: 1,
      fontSize: 14,
      color: '#374151',
    },

    // Action Buttons
    actionButtons: {
      flexDirection: 'row',
      gap: spacing(2),
    },
    cancelButton: {
      flex: 1,
      borderColor: '#FF4444',
    },
    callButtonMain: {
      flex: 1,
    },
  });

export default RideTrackingScreen;