import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { paymentService, PaymentMethod, PaymentLog, PaymentReceipt } from '../services/payment';
import { useAuth } from './AuthContext';

interface PaymentContextType {
  // State
  selectedPaymentMethod: PaymentMethod;
  availablePaymentMethods: PaymentMethod[];
  isProcessingPayment: boolean;
  lastPaymentReceipt: PaymentReceipt | null;
  paymentHistory: PaymentLog[];
  
  // Methods
  selectPaymentMethod: (method: PaymentMethod) => void;
  processRidePayment: (rideId: string | number, amount: number) => Promise<PaymentLog>;
  fetchPaymentReceipt: (rideId: string | number) => Promise<PaymentReceipt>;
  refreshPaymentHistory: () => Promise<void>;
  clearPaymentData: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

interface PaymentProviderProps {
  children: ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(
    paymentService.getDefaultPaymentMethod()
  );
  const [availablePaymentMethods] = useState<PaymentMethod[]>(
    paymentService.getAvailablePaymentMethods()
  );
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [lastPaymentReceipt, setLastPaymentReceipt] = useState<PaymentReceipt | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentLog[]>([]);

  // Select payment method
  const selectPaymentMethod = useCallback((method: PaymentMethod) => {
    if (!method.enabled) {
      console.warn('⚠️ Payment method not enabled:', method.name);
      return;
    }
    console.log('💳 Payment method selected:', method.name);
    setSelectedPaymentMethod(method);
  }, []);

  // Process ride payment
  const processRidePayment = useCallback(async (rideId: string | number, amount: number): Promise<PaymentLog> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!paymentService.validatePaymentAmount(amount)) {
      throw new Error('Invalid payment amount');
    }

    setIsProcessingPayment(true);

    try {
      console.log('💰 Processing ride payment:', { rideId, amount, method: selectedPaymentMethod.type });

      let paymentLog: PaymentLog;

      // Process payment based on selected method
      switch (selectedPaymentMethod.type) {
        case 'CASH':
          // Log cash payment immediately as completed
          paymentLog = await paymentService.logPayment({
            rideId,
            amount,
            method: 'CASH',
            metadata: {
              paymentMethodId: selectedPaymentMethod.id,
              userRole: user.role
            }
          });
          break;

        case 'DIGITAL_WALLET':
          // Future implementation for digital wallet
          throw new Error('Digital wallet payments coming soon!');

        case 'CARD':
          // Future implementation for card payments
          throw new Error('Card payments coming soon!');

        default:
          throw new Error('Invalid payment method');
      }

      console.log('✅ Payment processed successfully:', paymentLog);
      
      // Update payment history
      setPaymentHistory(prev => [paymentLog, ...prev]);

      return paymentLog;
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      throw error;
    } finally {
      setIsProcessingPayment(false);
    }
  }, [user, selectedPaymentMethod]);

  // Fetch payment receipt
  const fetchPaymentReceipt = useCallback(async (rideId: string | number): Promise<PaymentReceipt> => {
    try {
      console.log('🧾 Fetching payment receipt for ride:', rideId);
      const receipt = await paymentService.getPaymentReceipt(rideId);
      setLastPaymentReceipt(receipt);
      return receipt;
    } catch (error) {
      console.error('❌ Error fetching payment receipt:', error);
      throw error;
    }
  }, []);

  // Refresh payment history
  const refreshPaymentHistory = useCallback(async () => {
    if (!user) return;

    try {
      console.log('📄 Refreshing payment history');
      const history = await paymentService.getPaymentHistory();
      setPaymentHistory(history);
    } catch (error) {
      console.error('❌ Error refreshing payment history:', error);
    }
  }, [user]);

  // Clear payment data
  const clearPaymentData = useCallback(() => {
    console.log('🧹 Clearing payment data');
    setLastPaymentReceipt(null);
    setPaymentHistory([]);
    setSelectedPaymentMethod(paymentService.getDefaultPaymentMethod());
  }, []);

  // Context value
  const value: PaymentContextType = {
    selectedPaymentMethod,
    availablePaymentMethods,
    isProcessingPayment,
    lastPaymentReceipt,
    paymentHistory,
    selectPaymentMethod,
    processRidePayment,
    fetchPaymentReceipt,
    refreshPaymentHistory,
    clearPaymentData,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export default PaymentContext;