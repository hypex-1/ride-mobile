import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, View, StyleSheet, FlatList, StatusBar, RefreshControl } from 'react-native';
import { Surface, Text, IconButton, useTheme, ActivityIndicator } from 'react-native-paper';
import { spacing, radii } from '../../theme';
import type { RideHistoryScreenProps } from '../../types/navigation';
import { rideService } from '../../services';
import type { Ride } from '../../services/ride';

interface RideEntry {
  id: string;
  date: string;
  time: string;
  pickup: string;
  dropoff: string;
  fare: string;
  currency: string;
  status: 'completed'; // Only completed rides are shown
  driverName: string;
  vehicleInfo: string;
  duration: string;
  distance: string;
}

const RideHistoryScreen: React.FC<RideHistoryScreenProps> = () => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  // State management
  const [rides, setRides] = useState<RideEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transform backend ride data to display format
  const transformRideData = (ride: Ride): RideEntry => {
    // Validate ride object
    if (!ride) {
      throw new Error('Ride object is null or undefined');
    }

    // Validate required fields
    if (!ride.id) {
      throw new Error('Ride ID is missing');
    }

    if (!ride.createdAt) {
      throw new Error('Ride createdAt is missing');
    }

    const createdDate = new Date(ride.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateString = createdDate.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
    
    if (createdDate.toDateString() === today.toDateString()) {
      dateString = 'Today';
    } else if (createdDate.toDateString() === yesterday.toDateString()) {
      dateString = 'Yesterday';
    }
    
    const timeString = createdDate.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    // Safe access to location addresses with fallbacks
    let pickupAddress = 'Unknown pickup location';
    let dropoffAddress = 'Unknown dropoff location';

    try {
      if (ride.pickupLocation) {
        if (ride.pickupLocation.address) {
          pickupAddress = ride.pickupLocation.address;
        } else if (ride.pickupLocation.latitude && ride.pickupLocation.longitude) {
          pickupAddress = `${ride.pickupLocation.latitude}, ${ride.pickupLocation.longitude}`;
        }
      }
    } catch (error) {
      console.warn('Error processing pickup location:', error);
    }

    try {
      if (ride.dropoffLocation) {
        if (ride.dropoffLocation.address) {
          dropoffAddress = ride.dropoffLocation.address;
        } else if (ride.dropoffLocation.latitude && ride.dropoffLocation.longitude) {
          dropoffAddress = `${ride.dropoffLocation.latitude}, ${ride.dropoffLocation.longitude}`;
        }
      }
    } catch (error) {
      console.warn('Error processing dropoff location:', error);
    }

    return {
      id: ride.id.toString(),
      date: dateString,
      time: timeString,
      pickup: pickupAddress,
      dropoff: dropoffAddress,
      fare: ride.actualFare?.toFixed(3) || ride.estimatedFare?.toFixed(3) || '0.000',
      currency: 'TND',
      status: 'completed', // Only completed rides are shown now
      driverName: ride.driver?.name || '—',
      vehicleInfo: (ride.driver?.vehicle?.make && ride.driver?.vehicle?.model) 
        ? `${ride.driver.vehicle.make} ${ride.driver.vehicle.model}${ride.driver.vehicle.color ? ` • ${ride.driver.vehicle.color}` : ''}`
        : '—',
      duration: ride.actualDuration ? `${ride.actualDuration} min` : '—',
      distance: '—', // Distance calculation would need to be added to backend
    };
  };

  // Load ride history from backend
  const loadRideHistory = async () => {
    try {
      setError(null);
      const rideData = await rideService.getRideHistory();
      console.log('Raw ride data received:', JSON.stringify(rideData, null, 2));
      
      // Validate that rideData is an array
      if (!Array.isArray(rideData)) {
        console.error('Expected array of rides, but got:', typeof rideData, rideData);
        throw new Error('Invalid ride data format received from server');
      }
      
      // Filter out rides that shouldn't be displayed
      const validRides = rideData.filter((ride, index) => {
        try {
          // Check if ride is an object
          if (!ride || typeof ride !== 'object') {
            console.warn(`Ride at index ${index} is not a valid object:`, ride);
            return false;
          }
          
          // Only show completed rides with valid data
          const isCompleted = ride.status === 'COMPLETED';
          const hasValidLocations = ride.pickupLocation && ride.dropoffLocation;
          const hasValidFare = ride.actualFare || ride.estimatedFare;
          
          if (!isCompleted) {
            console.log(`Ride ${ride.id} filtered out - status: ${ride.status}`);
          }
          if (!hasValidLocations) {
            console.log(`Ride ${ride.id} filtered out - missing locations:`, {
              pickup: !!ride.pickupLocation,
              dropoff: !!ride.dropoffLocation
            });
          }
          if (!hasValidFare) {
            console.log(`Ride ${ride.id} filtered out - missing fare:`, {
              actualFare: ride.actualFare,
              estimatedFare: ride.estimatedFare
            });
          }
          
          return isCompleted && hasValidLocations && hasValidFare;
        } catch (filterError) {
          console.error(`Error filtering ride at index ${index}:`, filterError);
          return false;
        }
      });
      
      console.log(`Filtered ${rideData.length} rides down to ${validRides.length} valid rides`);
      
      const transformedRides = validRides.map((ride, index) => {
        try {
          return transformRideData(ride);
        } catch (transformError) {
          console.error(`Error transforming ride at index ${index}:`, transformError);
          console.error('Problematic ride data:', ride);
          // Skip problematic rides instead of showing error entries
          return null;
        }
      }).filter(Boolean) as RideEntry[]; // Remove null entries
      
      setRides(transformedRides);
    } catch (err) {
      console.error('Failed to load ride history:', err);
      setError('Failed to load ride history');
      setRides([]); // Show empty state instead of mock data
    } finally {
      setIsLoading(false);
    }
  };

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadRideHistory();
    setIsRefreshing(false);
  }, []);

  // Load ride history on component mount
  useEffect(() => {
    loadRideHistory();
  }, []);

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Surface elevation={1} style={styles.emptyStateCard}>
        <Text style={styles.emptyStateTitle}>No completed trips yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          When you complete a trip, it will appear here so you can revisit details anytime.
        </Text>
      </Surface>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={theme.colors.background} barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading ride history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: RideEntry }) => (
    <Surface elevation={1} style={styles.rideCard}>
      {/* Date and Time Row */}
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{item.date} • {item.time}</Text>
      </View>

      {/* Route Section - Bolt Style */}
      <View style={styles.routeSection}>
        {/* Pickup */}
        <View style={styles.routeRow}>
          <View style={styles.pickupDot} />
          <Text style={styles.locationText} numberOfLines={1}>{item.pickup}</Text>
        </View>

        {/* Route Line */}
        <View style={styles.routeLine} />

        {/* Dropoff */}
        <View style={styles.routeRow}>
          <View style={styles.dropoffSquare} />
          <Text style={styles.locationText} numberOfLines={1}>{item.dropoff}</Text>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Driver</Text>
          <Text style={styles.detailValue}>{item.driverName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Vehicle</Text>
          <Text style={styles.detailValue}>{item.vehicleInfo}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration • Distance</Text>
          <Text style={styles.detailValue}>{item.duration} • {item.distance}</Text>
        </View>
      </View>

      {/* Fare Section */}
      <View style={styles.fareSection}>
        <Text style={styles.fareAmount}>
          {item.fare} {item.currency}
        </Text>
      </View>
    </Surface>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.surface} barStyle="dark-content" />
      
      {/* Header - Bolt Style */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Your trips</Text>
      </View>

      <FlatList
        data={rides}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(3),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    screenTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    listContent: {
      paddingHorizontal: spacing(2),
      paddingTop: spacing(2),
      paddingBottom: spacing(4),
    },
    separator: {
      height: spacing(2),
    },
    
    // Ride Card - Bolt Style
    rideCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: radii.lg,
      padding: spacing(3),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(2),
    },
    dateText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },

    // Route Section - Bolt Style
    routeSection: {
      marginBottom: spacing(2.5),
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pickupDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginRight: spacing(2),
    },
    dropoffSquare: {
      width: 8,
      height: 8,
      backgroundColor: theme.colors.onSurfaceVariant,
      marginRight: spacing(2),
    },
    routeLine: {
      width: 2,
      height: spacing(1.5),
      backgroundColor: theme.colors.outline,
      marginLeft: spacing(1),
      marginVertical: spacing(0.5),
    },
    locationText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },

    // Details Section
    detailsSection: {
      marginBottom: spacing(2.5),
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(0.75),
    },
    detailLabel: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },

    // Fare Section - Bolt Style
    fareSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outline,
      paddingTop: spacing(2),
      alignItems: 'flex-end',
    },
    fareAmount: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },

    // Loading state
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing(4),
    },
    loadingText: {
      marginTop: spacing(2),
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },

    // Empty state
    emptyStateContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(8),
    },
    emptyStateCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: radii.lg,
      padding: spacing(4),
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
      maxWidth: 300,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(1),
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default RideHistoryScreen;
