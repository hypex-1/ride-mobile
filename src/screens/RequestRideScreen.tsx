import React from 'react';
import { View, StyleSheet, SafeAreaView, Dimensions, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import {
  Surface,
  Text,
  Button,
  Avatar,
  IconButton
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { RequestRideScreenProps } from '../types/navigation';
import { useAppTheme, spacing, radii } from '../theme';
import type { AppTheme } from '../theme';

const { height } = Dimensions.get('window');

const rideOptions = [
  {
    id: 'standard',
    label: 'Bolt',
    description: 'Affordable everyday rides',
    eta: '3 min',
    price: '8.200 TND',
  },
  {
    id: 'premium',
    label: 'Business',
    description: 'Larger cars with extra comfort',
    eta: '6 min',
    price: '13.900 TND',
  },
];

const quickActions = [
  { id: 'history', label: 'History', icon: 'history', route: 'RideHistory' as const },
  { id: 'saved', label: 'Saved', icon: 'heart', route: 'SavedPlaces' as const },
  { id: 'payments', label: 'Payments', icon: 'credit-card', route: 'PaymentMethods' as const },
  { id: 'support', label: 'Support', icon: 'help-circle', route: 'Support' as const },
  { id: 'promos', label: 'Promos', icon: 'tag', route: 'Promotions' as const },
];

const RequestRideScreen: React.FC<RequestRideScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const initialRegion = React.useMemo<Region>(() => ({
    latitude: 36.8065,
    longitude: 10.1815,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }), []);

  const handleNavigate = (route: typeof quickActions[number]['route']) => {
    navigation.navigate(route);
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" />
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsCompass={false}
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.avatarButton} onPress={() => navigation.navigate('Settings')}>
            <Avatar.Text
              size={40}
              label={user?.name
                ?.split(' ')
                .map(part => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'U'}
              style={styles.avatar}
            />
            <View style={styles.avatarInfo}>
              <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] || 'there'}</Text>
              <Text style={styles.statusText}>Let’s get you moving</Text>
            </View>
          </TouchableOpacity>

          <Surface style={styles.walletPill} elevation={1}>
            <Text style={styles.walletAmount}>34.8 TND</Text>
            <IconButton icon="plus" onPress={() => navigation.navigate('PaymentMethods')} size={18} />
          </Surface>
        </View>

        <TouchableOpacity style={styles.searchCard} activeOpacity={0.9} onPress={() => navigation.navigate('Home')}>
          <View style={styles.searchRow}>
            <View style={styles.searchIndicator}
            />
            <View style={styles.searchTexts}>
              <Text style={styles.searchLabel}>Pick-up now</Text>
              <Text style={styles.searchValue}>Current location</Text>
            </View>
          </View>
          <View style={styles.searchDivider} />
          <View style={styles.searchRow}>
            <View style={[styles.searchIndicator, styles.destinationIndicator]} />
            <View style={styles.searchTexts}>
              <Text style={styles.searchLabel}>Where to?</Text>
              <Text style={styles.searchPlaceholder}>Tap to choose destination</Text>
            </View>
          </View>
          <IconButton icon="chevron-right" size={24} onPress={() => navigation.navigate('Home')} />
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScroll}
        >
          {quickActions.map(action => (
            <TouchableOpacity key={action.id} style={styles.quickChip} onPress={() => handleNavigate(action.route)}>
              <Avatar.Icon
                size={36}
                icon={action.icon}
                color={theme.colors.primary}
                style={styles.quickIcon}
              />
              <Text style={styles.quickText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Surface style={styles.bottomSheet} elevation={4}>
          <Text style={styles.sheetTitle}>Choose your ride</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rideScroll}>
            {rideOptions.map(option => (
              <TouchableOpacity key={option.id} style={styles.rideCard} activeOpacity={0.85}>
                <View style={styles.rideIconCircle}>
                  <Avatar.Icon size={48} icon="car" color={theme.colors.primary} style={styles.rideIconBackground} />
                </View>
                <Text style={styles.rideLabel}>{option.label}</Text>
                <Text style={styles.rideDescription}>{option.description}</Text>
                <View style={styles.rideMetaRow}>
                  <Text style={styles.rideEta}>{option.eta}</Text>
                  <Text style={styles.ridePrice}>{option.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sheetFooter}>
            <View>
              <Text style={styles.paymentLabel}>Paying with</Text>
              <TouchableOpacity style={styles.paymentChip} onPress={() => navigation.navigate('PaymentMethods')}>
                <Text style={styles.paymentChipText}>Visa •••• 9284</Text>
                <IconButton icon="chevron-down" size={18} onPress={() => navigation.navigate('PaymentMethods')} />
              </TouchableOpacity>
            </View>
            <Button mode="contained" style={styles.requestButton} onPress={() => navigation.navigate('Home')}>
              Request Bolt
            </Button>
          </View>
        </Surface>
      </SafeAreaView>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: spacing(2),
      paddingBottom: spacing(3),
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(2),
    },
    avatarButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: radii.lg,
      padding: spacing(1),
    },
    avatar: {
      backgroundColor: theme.colors.primaryContainer,
      marginRight: spacing(1),
    },
    avatarInfo: {
      justifyContent: 'center',
    },
    greeting: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    statusText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    walletPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: radii.pill,
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(0.5),
    },
    walletAmount: {
      fontWeight: '600',
      marginRight: spacing(0.5),
      color: theme.colors.onSurface,
    },
    searchCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: radii.xl,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1.5),
      marginBottom: spacing(2),
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
      marginRight: spacing(1),
    },
    destinationIndicator: {
      backgroundColor: theme.colors.secondary,
    },
    searchTexts: {
      flex: 1,
    },
    searchLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    searchValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    searchPlaceholder: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    searchDivider: {
      width: 1,
      height: '100%',
      backgroundColor: theme.colors.outline,
      marginHorizontal: spacing(1.5),
    },
    quickScroll: {
      paddingBottom: spacing(1.5),
    },
    quickChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: radii.pill,
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(0.75),
      marginRight: spacing(1),
    },
    quickIcon: {
      backgroundColor: theme.colors.surfaceVariant,
      marginRight: spacing(1),
    },
    quickText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    bottomSheet: {
      minHeight: height * 0.32,
      borderRadius: radii.xl,
      backgroundColor: theme.colors.surface,
      padding: spacing(2),
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing(1.5),
    },
    rideScroll: {
      paddingRight: spacing(1),
    },
    rideCard: {
      width: 180,
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surfaceVariant,
      padding: spacing(2),
      marginRight: spacing(1.5),
    },
    rideIconCircle: {
      alignItems: 'flex-start',
      marginBottom: spacing(1.25),
    },
    rideIconBackground: {
      backgroundColor: theme.colors.primaryContainer,
    },
    rideLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    rideDescription: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginVertical: spacing(0.75),
    },
    rideMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rideEta: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    ridePrice: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.secondary,
    },
    sheetFooter: {
      marginTop: spacing(2.5),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    paymentLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: spacing(0.5),
    },
    paymentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: radii.pill,
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(0.5),
    },
    paymentChipText: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginRight: -spacing(0.5),
    },
    requestButton: {
      borderRadius: radii.lg,
      paddingHorizontal: spacing(3),
    },
  });

export default RequestRideScreen;