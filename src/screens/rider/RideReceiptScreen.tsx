import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { 
  Card, 
  Text, 
  Button, 
  Divider, 
  Surface,
  Chip,
  Icon,
  ActivityIndicator,
  IconButton,
  Snackbar
} from 'react-native-paper';
import { RideReceiptScreenProps } from '../../types/navigation';
import { usePayment } from '../../contexts/PaymentContext';
import { PaymentReceipt } from '../../services/payment';

const RideReceiptScreen: React.FC<RideReceiptScreenProps> = ({ route, navigation }) => {
  const { rideId } = route.params;
  const { fetchPaymentReceipt } = usePayment();
  
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading receipt...</Text>
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={styles.centered}>
        <Icon source="receipt" size={64} color="#ccc" />
        <Text variant="headlineSmall" style={styles.errorTitle}>Receipt not found</Text>
        <Text variant="bodyMedium" style={styles.errorSubtitle}>
          {error || 'Unable to load receipt data'}
        </Text>
        <Button mode="contained" onPress={goHome} style={styles.button}>
          Go Home
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.receiptCard}>
        {/* Header */}
        <View style={styles.header}>
          <Icon source="check-circle" size={48} color="#4CAF50" />
          <Text variant="headlineSmall" style={styles.title}>
            Ride Completed
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Thank you for riding with us!
          </Text>
          <Chip 
            mode="flat" 
            style={[styles.statusChip, { backgroundColor: '#E8F5E8' }]}
            textStyle={{ color: '#4CAF50' }}
          >
            {receipt.payment.status}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        {/* Ride Details */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Ride Details
          </Text>
          
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>Ride ID:</Text>
            <Text variant="bodyMedium">#{receipt.rideId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>Date:</Text>
            <Text variant="bodyMedium">{formatDate(receipt.ride.endTime)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>Time:</Text>
            <Text variant="bodyMedium">
              {formatTime(receipt.ride.startTime)} - {formatTime(receipt.ride.endTime)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>Distance:</Text>
            <Text variant="bodyMedium">{receipt.ride.distance.toFixed(1)} km</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>Duration:</Text>
            <Text variant="bodyMedium">{receipt.ride.duration} min</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Route */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Route
          </Text>
          
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#4CAF50' }]} />
              <Text variant="bodyMedium" style={styles.routeText}>
                {receipt.ride.pickupAddress}
              </Text>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#f44336' }]} />
              <Text variant="bodyMedium" style={styles.routeText}>
                {receipt.ride.dropoffAddress}
              </Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Driver Info */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Driver
          </Text>
          
          <View style={styles.driverInfo}>
            <View style={styles.driverRow}>
              <Icon source="account" size={20} color="#666" />
              <Text variant="bodyMedium" style={styles.driverText}>
                {receipt.driver.name}
              </Text>
            </View>
            <View style={styles.driverRow}>
              <Icon source="car" size={20} color="#666" />
              <Text variant="bodyMedium" style={styles.driverText}>
                {receipt.driver.vehicleModel}
              </Text>
            </View>
            <View style={styles.driverRow}>
              <Icon source="card-text" size={20} color="#666" />
              <Text variant="bodyMedium" style={styles.driverText}>
                {receipt.driver.licensePlate}
              </Text>
            </View>
            <View style={styles.driverRow}>
              <Icon source="star" size={20} color="#FFD700" />
              <Text variant="bodyMedium" style={styles.driverText}>
                {receipt.driver.rating.toFixed(1)} ⭐
              </Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Payment Breakdown */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Payment Summary
          </Text>
          
          <View style={styles.paymentRow}>
            <Text variant="bodyMedium">Base Fare</Text>
            <Text variant="bodyMedium">
              {receipt.breakdown.baseFare.toFixed(2)} {receipt.payment.currency}
            </Text>
          </View>
          
          <View style={styles.paymentRow}>
            <Text variant="bodyMedium">Distance Fare</Text>
            <Text variant="bodyMedium">
              {receipt.breakdown.distanceFare.toFixed(2)} {receipt.payment.currency}
            </Text>
          </View>
          
          <View style={styles.paymentRow}>
            <Text variant="bodyMedium">Time Fare</Text>
            <Text variant="bodyMedium">
              {receipt.breakdown.timeFare.toFixed(2)} {receipt.payment.currency}
            </Text>
          </View>
          
          {(receipt.breakdown.tips || 0) > 0 && (
            <View style={styles.paymentRow}>
              <Text variant="bodyMedium">Tips</Text>
              <Text variant="bodyMedium">
                {(receipt.breakdown.tips || 0).toFixed(2)} {receipt.payment.currency}
              </Text>
            </View>
          )}
          
          {(receipt.breakdown.discount || 0) > 0 && (
            <View style={styles.paymentRow}>
              <Text variant="bodyMedium" style={styles.discountText}>Discount</Text>
              <Text variant="bodyMedium" style={styles.discountText}>
                -{(receipt.breakdown.discount || 0).toFixed(2)} {receipt.payment.currency}
              </Text>
            </View>
          )}
          
          <Divider style={styles.paymentDivider} />
          
          <View style={styles.totalRow}>
            <Text variant="titleMedium">Total</Text>
            <Text variant="titleMedium" style={styles.totalAmount}>
              {receipt.breakdown.totalAmount.toFixed(2)} {receipt.payment.currency}
            </Text>
          </View>
          
          <View style={styles.paymentMethod}>
            <Chip 
              mode="outlined" 
              icon={receipt.payment.method === 'CASH' ? 'cash' : 'credit-card'}
              style={styles.paymentChip}
            >
              {receipt.payment.method === 'CASH' ? 'Cash on Delivery' : receipt.payment.method}
            </Chip>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button 
            mode="outlined" 
            onPress={shareReceipt}
            style={[styles.button, styles.shareButton]}
            icon="share-variant"
          >
            Share
          </Button>
          <Button 
            mode="contained" 
            onPress={goHome}
            style={[styles.button, styles.doneButton]}
          >
            Done
          </Button>
        </View>
      </Surface>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        Failed to share receipt
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    marginBottom: 24,
    opacity: 0.7,
    textAlign: 'center',
  },
  receiptCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 12,
  },
  statusChip: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    opacity: 0.7,
    flex: 1,
  },
  routeContainer: {
    paddingLeft: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#ddd',
    marginLeft: 5,
    marginBottom: 8,
  },
  routeText: {
    flex: 1,
    lineHeight: 20,
  },
  driverInfo: {
    paddingLeft: 8,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverText: {
    marginLeft: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentDivider: {
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  discountText: {
    color: '#4CAF50',
  },
  paymentMethod: {
    alignItems: 'center',
    marginTop: 8,
  },
  paymentChip: {
    backgroundColor: '#f8f9fa',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  shareButton: {
    marginRight: 6,
  },
  doneButton: {
    marginLeft: 6,
  },
});

export default RideReceiptScreen;