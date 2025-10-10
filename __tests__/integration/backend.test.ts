/**
 * Integration Tests for Real Backend
 * 
 * These tests call the actual staging backend to verify end-to-end functionality.
 * Run with: npm run test:integration
 * 
 * Prerequisites:
 * - Backend running on staging environment
 * - Valid test credentials
 * - Internet connection
 */

import { apiService, authService, paymentService, rideService } from '../../src/services';
import type { RegisterData } from '../../src/services';

// Test configuration
const STAGING_API_URL = process.env.STAGING_API_URL || 'https://staging.api.ridemobile.com';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'integration.test@ridemobile.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

// Skip integration tests if not in CI or staging environment
const shouldRunIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true' || process.env.CI === 'true';
const describeIntegration = shouldRunIntegrationTests ? describe : describe.skip;

if (!shouldRunIntegrationTests) {
  console.log('⏭ Skipping integration tests (set RUN_INTEGRATION_TESTS=true to enable)');
}

describeIntegration('Integration Tests with Real Backend', () => {
  let authToken: string | null = null;
  let userId: string | null = null;
  let testRideId: string;

  beforeAll(async () => {
    // Configure API service for staging
    if (STAGING_API_URL !== apiService.getBaseURL()) {
      console.log(` Configuring API service for staging: ${STAGING_API_URL}`);
      apiService.setBaseURL(STAGING_API_URL);
    }
  });

  describe('Authentication Flow', () => {
    it('should register a new test user', async () => {
      const testEmail = `test.${Date.now()}@ridemobile.com`;
      const userData: RegisterData = {
        email: testEmail,
        password: TEST_USER_PASSWORD,
        firstName: 'Integration',
        lastName: 'TestUser',
        phoneNumber: '+21612345678',
        role: 'rider' as const
      };

      const result = await authService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.role).toBe('rider');

      authToken = result.accessToken;
      userId = result.user.id;
    }, 10000);

    it('should login with test credentials', async () => {
      const credentials = {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      };

      const result = await authService.login(credentials);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(TEST_USER_EMAIL);
      expect(result.accessToken).toBeDefined();

      authToken = result.accessToken;
      userId = result.user.id;
    }, 10000);

    it('should validate token and get user profile', async () => {
      expect(authToken).toBeTruthy();
      expect(userId).toBeTruthy();

      // Set token for subsequent requests
      apiService.setDefaultHeader('Authorization', `Bearer ${authToken}`);

      const userProfile = await authService.getCurrentUser();

      expect(userProfile).not.toBeNull();
      expect(userProfile?.id).toBe(userId);
    }, 10000);
  });

  describe('Ride Request Flow', () => {
    it('should create a ride request', async () => {
      const rideRequest = {
        pickupLocation: {
          latitude: 36.8065,
          longitude: 10.1815,
          address: 'Downtown Tunis, Tunisia'
        },
        dropoffLocation: {
          latitude: 36.7980,
          longitude: 10.1648,
          address: 'Tunis Airport, Tunisia'
        },
        rideType: 'standard' as const,
        estimatedFare: 35.50
      };

      const result = await rideService.requestRide(rideRequest);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe('pending');
  expect(result.riderId).toBe(userId);

      testRideId = result.id;
    }, 15000);

    it('should get ride details', async () => {
      expect(testRideId).toBeDefined();

      const rideDetails = await rideService.getRideDetails(testRideId);

      expect(rideDetails).toBeDefined();
      expect(rideDetails.id).toBe(testRideId);
  expect(rideDetails.riderId).toBe(userId);
    }, 10000);

    it('should calculate fare estimate', async () => {
      const pickupLocation = {
        latitude: 36.8065,
        longitude: 10.1815,
        address: 'Downtown Tunis, Tunisia'
      };
      const dropoffLocation = {
        latitude: 36.7980,
        longitude: 10.1648,
        address: 'Tunis Airport, Tunisia'
      };

      const fare = await rideService.calculateFare(pickupLocation, dropoffLocation, 'standard');

      expect(fare).toBeGreaterThan(0);
      expect(fare).toBeLessThan(1000);
    }, 10000);
  });

  describe('Payment Integration Flow', () => {
    it('should log payment for completed ride', async () => {
      // Note: In real scenario, ride would be completed by driver
      // For testing, we'll simulate a completed ride
      const paymentData = {
        rideId: testRideId || 'test_ride_123',
        amount: 35.50,
        method: 'CASH' as const,
        currency: 'TND',
        metadata: {
          testPayment: true,
          integrationTest: true
        }
      };

      const paymentResult = await paymentService.logPayment(paymentData);

      expect(paymentResult).toBeDefined();
      expect(paymentResult.rideId).toBe(paymentData.rideId);
      expect(paymentResult.amount).toBe(paymentData.amount);
      expect(paymentResult.method).toBe('CASH');
      expect(paymentResult.status).toBe('COMPLETED');
    }, 10000);

    it('should fetch payment receipt', async () => {
      const rideId = testRideId || 'test_ride_123';

      const receipt = await paymentService.getPaymentReceipt(rideId);

      expect(receipt).toBeDefined();
      expect(receipt.rideId).toBe(rideId);
      expect(receipt.payment).toBeDefined();
      expect(receipt.payment.method).toBe('CASH');
      expect(receipt.breakdown).toBeDefined();
      expect(receipt.breakdown.totalAmount).toBeGreaterThan(0);
    }, 10000);

    it('should fetch payment history', async () => {
      const history = await paymentService.getPaymentHistory();

      expect(Array.isArray(history)).toBe(true);
      // Should have at least the payment we just made
      expect(history.length).toBeGreaterThan(0);

      const latestPayment = history[0];
      expect(latestPayment.method).toBeDefined();
      expect(latestPayment.amount).toBeGreaterThan(0);
      expect(latestPayment.status).toBeDefined();
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle invalid login credentials', async () => {
      const invalidCredentials = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      };

      await expect(authService.login(invalidCredentials))
        .rejects.toThrow();
    }, 10000);

    it('should handle invalid ride request', async () => {
      const invalidRideRequest = {
        pickupLocation: {
          latitude: 0,
          longitude: 0,
          address: ''
        },
        dropoffLocation: {
          latitude: 0,
          longitude: 0,
          address: ''
        },
        rideType: 'invalid' as any,
        estimatedFare: -10
      };

      await expect(rideService.requestRide(invalidRideRequest))
        .rejects.toThrow();
    }, 10000);

    it('should handle invalid payment data', async () => {
      const invalidPaymentData = {
        rideId: '',
        amount: -10,
        method: 'INVALID' as any
      };

      await expect(paymentService.logPayment(invalidPaymentData))
        .rejects.toThrow();
    }, 10000);

    it('should handle non-existent ride receipt', async () => {
      const nonExistentRideId = 'non_existent_ride_123';

      await expect(paymentService.getPaymentReceipt(nonExistentRideId))
        .rejects.toThrow();
    }, 10000);
  });

  describe('Real-time Features', () => {
    it('should establish socket connection', async () => {
      // Note: This would test real WebSocket connection
      // Implementation depends on your socket service
      const { io } = require('socket.io-client');
      
      const socket = io(STAGING_API_URL, {
        auth: {
          token: authToken
        }
      });

      const connectionPromise = new Promise((resolve, reject) => {
        socket.on('connect', () => {
          console.log(' Socket connected:', socket.id);
          resolve(socket.id);
        });

  socket.on('connect_error', (error: Error) => {
          console.error(' Socket connection error:', error);
          reject(error);
        });

        setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 5000);
      });

      const socketId = await connectionPromise;
      expect(socketId).toBeDefined();

      socket.disconnect();
    }, 10000);
  });

  afterAll(async () => {
    if (!shouldRunIntegrationTests) return;

    // Cleanup: Cancel any pending rides, logout, etc.
    if (testRideId) {
      try {
        await rideService.cancelRide(testRideId, 'Integration test cleanup');
      } catch (error) {
        console.log('Note: Could not cancel test ride (may already be completed)');
      }
    }

    console.log(' Integration test cleanup completed');
  });
});

