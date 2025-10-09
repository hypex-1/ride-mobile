import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Surface,
  Card,
  Button,
  Text,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import { driverService } from '../../services';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';
import type { DriverPickupScreenProps } from '../../types/navigation';

const DriverPickupScreen: React.FC<DriverPickupScreenProps> = ({ navigation, route }) => {
  const { rideId } = route.params;
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  const [rideDetails, setRideDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [arriving, setArriving] = useState(false);

  useEffect(() => {
    loadRideDetails();
  }, []);

  const loadRideDetails = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const details = await driverService.getRideDetails(rideId);
      
      // Mock data for now
      const mockDetails = {
        id: rideId,
        riderName: 'John Smith',
        riderPhone: '+1234567890',
        pickupLocation: {
          latitude: 37.7749,
          longitude: -122.4194,
          address: '123 Main St, San Francisco, CA',
        },
        dropoffLocation: {
          latitude: 37.7849,
          longitude: -122.4094,
          address: '456 Oak Ave, San Francisco, CA',
        },
        estimatedFare: 25.50,
        distance: 3.2,
        duration: 15,
      };
      
      setRideDetails(mockDetails);
    } catch (error) {
      console.error('Error loading ride details:', error);
      Alert.alert('Error', 'Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const handleArrived = async () => {
    try {
      setArriving(true);
      await driverService.startRide(rideId);
      Alert.alert('Success', 'Rider has been notified of your arrival!');
      // Navigate to ride tracking or back to home
      navigation.navigate('DriverHome');
    } catch (error) {
      console.error('Error marking arrival:', error);
      Alert.alert('Error', 'Failed to notify rider. Please try again.');
    } finally {
      setArriving(false);
    }
  };

  const handleCallRider = () => {
    if (rideDetails?.riderPhone) {
      Alert.alert('Call Rider', `Call ${rideDetails.riderName} at ${rideDetails.riderPhone}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => {
          // TODO: Implement phone call functionality
          Alert.alert('Coming Soon', 'Phone call feature will be available soon.');
        }},
      ]);
    }
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await driverService.declineRide(rideId, 'Driver cancelled');
              navigation.navigate('DriverHome');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel ride');
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!rideDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineSmall">Ride not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Pickup Rider
          </Text>
          <IconButton
            icon="phone"
            size={24}
            iconColor={theme.colors.primary}
            onPress={handleCallRider}
            style={styles.headerAction}
          />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: rideDetails.pickupLocation.latitude,
              longitude: rideDetails.pickupLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={rideDetails.pickupLocation}
              title="Pickup Location"
              description={rideDetails.pickupLocation.address}
              pinColor={theme.colors.primary}
            />
          </MapView>
        </View>

        {/* Ride Details */}
        <Surface style={styles.detailsCard}>
          <Text variant="titleMedium" style={styles.riderName}>
            {rideDetails.riderName}
          </Text>
          
          <View style={styles.locationInfo}>
            <View style={styles.locationRow}>
              <View style={styles.pickupDot} />
              <Text variant="bodyMedium" style={styles.locationText}>
                {rideDetails.pickupLocation.address}
              </Text>
            </View>
            <View style={styles.locationLine} />
            <View style={styles.locationRow}>
              <View style={styles.dropoffDot} />
              <Text variant="bodyMedium" style={styles.locationText}>
                {rideDetails.dropoffLocation.address}
              </Text>
            </View>
          </View>

          <View style={styles.rideStats}>
            <Text variant="bodySmall" style={styles.statText}>
              {rideDetails.distance} km • {rideDetails.duration} min • ${rideDetails.estimatedFare}
            </Text>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleArrived}
            loading={arriving}
            disabled={arriving}
            style={styles.arrivedButton}
            contentStyle={styles.buttonContent}
          >
            I've Arrived
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleCancelRide}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
            textColor={theme.colors.error}
          >
            Cancel Ride
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: spacing(3),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
      minHeight: 56,
    },
    headerPlaceholder: {
      width: 48,
      height: 48,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    headerAction: {
      margin: 0,
    },
    mapContainer: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    detailsCard: {
      margin: spacing(3),
      padding: spacing(3),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 4,
    },
    riderName: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(2),
      textAlign: 'center',
    },
    locationInfo: {
      marginBottom: spacing(2),
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pickupDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
      marginRight: spacing(2),
    },
    dropoffDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.error,
      marginRight: spacing(2),
    },
    locationLine: {
      width: 2,
      height: 20,
      backgroundColor: theme.colors.outline,
      marginLeft: 5,
      marginVertical: spacing(0.5),
    },
    locationText: {
      flex: 1,
      color: theme.colors.onSurface,
    },
    rideStats: {
      alignItems: 'center',
    },
    statText: {
      color: theme.colors.onSurfaceVariant,
    },
    actionsContainer: {
      padding: spacing(3),
      gap: spacing(2),
    },
    arrivedButton: {
      backgroundColor: theme.colors.primary,
    },
    cancelButton: {
      borderColor: theme.colors.error,
    },
    buttonContent: {
      paddingVertical: spacing(1),
    },
  });

export default DriverPickupScreen;