// Test script for payment backend integration
// Run with: node testPayments.js

const API_BASE_URL = 'http://localhost:3000'; // Update with your backend URL

// Test credentials
const testUser = {
  email: 'rider@example.com',
  password: 'password123'
};

// Test payment data
const testRide = {
  id: 'ride_12345',
  actualFare: 35.50,
  estimatedFare: 32.00,
  startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  endTime: new Date().toISOString(),
  pickupAddress: 'Downtown Tunis, Tunisia',
  dropoffAddress: 'Tunis Airport, Tunisia',
  distance: 18.5,
  duration: 35
};

async function testPaymentFlow() {
  try {
    console.log('🧪 Starting Payment Backend Test...\n');

    // Step 1: Login to get auth token
    console.log('1️⃣ Logging in user...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const authToken = loginData.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);

    // Step 2: Log payment for completed ride
    console.log('\n2️⃣ Logging payment for ride...');
    const paymentData = {
      rideId: testRide.id,
      amount: testRide.actualFare,
      method: 'CASH',
      currency: 'TND',
      status: 'COMPLETED',
      metadata: {
        riderConfirmed: true,
        driverConfirmed: true,
        paymentMethodId: 'cash',
        rideDuration: testRide.duration,
        rideDistance: testRide.distance
      }
    };

    const paymentResponse = await fetch(`${API_BASE_URL}/payments/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!paymentResponse.ok) {
      throw new Error(`Payment logging failed: ${paymentResponse.status} ${paymentResponse.statusText}`);
    }

    const paymentResult = await paymentResponse.json();
    console.log('✅ Payment logged successfully');
    console.log(`   Payment ID: ${paymentResult.id}`);
    console.log(`   Status: ${paymentResult.status}`);
    console.log(`   Amount: ${paymentResult.amount} ${paymentResult.currency}`);

    // Step 3: Fetch payment receipt
    console.log('\n3️⃣ Fetching payment receipt...');
    const receiptResponse = await fetch(`${API_BASE_URL}/payments/${testRide.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!receiptResponse.ok) {
      throw new Error(`Receipt fetch failed: ${receiptResponse.status} ${receiptResponse.statusText}`);
    }

    const receiptData = await receiptResponse.json();
    console.log('✅ Receipt fetched successfully');
    console.log(`   Receipt ID: ${receiptData.id}`);
    console.log(`   Ride ID: ${receiptData.rideId}`);
    console.log(`   Driver: ${receiptData.driver.name}`);
    console.log(`   Total: ${receiptData.breakdown.totalAmount} ${receiptData.payment.currency}`);

    // Step 4: Test payment history
    console.log('\n4️⃣ Fetching payment history...');
    const historyResponse = await fetch(`${API_BASE_URL}/payments/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!historyResponse.ok) {
      throw new Error(`History fetch failed: ${historyResponse.status} ${historyResponse.statusText}`);
    }

    const historyData = await historyResponse.json();
    console.log('✅ Payment history fetched successfully');
    console.log(`   Total payments: ${historyData.length}`);
    if (historyData.length > 0) {
      console.log(`   Latest payment: ${historyData[0].id} (${historyData[0].amount} ${historyData[0].currency})`);
    }

    console.log('\n🎉 All payment backend tests passed!');
    
  } catch (error) {
    console.error('\n❌ Payment backend test failed:');
    console.error(error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Tips:');
      console.log('   - Make sure your backend server is running');
      console.log('   - Check the API_BASE_URL is correct');
      console.log('   - Verify the endpoints exist on your backend');
    }
  }
}

// Test individual payment endpoints
async function testPaymentEndpoints() {
  console.log('🔍 Testing Payment Endpoints...\n');

  const endpoints = [
    { method: 'POST', path: '/payments/log', description: 'Log payment after ride completion' },
    { method: 'GET', path: '/payments/{rideId}', description: 'Get payment receipt by ride ID' },
    { method: 'GET', path: '/payments/history', description: 'Get payment history for user' },
  ];

  console.log('Required Backend Endpoints:');
  endpoints.forEach((endpoint, index) => {
    console.log(`${index + 1}. ${endpoint.method} ${endpoint.path}`);
    console.log(`   ${endpoint.description}`);
  });

  console.log('\nExpected Request/Response formats:');
  
  console.log('\n📤 POST /payments/log');
  console.log('Request Body:');
  console.log(JSON.stringify({
    rideId: 'string',
    amount: 'number',
    method: 'CASH | DIGITAL_WALLET | CARD',
    currency: 'string (optional, default TND)',
    status: 'COMPLETED | PENDING | FAILED',
    metadata: {
      riderConfirmed: true,
      driverConfirmed: true,
      paymentMethodId: 'string'
    }
  }, null, 2));

  console.log('\n📥 Response:');
  console.log(JSON.stringify({
    id: 'payment_uuid',
    rideId: 'ride_uuid', 
    amount: 35.50,
    method: 'CASH',
    status: 'COMPLETED',
    currency: 'TND',
    createdAt: 'ISO_DATE',
    updatedAt: 'ISO_DATE',
    metadata: {}
  }, null, 2));

  console.log('\n📤 GET /payments/{rideId}');
  console.log('Response: PaymentReceipt object with ride details, driver info, and payment breakdown');

  console.log('\n📤 GET /payments/history');
  console.log('Response: Array of PaymentLog objects for the authenticated user');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--endpoints')) {
    await testPaymentEndpoints();
  } else {
    await testPaymentFlow();
  }
}

main().catch(console.error);