import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Card, 
  Text, 
  Button, 
  Divider, 
  Surface,
  Chip,
  Icon
} from 'react-native-paper';
import { RideReceiptScreenProps } from '../../types/navigation';

interface RideReceipt {
  rideId: string;
  date: string;
  time: string;
  pickup: string;
  dropoff: string;
  distance: string;
  duration: string;
  fare: number;
  tip: number;
  total: number;
  paymentMethod: string;
  driver: {
    name: string;
    vehicle: string;
    plateNumber: string;
  };
}

const RideReceiptScreen: React.FC<RideReceiptScreenProps> = ({ route, navigation }) => {
  const { rideId } = route.params;
  const [receipt, setReceipt] = useState<RideReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRideReceipt();
  }, [rideId]);

  const fetchRideReceipt = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/payments/receipt/${rideId}`);
      // const receiptData = await response.json();
      
      // Mock data for now
      const mockReceipt: RideReceipt = {
        rideId,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        pickup: '123 Main St, City',
        dropoff: '456 Oak Ave, City',
        distance: '5.2 km',
        duration: '15 min',
        fare: 12.50,
        tip: 2.00,
        total: 14.50,
        paymentMethod: 'Credit Card',
        driver: {
          name: 'John Doe',
          vehicle: 'Toyota Camry',
          plateNumber: 'ABC-123',
        },
      };
      
      setReceipt(mockReceipt);
    } catch (error) {
      console.error('Error fetching receipt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const goHome = () => {
    navigation.navigate('Home');
  };

  const downloadReceipt = () => {
    // TODO: Implement receipt download/share functionality
    console.log('Download receipt');
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading receipt...</Text>
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={styles.centered}>
        <Text>Receipt not found</Text>
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
        </View>

        <Divider style={styles.divider} />

        {/* Ride Details */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Ride Details
          </Text>
          
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>Ride ID:</Text>
            <Text variant="bodyMedium">{receipt.rideId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>Date & Time:</Text>
            <Text variant="bodyMedium">{receipt.date} at {receipt.time}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>Distance:</Text>
            <Text variant="bodyMedium">{receipt.distance}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>Duration:</Text>
            <Text variant="bodyMedium">{receipt.duration}</Text>
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
                {receipt.pickup}
              </Text>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#f44336' }]} />
              <Text variant="bodyMedium" style={styles.routeText}>
                {receipt.dropoff}
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
            <Text variant="bodyMedium">{receipt.driver.name}</Text>
            <Text variant="bodyMedium">{receipt.driver.vehicle}</Text>
            <Text variant="bodyMedium">Plate: {receipt.driver.plateNumber}</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Payment Breakdown */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Payment Summary
          </Text>
          
          <View style={styles.paymentRow}>
            <Text variant="bodyMedium">Fare</Text>
            <Text variant="bodyMedium">${receipt.fare.toFixed(2)}</Text>
          </View>
          
          <View style={styles.paymentRow}>
            <Text variant="bodyMedium">Tip</Text>
            <Text variant="bodyMedium">${receipt.tip.toFixed(2)}</Text>
          </View>
          
          <Divider style={styles.paymentDivider} />
          
          <View style={styles.totalRow}>
            <Text variant="titleMedium">Total</Text>
            <Text variant="titleMedium" style={styles.totalAmount}>
              ${receipt.total.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.paymentMethod}>
            <Chip mode="outlined" icon="credit-card">
              {receipt.paymentMethod}
            </Chip>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button 
            mode="outlined" 
            onPress={downloadReceipt}
            style={styles.button}
            icon="download"
          >
            Download
          </Button>
          <Button 
            mode="contained" 
            onPress={goHome}
            style={styles.button}
          >
            Done
          </Button>
        </View>
      </Surface>
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
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    opacity: 0.7,
  },
  routeContainer: {
    paddingLeft: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 5,
    marginBottom: 8,
  },
  routeText: {
    flex: 1,
  },
  driverInfo: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
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
  paymentMethod: {
    alignItems: 'flex-start',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

export default RideReceiptScreen;