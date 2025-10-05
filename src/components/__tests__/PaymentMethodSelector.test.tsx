import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import PaymentMethodSelector from '../PaymentMethodSelector';
import { PaymentMethod } from '../../services/payment';

// Test wrapper with theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('PaymentMethodSelector', () => {
  const mockPaymentMethods: PaymentMethod[] = [
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
    },
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      type: 'CARD',
      icon: 'credit-card',
      enabled: false,
      description: 'Pay with your card (Coming Soon)'
    }
  ];

  const mockOnMethodSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all payment methods', () => {
    render(
      <TestWrapper>
        <PaymentMethodSelector
          selectedMethod={mockPaymentMethods[0]}
          availableMethods={mockPaymentMethods}
          onMethodSelect={mockOnMethodSelect}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Cash on Delivery')).toBeTruthy();
    expect(screen.getByText('Digital Wallet')).toBeTruthy();
    expect(screen.getByText('Credit/Debit Card')).toBeTruthy();
  });

  it('shows title when showTitle is true', () => {
    render(
      <TestWrapper>
        <PaymentMethodSelector
          selectedMethod={mockPaymentMethods[0]}
          availableMethods={mockPaymentMethods}
          onMethodSelect={mockOnMethodSelect}
          showTitle={true}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Payment Method')).toBeTruthy();
  });

  it('hides title when showTitle is false', () => {
    render(
      <TestWrapper>
        <PaymentMethodSelector
          selectedMethod={mockPaymentMethods[0]}
          availableMethods={mockPaymentMethods}
          onMethodSelect={mockOnMethodSelect}
          showTitle={false}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('Payment Method')).toBeNull();
  });

  it('shows "Coming Soon" chip for disabled methods', () => {
    render(
      <TestWrapper>
        <PaymentMethodSelector
          selectedMethod={mockPaymentMethods[0]}
          availableMethods={mockPaymentMethods}
          onMethodSelect={mockOnMethodSelect}
        />
      </TestWrapper>
    );

    const comingSoonChips = screen.getAllByText('Coming Soon');
    expect(comingSoonChips).toHaveLength(2); // Digital Wallet and Card
  });

  it('calls onMethodSelect when enabled method is pressed', () => {
    render(
      <TestWrapper>
        <PaymentMethodSelector
          selectedMethod={mockPaymentMethods[0]}
          availableMethods={mockPaymentMethods}
          onMethodSelect={mockOnMethodSelect}
        />
      </TestWrapper>
    );

    const cashMethod = screen.getByText('Cash on Delivery');
    fireEvent.press(cashMethod);

    expect(mockOnMethodSelect).toHaveBeenCalledWith(mockPaymentMethods[0]);
  });

  it('does not call onMethodSelect when disabled method is pressed', () => {
    render(
      <TestWrapper>
        <PaymentMethodSelector
          selectedMethod={mockPaymentMethods[0]}
          availableMethods={mockPaymentMethods}
          onMethodSelect={mockOnMethodSelect}
        />
      </TestWrapper>
    );

    const digitalWalletMethod = screen.getByText('Digital Wallet');
    fireEvent.press(digitalWalletMethod);

    expect(mockOnMethodSelect).not.toHaveBeenCalled();
  });

  it('displays selected method summary', () => {
    render(
      <TestWrapper>
        <PaymentMethodSelector
          selectedMethod={mockPaymentMethods[0]}
          availableMethods={mockPaymentMethods}
          onMethodSelect={mockOnMethodSelect}
        />
      </TestWrapper>
    );

    expect(screen.getByText("You'll pay with Cash on Delivery")).toBeTruthy();
  });

  it('shows correct selected state for different methods', () => {
    const { rerender } = render(
      <TestWrapper>
        <PaymentMethodSelector
          selectedMethod={mockPaymentMethods[0]}
          availableMethods={mockPaymentMethods}
          onMethodSelect={mockOnMethodSelect}
        />
      </TestWrapper>
    );

    // Cash should be selected initially
    expect(screen.getByText("You'll pay with Cash on Delivery")).toBeTruthy();

    // Change to different method (even if disabled for UI testing)
    rerender(
      <TestWrapper>
        <PaymentMethodSelector
          selectedMethod={mockPaymentMethods[1]}
          availableMethods={mockPaymentMethods}
          onMethodSelect={mockOnMethodSelect}
        />
      </TestWrapper>
    );

    expect(screen.getByText("You'll pay with Digital Wallet")).toBeTruthy();
  });

  it('renders payment method descriptions', () => {
    render(
      <TestWrapper>
        <PaymentMethodSelector
          selectedMethod={mockPaymentMethods[0]}
          availableMethods={mockPaymentMethods}
          onMethodSelect={mockOnMethodSelect}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Pay with cash directly to your driver')).toBeTruthy();
    expect(screen.getByText('Pay with mobile wallet (Coming Soon)')).toBeTruthy();
    expect(screen.getByText('Pay with your card (Coming Soon)')).toBeTruthy();
  });
});