// Helper function to run integration tests manually
export const runIntegrationTests = async () => {
  console.log(' Running Integration Tests with Real Backend...\n');
  
  const testResults = {
    auth: { passed: 0, failed: 0 },
    rides: { passed: 0, failed: 0 },
    payments: { passed: 0, failed: 0 },
    errors: { passed: 0, failed: 0 }
  };

  try {
    // Test authentication
    console.log('1⃣ Testing Authentication...');
    const authResult = await authService.login({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    console.log(' Authentication successful');
    testResults.auth.passed++;

    // Test ride operations
    console.log('\n2⃣ Testing Ride Operations...');
    const fareResult = await rideService.calculateFare(
      { latitude: 36.8065, longitude: 10.1815, address: 'Tunis Downtown' },
      { latitude: 36.7980, longitude: 10.1648, address: 'Tunis Airport' },
      'standard'
    );
    console.log(' Fare calculation successful:', fareResult);
    testResults.rides.passed++;

    // Test payment operations
    console.log('\n3⃣ Testing Payment Operations...');
    const paymentResult = await paymentService.logPayment({
      rideId: 'integration_test_ride',
      amount: 35.50,
      method: 'CASH'
    });
    console.log(' Payment logging successful');
    testResults.payments.passed++;

    console.log('\n All integration tests passed!');
    console.log('Test Results:', testResults);

  } catch (error) {
    console.error('\n Integration test failed:', error);
    throw error;
  }
};