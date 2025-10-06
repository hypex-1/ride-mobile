import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { PaymentProvider, usePayment } from '../PaymentContext';
import { AuthProvider } from '../AuthContext';

// Mock the payment service
jest.mock('../../services/payment', () => ({
  paymentService: {
    getDefaultPaymentMethod: jest.fn(() => ({
      id: 'cash',
      name: 'Cash on Delivery',
      type: 'CASH',
      icon: 'cash',
      enabled: true,
      description: 'Pay with cash directly to your driver'
    })),
    getAvailablePaymentMethods: jest.fn(() => [
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
        enabled: false,
        description: 'Pay with mobile wallet (Coming Soon)'
      }
    ]),
    logPayment: jest.fn(() => Promise.resolve({
      id: 'payment_123',
      rideId: 'ride_123',
      amount: 35.50,
      method: 'CASH',
      status: 'COMPLETED',
      currency: 'TND',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    getPaymentReceipt: jest.fn(() => Promise.resolve({
      id: 'receipt_123',
      rideId: 'ride_123',
      payment: {
        id: 'payment_123',
        method: 'CASH',
        amount: 35.50,
        status: 'COMPLETED',
        currency: 'TND'
      }
    })),
    getPaymentHistory: jest.fn(() => Promise.resolve([])),
    validatePaymentAmount: jest.fn((amount) => amount > 0 && amount <= 1000),
  },
}));

// Mock auth context
const mockAuthContext = {
  user: {
    id: 'user_123',
    email: 'test@example.com',
    role: 'rider',
    name: 'Test User'
  },
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  isLoading: false,
  error: null,
};

jest.mock('../AuthContext', () => ({
  ...jest.requireActual('../AuthContext'),
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Test component to interact with payment context
const TestComponent = () => {
  const {
    selectedPaymentMethod,
    availablePaymentMethods,
    isProcessingPayment,
    selectPaymentMethod,
    processRidePayment,
    fetchPaymentReceipt,
  } = usePayment();

  const handleSelectFirstMethod = () => {
    if (availablePaymentMethods.length > 0) {
      selectPaymentMethod(availablePaymentMethods[0]);
    }
  };

  const handleProcessPayment = () => {
    processRidePayment('ride_123', 35.50).catch(() => {});
  };

  const handleFetchReceipt = () => {
    fetchPaymentReceipt('ride_123').catch(() => {});
  };

  return (
    <>
      <Text testID="selected-method">{selectedPaymentMethod.name}</Text>
      <Text testID="available-count">{availablePaymentMethods.length}</Text>
      <Text testID="processing-status">{isProcessingPayment ? 'processing' : 'idle'}</Text>
      <TouchableOpacity testID="select-method" onPress={handleSelectFirstMethod}>
        <Text>Select Method</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="process-payment" onPress={handleProcessPayment}>
        <Text>Process Payment</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="fetch-receipt" onPress={handleFetchReceipt}>
        <Text>Fetch Receipt</Text>
      </TouchableOpacity>
    </>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <PaymentProvider>
      {children}
    </PaymentProvider>
  </AuthProvider>
);

describe('PaymentContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides default payment method and available methods', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(getByTestId('selected-method')).toHaveTextContent('Cash on Delivery');
    expect(getByTestId('available-count')).toHaveTextContent('2');
    expect(getByTestId('processing-status')).toHaveTextContent('idle');
  });

  it('allows selecting payment methods', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const selectButton = getByTestId('select-method');
    
    await act(async () => {
      selectButton.props.onPress();
    });

    expect(getByTestId('selected-method')).toHaveTextContent('Cash on Delivery');
  });

  it('processes ride payments successfully', async () => {
    const { paymentService } = require('../../services/payment');
    
    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const processButton = getByTestId('process-payment');
    
    await act(async () => {
      processButton.props.onPress();
    });

    await waitFor(() => {
      expect(paymentService.logPayment).toHaveBeenCalledWith({
        rideId: 'ride_123',
        amount: 35.50,
        method: 'CASH',
        metadata: {
          paymentMethodId: 'cash',
          userRole: 'rider'
        }
      });
    });
  });

  it('handles payment processing state correctly', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const processButton = getByTestId('process-payment');
    
    // Before processing
    expect(getByTestId('processing-status')).toHaveTextContent('idle');

    // During processing (this is quick, so we might not catch it)
    await act(async () => {
      processButton.props.onPress();
    });

    // After processing
    await waitFor(() => {
      expect(getByTestId('processing-status')).toHaveTextContent('idle');
    });
  });

  it('fetches payment receipts', async () => {
    const { paymentService } = require('../../services/payment');
    
    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const fetchButton = getByTestId('fetch-receipt');
    
    await act(async () => {
      fetchButton.props.onPress();
    });

    await waitFor(() => {
      expect(paymentService.getPaymentReceipt).toHaveBeenCalledWith('ride_123');
    });
  });

  it('handles payment errors gracefully', async () => {
    const { paymentService } = require('../../services/payment');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock payment failure
    paymentService.logPayment.mockRejectedValueOnce(new Error('Payment failed'));
    
    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const processButton = getByTestId('process-payment');
    
    await act(async () => {
      processButton.props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('processing-status')).toHaveTextContent('idle');
    });

    consoleSpy.mockRestore();
  });

  it('validates payment amounts', async () => {
    const { paymentService } = require('../../services/payment');
    
    // Test with invalid amount
    const TestInvalidAmount = () => {
      const { processRidePayment } = usePayment();

      const handleInvalidPayment = () => {
        processRidePayment('ride_123', -10).catch(() => {}); // Invalid amount
      };

      return (
        <TouchableOpacity testID="invalid-payment" onPress={handleInvalidPayment}>
          <Text>Invalid Payment</Text>
        </TouchableOpacity>
      );
    };

    const { getByTestId } = render(
      <TestWrapper>
        <TestInvalidAmount />
      </TestWrapper>
    );

    const invalidButton = getByTestId('invalid-payment');
    
    await act(async () => {
      invalidButton.props.onPress();
    });

    // Should not call logPayment for invalid amounts
    expect(paymentService.logPayment).not.toHaveBeenCalled();
  });
});