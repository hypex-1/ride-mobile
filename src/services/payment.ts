import { apiService } from './api';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'CASH' | 'DIGITAL_WALLET' | 'CARD';
  icon: string;
  enabled: boolean;
  description: string;
}

export interface PaymentLog {
  id: string;
  rideId: string;
  amount: number;
  method: 'CASH' | 'DIGITAL_WALLET' | 'CARD';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  currency: string;
  transactionId?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    driverConfirmed?: boolean;
    riderConfirmed?: boolean;
    digitalWalletProvider?: string;
    cardLastFour?: string;
  };
}

export interface PaymentReceipt {
  id: string;
  rideId: string;
  riderId: string;
  driverId: string;
  payment: PaymentLog;
  ride: {
    pickupAddress: string;
    dropoffAddress: string;
    distance: number;
    duration: number;
    startTime: string;
    endTime: string;
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    totalFare: number;
  };
  driver: {
    name: string;
    rating: number;
    licensePlate: string;
    vehicleModel: string;
  };
  breakdown: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    tips?: number;
    discount?: number;
    taxes?: number;
    totalAmount: number;
  };
  generatedAt: string;
}

class PaymentService {
  // Get available payment methods
  getAvailablePaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'cash',
        name: 'Cash on Delivery',
        type: 'CASH',
        icon: 'cash',
        enabled: true,
        description: 'Pay with cash directly to your driver'
      },
      {
        id: 'digital_wallet',
        name: 'Digital Wallet',
        type: 'DIGITAL_WALLET',
        icon: 'wallet',
        enabled: false, // Future-proof: disabled for now
        description: 'Pay with mobile wallet (Coming Soon)'
      },
      {
        id: 'credit_card',
        name: 'Credit/Debit Card',
        type: 'CARD',
        icon: 'credit-card',
        enabled: false, // Future-proof: disabled for now
        description: 'Pay with your card (Coming Soon)'
      }
    ];
  }

  // Get default payment method (Cash)
  getDefaultPaymentMethod(): PaymentMethod {
    return this.getAvailablePaymentMethods()[0]; // Cash is first and default
  }

  // Log payment after ride completion
  async logPayment(paymentData: {
    rideId: string | number;
    amount: number;
    method: 'CASH' | 'DIGITAL_WALLET' | 'CARD';
    currency?: string;
    metadata?: any;
  }): Promise<PaymentLog> {
    try {
      console.log(' Logging payment:', paymentData);

      const response = await apiService.post<PaymentLog>('/payments/log', {
        rideId: paymentData.rideId,
        amount: paymentData.amount,
        method: paymentData.method,
        currency: paymentData.currency || 'TND',
        status: 'COMPLETED', // Cash payments are immediately completed
        metadata: {
          riderConfirmed: true,
          driverConfirmed: paymentData.method === 'CASH',
          ...paymentData.metadata
        }
      });

      console.log(' Payment logged successfully:', response);
      return response;
    } catch (error) {
      console.error(' Error logging payment:', error);
      throw new Error('Failed to log payment');
    }
  }

  // Get payment receipt
  async getPaymentReceipt(rideId: string | number): Promise<PaymentReceipt> {
    try {
      console.log(' Fetching payment receipt for ride:', rideId);

      const response = await apiService.get<PaymentReceipt>(`/payments/${rideId}`);
      
      console.log(' Payment receipt fetched successfully');
      return response;
    } catch (error) {
      console.error(' Error fetching payment receipt:', error);
      throw new Error('Failed to fetch payment receipt');
    }
  }

  // Process digital wallet payment (future implementation)
  async processDigitalWalletPayment(paymentData: {
    rideId: string | number;
    amount: number;
    walletProvider: string;
    walletToken: string;
  }): Promise<PaymentLog> {
    try {
      // Future implementation for digital wallet integration
      console.log(' Processing digital wallet payment (Coming Soon)');
      
      const response = await apiService.post<PaymentLog>('/payments/digital-wallet', {
        rideId: paymentData.rideId,
        amount: paymentData.amount,
        walletProvider: paymentData.walletProvider,
        walletToken: paymentData.walletToken,
      });

      return response;
    } catch (error) {
      console.error(' Error processing digital wallet payment:', error);
      throw new Error('Digital wallet payment failed');
    }
  }

  // Process card payment (future implementation)
  async processCardPayment(paymentData: {
    rideId: string | number;
    amount: number;
    cardToken: string;
    saveCard?: boolean;
  }): Promise<PaymentLog> {
    try {
      // Future implementation for card payment integration
      console.log(' Processing card payment (Coming Soon)');
      
      const response = await apiService.post<PaymentLog>('/payments/card', {
        rideId: paymentData.rideId,
        amount: paymentData.amount,
        cardToken: paymentData.cardToken,
        saveCard: paymentData.saveCard || false,
      });

      return response;
    } catch (error) {
      console.error(' Error processing card payment:', error);
      throw new Error('Card payment failed');
    }
  }

  // Get payment history for user
  async getPaymentHistory(): Promise<PaymentLog[]> {
    try {
      const response = await apiService.get<PaymentLog[]>('/payments/history');
      return response;
    } catch (error) {
      console.error(' Error fetching payment history:', error);
      return [];
    }
  }

  // Validate payment amount
  validatePaymentAmount(amount: number): boolean {
    return amount > 0 && amount <= 1000; // Max 1000 TND per ride
  }

  // Format payment amount for display
  formatAmount(amount: number, currency: string = 'TND'): string {
    return `${amount.toFixed(2)} ${currency}`;
  }

  // Get payment status color for UI
  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50'; // Green
      case 'PENDING':
        return '#FF9800'; // Orange
      case 'FAILED':
        return '#F44336'; // Red
      case 'REFUNDED':
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Grey
    }
  }

  // Get payment method icon
  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'CASH':
        return 'cash';
      case 'DIGITAL_WALLET':
        return 'wallet';
      case 'CARD':
        return 'credit-card';
      default:
        return 'currency-usd';
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;