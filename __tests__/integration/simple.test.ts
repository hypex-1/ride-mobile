/**
 * Simplified Integration Tests
 * Run with: npm run test:integration
 */

import { apiService, authService, paymentService } from '../../src/services';

// Test configuration
const STAGING_API_URL = process.env.STAGING_API_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';

// Skip if not integration environment
const shouldRun = process.env.RUN_INTEGRATION_TESTS === 'true';

describe('Integration Tests - Real Backend', () => {
  beforeEach(() => {
    if (!shouldRun) {
      test.skip('Integration tests disabled - set RUN_INTEGRATION_TESTS=true', () => {});
      return;
    }
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const result = await authService.login({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(TEST_USER_EMAIL);
    }, 10000);
  });

  describe('Payment Flow', () => {
    it('should log payment successfully', async () => {
      const paymentData = {
        rideId: 'test_ride_123',
        amount: 35.50,
        method: 'CASH' as const,
        currency: 'TND'
      };

      const result = await paymentService.logPayment(paymentData);

      expect(result.rideId).toBe(paymentData.rideId);
      expect(result.amount).toBe(paymentData.amount);
      expect(result.method).toBe('CASH');
    }, 10000);

    it('should fetch payment receipt', async () => {
      const rideId = 'test_ride_123';
      
      const receipt = await paymentService.getPaymentReceipt(rideId);

      expect(receipt.rideId).toBe(rideId);
      expect(receipt.payment).toBeDefined();
    }, 10000);
  });
});