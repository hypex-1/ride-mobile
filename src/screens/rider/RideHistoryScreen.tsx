import React from 'react';
import { SafeAreaView, View, StyleSheet, FlatList } from 'react-native';
import { Surface, Text, Chip, IconButton, Divider } from 'react-native-paper';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';
import type { RideHistoryScreenProps } from '../../types/navigation';

interface RideEntry {
  id: string;
  date: string;
  time: string;
  pickup: string;
  dropoff: string;
  fare: string;
  status: 'completed' | 'cancelled' | 'upcoming';
  driverName: string;
}

const sampleHistory: RideEntry[] = [
  {
    id: '1',
    date: 'Today',
    time: '08:45',
    pickup: 'Avenue Habib Bourguiba',
    dropoff: 'Ennasr 2',
    fare: '12.500 TND',
    status: 'completed',
    driverName: 'Sami B.'
  },
  {
    id: '2',
    date: 'Yesterday',
    time: '19:20',
    pickup: 'Lac 1',
    dropoff: 'Mutuelleville',
    fare: '9.800 TND',
    status: 'completed',
    driverName: 'Mourad K.'
  },
  {
    id: '3',
    date: 'Sept 24',
    time: '14:10',
    pickup: 'La Marsa',
    dropoff: 'Centre Ville',
    fare: 'Cancelled',
    status: 'cancelled',
    driverName: '—'
  }
];

const RideHistoryScreen: React.FC<RideHistoryScreenProps> = () => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const renderItem = ({ item }: { item: RideEntry }) => (
    <Surface elevation={1} style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.dateText}>{item.date}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <Chip
          style={styles.statusChip}
          textStyle={styles.statusText}
          selectedColor={theme.colors.onPrimary}
          selected
          icon={item.status === 'completed' ? 'check-circle' : 'close-circle'}
        >
          {item.status === 'completed' ? 'Completed' : 'Cancelled'}
        </Chip>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.routeRow}>
        <IconButton icon="checkbox-blank-circle" size={14} iconColor={theme.colors.primary} style={styles.icon} />
        <Text style={styles.locationText}>{item.pickup}</Text>
      </View>
      <View style={styles.routeConnector} />
      <View style={styles.routeRow}>
        <IconButton icon="map-marker" size={18} iconColor={theme.colors.secondary} style={styles.icon} />
        <Text style={styles.locationText}>{item.dropoff}</Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Driver</Text>
        <Text style={styles.metaValue}>{item.driverName}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Fare</Text>
        <Text style={styles.fareText}>{item.fare}</Text>
      </View>
    </Surface>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sampleHistory}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing(2) }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Ride History</Text>
            <Text style={styles.subtitle}>Track your recent trips and download receipts.</Text>
          </View>
        }
      />
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
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(2),
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    subtitle: {
      marginTop: spacing(0.5),
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
    },
    listContent: {
      paddingHorizontal: spacing(2),
      paddingBottom: spacing(4),
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: radii.lg,
      padding: spacing(2),
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    timeText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    statusChip: {
      backgroundColor: theme.colors.primary,
    },
    statusText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
    },
    divider: {
      marginVertical: spacing(1.5),
      backgroundColor: theme.colors.outline,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      margin: 0,
      marginRight: spacing(1),
    },
    locationText: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.onSurface,
    },
    routeConnector: {
      height: spacing(1.5),
      borderLeftWidth: 2,
      borderColor: theme.colors.outline,
      marginLeft: spacing(2.5),
      marginVertical: spacing(0.5),
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing(0.75),
    },
    metaLabel: {
      color: theme.colors.onSurfaceVariant,
    },
    metaValue: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    fareText: {
      color: theme.colors.secondary,
      fontWeight: '700',
      fontSize: 16,
    },
  });

export default RideHistoryScreen;
