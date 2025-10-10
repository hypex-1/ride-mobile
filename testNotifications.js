#!/usr/bin/env node

// Test script to send push notifications via backend
// Usage: node testNotifications.js

const API_BASE_URL = 'http://localhost:3000';

async function testBackendNotifications() {
  try {
    console.log(' Testing Backend Push Notifications');
    console.log('=====================================');

    // Step 1: Login as rider
    console.log('1. Logging in as rider...');
    const riderLoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rider@test.com',
        password: 'TestPass123!'
      })
    });

    if (!riderLoginResponse.ok) {
      throw new Error('Failed to login as rider');
    }

    const riderAuth = await riderLoginResponse.json();
    console.log(' Rider logged in successfully');

    // Step 2: Login as driver
    console.log('2. Logging in as driver...');
    const driverLoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'driver@test.com',
        password: 'TestPass123!'
      })
    });

    if (!driverLoginResponse.ok) {
      throw new Error('Failed to login as driver');
    }

    const driverAuth = await driverLoginResponse.json();
    console.log(' Driver logged in successfully');

    // Step 3: Send test notification to rider
    console.log('3. Sending test notification to rider...');
    const riderNotificationResponse = await fetch(`${API_BASE_URL}/notifications/test`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${riderAuth.accessToken}`
      },
      body: JSON.stringify({
        title: ' Driver Found!',
        body: 'Ahmed Ben Salem has accepted your ride request.',
        data: {
          type: 'ride_accepted',
          rideId: 'test-ride-123'
        }
      })
    });

    if (riderNotificationResponse.ok) {
      console.log(' Rider notification sent successfully');
    } else {
      console.log(' Rider notification failed:', await riderNotificationResponse.text());
    }

    // Step 4: Send test notification to driver
    console.log('4. Sending test notification to driver...');
    const driverNotificationResponse = await fetch(`${API_BASE_URL}/notifications/test`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverAuth.accessToken}`
      },
      body: JSON.stringify({
        title: ' New Ride Request!',
        body: 'Pickup: Khniss, Monastir - Fare: 8.50 TND',
        data: {
          type: 'new_ride_request',
          rideId: 'test-ride-123'
        }
      })
    });

    if (driverNotificationResponse.ok) {
      console.log(' Driver notification sent successfully');
    } else {
      console.log(' Driver notification failed:', await driverNotificationResponse.text());
    }

    console.log('\n Push notification test completed!');
    console.log('\n Check your mobile devices for notifications');

  } catch (error) {
    console.error(' Test failed:', error.message);
  }
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      console.log(' Backend is running');
      return true;
    } else {
      console.log(' Backend health check failed');
      return false;
    }
  } catch (error) {
    console.log(' Backend is not running. Please start the backend server first.');
    return false;
  }
}

// Main execution
async function main() {
  console.log(' Checking backend status...');
  const backendRunning = await checkBackend();
  
  if (backendRunning) {
    await testBackendNotifications();
  } else {
    console.log('\n To start the backend:');
    console.log('   cd /path/to/backend');
    console.log('   npm start');
  }
}

main();