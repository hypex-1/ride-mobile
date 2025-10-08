import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Share, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Text, 
  Button, 
  Surface,
  IconButton,
  Snackbar,
  ActivityIndicator
} from 'react-native-paper';
import { RideReceiptScreenProps } from '../../types/navigation';
import { usePayment } from '../../contexts/PaymentContext';
import { PaymentReceipt } from '../../services/payment';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';

const RideReceiptScreen: React.FC<RideReceiptScreenProps> = ({ route, navigation }) => {
  const { rideId } = route.params;
  const { fetchPaymentReceipt } = usePayment();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  useEffect(() => {
    fetchRideReceipt();
  }, [rideId]);

  const fetchRideReceipt = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🧾 Fetching receipt for ride:', rideId);
      const receiptData = await fetchPaymentReceipt(rideId);
      setReceipt(receiptData);
      
    } catch (error) {
      console.error('❌ Error fetching receipt:', error);
      setError('Failed to load receipt. Please try again.');
      
      // Fallback: Show mock receipt for demo
      const mockReceipt: PaymentReceipt = {
        id: `receipt_${rideId}`,
        rideId: rideId.toString(),
        riderId: 'user123',
        driverId: 'driver456',
        payment: {
          id: `payment_${rideId}`,
          rideId: rideId.toString(),
          amount: 35.50,
          method: 'CASH',
          status: 'COMPLETED',
          currency: 'TND',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            driverConfirmed: true,
            riderConfirmed: true
          }
        },
        ride: {
          pickupAddress: 'Downtown Tunis, Tunisia',
          dropoffAddress: 'Tunis Airport, Tunisia',
          distance: 18.5,
          duration: 35,
          startTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          endTime: new Date().toISOString(),
          baseFare: 8.00,
          distanceFare: 22.50,
          timeFare: 5.00,
          totalFare: 35.50
        },
        driver: {
          name: 'Ahmed Ben Salem',
          rating: 4.8,
          licensePlate: '123 TUN 456',
          vehicleModel: 'Toyota Corolla 2020'
        },
        breakdown: {
          baseFare: 8.00,
          distanceFare: 22.50,
          timeFare: 5.00,
          tips: 0,
          discount: 0,
          taxes: 0,
          totalAmount: 35.50
        },
        generatedAt: new Date().toISOString()
      };
      setReceipt(mockReceipt);
    } finally {
      setIsLoading(false);
    }
  };

  const shareReceipt = async () => {
    if (!receipt) return;

    try {
      const shareContent = `
🧾 Ride Receipt #${receipt.rideId}

📍 From: ${receipt.ride.pickupAddress}
📍 To: ${receipt.ride.dropoffAddress}

🚗 Driver: ${receipt.driver.name}
🚗 Vehicle: ${receipt.driver.vehicleModel} (${receipt.driver.licensePlate})

💰 Total: ${receipt.breakdown.totalAmount.toFixed(2)} ${receipt.payment.currency}
💳 Payment: ${receipt.payment.method}

⭐ Thanks for riding with us!
      `.trim();

      await Share.share({
        message: shareContent,
        title: `Ride Receipt #${receipt.rideId}`,
      });
    } catch (error) {
      console.error('❌ Error sharing receipt:', error);
      setSnackbarVisible(true);
    }
  };

  const goHome = () => {
    navigation.navigate('Home');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading receipt...</Text>
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Receipt not found</Text>
        <Text style={styles.errorSubtitle}>
          {error || 'Unable to load receipt data'}
        </Text>
        <Button mode="contained" onPress={goHome} style={styles.button} buttonColor={theme.colors.primary}>
          Go Home
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onSurface}
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Trip receipt</Text>
          <IconButton
            icon="share-variant"
            iconColor={theme.colors.primary}
            size={24}
            onPress={shareReceipt}
            style={styles.shareButton}
          />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Trip completed</Text>
          <Text style={styles.successSubtitle}>Hope you enjoyed your ride</Text>
        </View>

        {/* Trip Summary */}
        <Surface style={styles.summaryCard} elevation={0}>
          <Text style={styles.cardTitle}>Trip summary</Text>
          
          {/* Route */}
          <View style={styles.routeSection}>
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, styles.pickupDot]} />
              <Text style={styles.routeText} numberOfLines={2}>
                {receipt.ride.pickupAddress}
              </Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, styles.dropoffDot]} />
              <Text style={styles.routeText} numberOfLines={2}>
                {receipt.ride.dropoffAddress}
              </Text>
            </View>
          </View>

          {/* Trip Details */}
          <View style={styles.tripDetails}>
            <View style={styles.tripDetailItem}>
              <Text style={styles.tripDetailLabel}>Distance</Text>
              <Text style={styles.tripDetailValue}>{receipt.ride.distance.toFixed(1)} km</Text>
            </View>
            <View style={styles.tripDetailItem}>
              <Text style={styles.tripDetailLabel}>Time</Text>
              <Text style={styles.tripDetailValue}>{receipt.ride.duration} min</Text>
            </View>
            <View style={styles.tripDetailItem}>
              <Text style={styles.tripDetailLabel}>Date</Text>
              <Text style={styles.tripDetailValue}>{formatDate(receipt.ride.endTime)}</Text>
            </View>
          </View>
        </Surface>

        {/* Driver Info */}
        <Surface style={styles.driverCard} elevation={0}>
          <Text style={styles.cardTitle}>Driver</Text>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>
                {receipt.driver.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{receipt.driver.name}</Text>
              <Text style={styles.driverVehicle}>
                {receipt.driver.vehicleModel} • {receipt.driver.licensePlate}
              </Text>
              <Text style={styles.driverRating}>★ {receipt.driver.rating.toFixed(1)}</Text>
            </View>
          </View>
        </Surface>

        {/* Payment Details */}
        <Surface style={styles.paymentCard} elevation={0}>
          <Text style={styles.cardTitle}>Payment</Text>
          
          <View style={styles.fareBreakdown}>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Base fare</Text>
              <Text style={styles.fareValue}>
                {receipt.breakdown.baseFare.toFixed(2)} {receipt.payment.currency}
              </Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Distance & time</Text>
              <Text style={styles.fareValue}>
                {(receipt.breakdown.distanceFare + receipt.breakdown.timeFare).toFixed(2)} {receipt.payment.currency}
              </Text>
            </View>
            {(receipt.breakdown.tips || 0) > 0 && (
              <View style={styles.fareItem}>
                <Text style={styles.fareLabel}>Tip</Text>
                <Text style={styles.fareValue}>
                  {(receipt.breakdown.tips || 0).toFixed(2)} {receipt.payment.currency}
                </Text>
              </View>
            )}
            {(receipt.breakdown.discount || 0) > 0 && (
              <View style={styles.fareItem}>
                <Text style={[styles.fareLabel, styles.discountText]}>Discount</Text>
                <Text style={[styles.fareValue, styles.discountText]}>
                  -{(receipt.breakdown.discount || 0).toFixed(2)} {receipt.payment.currency}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.totalSection}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {receipt.breakdown.totalAmount.toFixed(2)} {receipt.payment.currency}
              </Text>
            </View>
            <Text style={styles.paymentMethod}>
              Paid with {receipt.payment.method === 'CASH' ? 'cash' : receipt.payment.method.toLowerCase()}
            </Text>
          </View>
        </Surface>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <Button
            mode="contained"
            onPress={goHome}
            style={styles.doneButton}
            buttonColor={theme.colors.primary}
            contentStyle={styles.doneButtonContent}
          >
            Done
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        Failed to share receipt
      </Snackbar>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surfaceVariant,
    },
    
    // Loading/Error States
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing(3),
      backgroundColor: theme.colors.surfaceVariant,
    },
    loadingText: {
      marginTop: spacing(2),
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    errorTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(1),
    },
    errorSubtitle: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing(3),
    },

    // Header - Bolt Style
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1.5),
    },
    backButton: {
      margin: 0,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginRight: spacing(6), // Balance the share button
    },
    shareButton: {
      margin: 0,
      backgroundColor: theme.colors.primaryContainer,
    },

    // Scroll View
    scrollView: {
      flex: 1,
    },

    // Success Section
    successSection: {
      alignItems: 'center',
      paddingVertical: spacing(4),
      paddingHorizontal: spacing(3),
    },
    successIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing(2),
    },
    successIconText: {
      fontSize: 32,
      color: theme.colors.onPrimary,
      fontWeight: 'bold',
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing(1),
    },
    successSubtitle: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },

    // Cards - Bolt Style
    summaryCard: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: spacing(3),
      marginBottom: spacing(2),
      padding: spacing(3),
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    driverCard: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: spacing(3),
      marginBottom: spacing(2),
      padding: spacing(3),
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    paymentCard: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: spacing(3),
      marginBottom: spacing(2),
      padding: spacing(3),
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(2),
    },

    // Route Section
    routeSection: {
      marginBottom: spacing(3),
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
      backgroundColor: theme.colors.primary,
    },
    dropoffDot: {
      backgroundColor: theme.colors.error,
    },
    routeLine: {
      width: 2,
      height: 20,
      backgroundColor: theme.colors.outlineVariant,
      marginLeft: 5,
      marginVertical: spacing(0.5),
    },
    routeText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },

    // Trip Details
    tripDetails: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outline,
      paddingTop: spacing(2),
    },
    tripDetailItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing(1),
    },
    tripDetailLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    tripDetailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },

    // Driver Info
    driverInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    driverAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing(2),
    },
    driverAvatarText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    driverDetails: {
      flex: 1,
    },
    driverName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(0.5),
    },
    driverVehicle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(0.5),
    },
    driverRating: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },

    // Payment
    fareBreakdown: {
      marginBottom: spacing(2),
    },
    fareItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing(1),
    },
    fareLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    fareValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    discountText: {
      color: theme.colors.error,
    },
    totalSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outline,
      paddingTop: spacing(2),
    },
    totalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(1),
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    paymentMethod: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },

    // Action Section
    actionSection: {
      paddingHorizontal: spacing(3),
      paddingBottom: spacing(4),
    },
    doneButton: {
      borderRadius: radii.md,
    },
    doneButtonContent: {
      height: 52,
    },
    button: {
      borderRadius: radii.md,
    },
  });

export default RideReceiptScreen;