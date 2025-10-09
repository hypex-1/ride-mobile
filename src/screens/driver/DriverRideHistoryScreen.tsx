import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Surface,
  Card,
  Text,
  IconButton,
  ActivityIndicator,
  List,
  Divider,
  Chip,
  Button,
} from 'react-native-paper';
import { driverService } from '../../services';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';
import type { DriverRideHistoryScreenProps } from '../../types/navigation';

interface RideHistoryItem {
  id: string;
  riderId: string;
  riderName: string;
  pickupAddress: string;
  dropoffAddress: string;
  distance: number;
  duration: number;
  fare: number;
  status: 'completed' | 'cancelled';
  rating?: number;
  completedAt: string;
  paymentMethod: 'cash' | 'card';
}

const DriverRideHistoryScreen: React.FC<DriverRideHistoryScreenProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRideHistory();
  }, []);

  const loadRideHistory = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call when available
      // const rideHistory = await driverService.getRideHistory();
      
      // Mock data for now
      const mockRides: RideHistoryItem[] = [
        {
          id: '1',
          riderId: 'r1',
          riderName: 'John Smith',
          pickupAddress: '123 Main St, Downtown',
          dropoffAddress: '456 Oak Ave, Uptown',
          distance: 5.2,
          duration: 18,
          fare: 25.50,
          status: 'completed',
          rating: 5,
          completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          paymentMethod: 'card',
        },
        {
          id: '2',
          riderId: 'r2',
          riderName: 'Sarah Johnson',
          pickupAddress: '789 Pine St, Midtown',
          dropoffAddress: '321 Elm Dr, Suburb',
          distance: 3.8,
          duration: 12,
          fare: 18.25,
          status: 'completed',
          rating: 4,
          completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          paymentMethod: 'cash',
        },
        {
          id: '3',
          riderId: 'r3',
          riderName: 'Mike Davis',
          pickupAddress: '555 Broadway, Theater District',
          dropoffAddress: '777 Park Ave, Central',
          distance: 2.1,
          duration: 8,
          fare: 12.75,
          status: 'completed',
          rating: 5,
          completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          paymentMethod: 'card',
        },
        {
          id: '4',
          riderId: 'r4',
          riderName: 'Lisa Wilson',
          pickupAddress: '444 Market St, Financial',
          dropoffAddress: '888 Harbor Blvd, Waterfront',
          distance: 7.3,
          duration: 25,
          fare: 35.00,
          status: 'cancelled',
          completedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          paymentMethod: 'card',
        },
      ];
      
      setRides(mockRides);
    } catch (error) {
      console.error('Error loading ride history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRideHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return '—';
    return '⭐'.repeat(rating);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.primary;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={theme.colors.onSurface}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Ride History
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Summary Stats */}
        <Surface style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text variant="headlineSmall" style={styles.summaryValue}>
                {rides.filter(r => r.status === 'completed').length}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>Completed</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="headlineSmall" style={styles.summaryValue}>
                ${rides.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.fare, 0).toFixed(2)}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>Total Earned</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="headlineSmall" style={styles.summaryValue}>
                {(rides.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / 
                  rides.filter(r => r.rating).length || 0).toFixed(1)}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>Avg Rating</Text>
            </View>
          </View>
        </Surface>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Ride List */}
          <Surface style={styles.ridesCard}>
            {rides.map((ride, index) => (
              <View key={ride.id}>
                <View style={styles.rideItem}>
                  <View style={styles.rideHeader}>
                    <View style={styles.riderInfo}>
                      <Text variant="titleSmall" style={styles.riderName}>
                        {ride.riderName}
                      </Text>
                      <Text variant="bodySmall" style={styles.rideTime}>
                        {formatDate(ride.completedAt)}
                      </Text>
                    </View>
                    <View style={styles.rideActions}>
                      <Chip
                        mode="outlined"
                        style={[styles.statusChip, { borderColor: getStatusColor(ride.status) }]}
                        textStyle={[styles.statusText, { color: getStatusColor(ride.status) }]}
                      >
                        {ride.status}
                      </Chip>
                    </View>
                  </View>

                  <View style={styles.rideDetails}>
                    <View style={styles.locationInfo}>
                      <View style={styles.locationRow}>
                        <View style={styles.locationDot} />
                        <Text variant="bodySmall" style={styles.locationText} numberOfLines={1}>
                          {ride.pickupAddress}
                        </Text>
                      </View>
                      <View style={styles.locationLine} />
                      <View style={styles.locationRow}>
                        <View style={[styles.locationDot, styles.dropoffDot]} />
                        <Text variant="bodySmall" style={styles.locationText} numberOfLines={1}>
                          {ride.dropoffAddress}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.rideFooter}>
                    <View style={styles.rideStats}>
                      <Text variant="bodySmall" style={styles.statText}>
                        {ride.distance.toFixed(1)} km • {formatDuration(ride.duration)}
                      </Text>
                      {ride.status === 'completed' && (
                        <Text variant="bodySmall" style={styles.statText}>
                          {getRatingStars(ride.rating)} • {ride.paymentMethod}
                        </Text>
                      )}
                    </View>
                    <Text variant="titleMedium" style={styles.fareAmount}>
                      ${ride.fare.toFixed(2)}
                    </Text>
                  </View>
                </View>
                {index < rides.length - 1 && <Divider />}
              </View>
            ))}
          </Surface>

          {/* Load More Button */}
          <View style={styles.loadMoreContainer}>
            <Button
              mode="outlined"
              onPress={() => {/* TODO: Load more rides */}}
              style={styles.loadMoreButton}
            >
              Load More Rides
            </Button>
          </View>
        </ScrollView>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    headerSpacer: {
      width: 48,
    },
    summaryCard: {
      margin: spacing(3),
      padding: spacing(3),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    summaryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryValue: {
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: spacing(0.5),
    },
    summaryLabel: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
    },
    ridesCard: {
      margin: spacing(3),
      marginTop: 0,
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 2,
      overflow: 'hidden',
    },
    rideItem: {
      padding: spacing(3),
    },
    rideHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(2),
    },
    riderInfo: {
      flex: 1,
    },
    riderName: {
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    rideTime: {
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing(0.25),
    },
    rideActions: {
      alignItems: 'flex-end',
    },
    statusChip: {
      backgroundColor: 'transparent',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    rideDetails: {
      marginBottom: spacing(2),
    },
    locationInfo: {
      paddingLeft: spacing(1),
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginRight: spacing(2),
    },
    dropoffDot: {
      backgroundColor: theme.colors.error,
    },
    locationLine: {
      width: 1,
      height: 16,
      backgroundColor: theme.colors.outline,
      marginLeft: 4,
      marginVertical: spacing(0.5),
    },
    locationText: {
      flex: 1,
      color: theme.colors.onSurfaceVariant,
    },
    rideFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rideStats: {
      flex: 1,
    },
    statText: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(0.25),
    },
    fareAmount: {
      fontWeight: '700',
      color: theme.colors.primary,
    },
    loadMoreContainer: {
      padding: spacing(3),
      alignItems: 'center',
    },
    loadMoreButton: {
      borderColor: theme.colors.outline,
    },
  });

export default DriverRideHistoryScreen;