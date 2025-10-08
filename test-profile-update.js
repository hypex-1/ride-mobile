const axios = require('axios');

// Test script to verify profile update endpoint
async function testProfileUpdate() {
  try {
    console.log('🧪 Testing profile update endpoint...');
    
    // First, let's test if we can reach the backend
    const healthResponse = await axios.get('http://192.168.1.4:3000');
    console.log('✅ Backend is reachable:', healthResponse.data);
    
    // Test the PATCH /auth/me endpoint (without auth for now, just to see if it exists)
    try {
      const profileResponse = await axios.patch('http://192.168.1.4:3000/auth/me', {
        name: 'Test User',
        email: 'test@example.com'
      });
      console.log('✅ Profile update endpoint exists and responded');
    } catch (error) {
      if (error.response) {
        console.log('✅ Profile update endpoint exists - Status:', error.response.status);
        if (error.response.status === 401) {
          console.log('✅ Expected 401 Unauthorized (need JWT token)');
        } else {
          console.log('Response:', error.response.data);
        }
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testProfileUpdate();