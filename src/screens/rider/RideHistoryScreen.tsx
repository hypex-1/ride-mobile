import React from 'react';
import { SafeAreaView, View, StyleSheet, FlatList, StatusBar } from 'react-native';
import { Surface, Text, IconButton, useTheme } from 'react-native-paper';
import { spacing, radii } from '../../theme';
import type { RideHistoryScreenProps } from '../../types/navigation';

interface RideEntry {
  id: string;
  date: string;
  time: string;
  pickup: string;
  dropoff: string;
  fare: string;
  currency: string;
  status: 'completed' | 'cancelled';
  driverName: string;
  vehicleInfo: string;
  duration: string;
  distance: string;
}

const sampleHistory: RideEntry[] = [
  {
    id: '1',
    date: 'Today',
    time: '08:45',
    pickup: 'Avenue Habib Bourguiba',
    dropoff: 'Ennasr 2',
    fare: '12.500',
    currency: 'TND',
    status: 'completed',
    driverName: 'Sami B.',
    vehicleInfo: 'Peugeot 301 • White',
    duration: '18 min',
    distance: '7.2 km'
  },
  {
    id: '2',
    date: 'Yesterday',
    time: '19:20',
    pickup: 'Lac 1',
    dropoff: 'Mutuelleville',
    fare: '9.800',
    currency: 'TND',
    status: 'completed',
    driverName: 'Mourad K.',
    vehicleInfo: 'Citroën C4 • Grey',
    duration: '14 min',
    distance: '5.1 km'
  },
  {
    id: '3',
    date: 'Sept 24',
    time: '14:10',
    pickup: 'La Marsa',
    dropoff: 'Centre Ville',
    fare: '0.000',
    currency: 'TND',
    status: 'cancelled',
    driverName: '—',
    vehicleInfo: '—',
    duration: '—',
    distance: '—'
  }
];

const RideHistoryScreen: React.FC<RideHistoryScreenProps> = () => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const renderItem = ({ item }: { item: RideEntry }) => (
    <Surface elevation={1} style={styles.rideCard}>
      {/* Date and Status Row */}
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{item.date} • {item.time}</Text>
        {item.status === 'cancelled' && (
          <Text style={styles.cancelledText}>Cancelled</Text>
        )}
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
          {item.status === 'cancelled' ? 'No charge' : `${item.fare} ${item.currency}`}
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
        data={sampleHistory}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
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
    cancelledText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.error,
      backgroundColor: theme.colors.errorContainer,
      paddingHorizontal: spacing(1),
      paddingVertical: spacing(0.5),
      borderRadius: radii.sm,
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
  });

export default RideHistoryScreen;
