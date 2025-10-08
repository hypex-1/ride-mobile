#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Automatically detect and update the API URL in .env file
 * Works on Windows, macOS, and Linux
 */

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  // Priority order: Wi-Fi, Ethernet, then others
  const priorityNames = ['Wi-Fi', 'WiFi', 'wlan0', 'Ethernet', 'eth0'];
  
  // First, try priority interfaces
  for (const name of priorityNames) {
    if (interfaces[name]) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`🌐 Found IP on ${name}: ${iface.address}`);
          return iface.address;
        }
      }
    }
  }
  
  // Fallback: any non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`🌐 Found IP on ${name}: ${iface.address}`);
        return iface.address;
      }
    }
  }
  
  throw new Error('No local IP address found');
}

function updateEnvFile(ipAddress) {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating new .env file...');
    const defaultEnv = `# Auto-generated environment configuration
EXPO_PUBLIC_API_URL=http://${ipAddress}:3000
EXPO_PUBLIC_WS_URL=ws://${ipAddress}:3000
NODE_ENV=development

# API Endpoints
AUTH_ENDPOINT=/auth
USERS_ENDPOINT=/users
RIDES_ENDPOINT=/rides
PAYMENTS_ENDPOINT=/payments
DRIVERS_ENDPOINT=/drivers

# External Services (Replace with your actual keys)
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
GOOGLE_MAPS_API_KEY=AIzaSyDQb35eg_mVJ8_BAan7nx7lZzCnaYfiMWs
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDQb35eg_mVJ8_BAan7nx7lZzCnaYfiMWs
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id

# App Configuration
APP_NAME=RideMobile
APP_VERSION=1.0.0
DEBUG_MODE=true

# Real-time Configuration
SOCKET_TIMEOUT=5000
RECONNECT_ATTEMPTS=5
RECONNECT_DELAY=1000

# Location Configuration
LOCATION_ACCURACY=6
LOCATION_UPDATE_INTERVAL=5000
MAP_INITIAL_ZOOM=15

# UI Configuration
THEME_MODE=auto
LANGUAGE=en
CURRENCY=TND
`;
    fs.writeFileSync(envPath, defaultEnv);
    return;
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update API URL
  const apiUrlRegex = /^EXPO_PUBLIC_API_URL=.*$/m;
  const wsUrlRegex = /^EXPO_PUBLIC_WS_URL=.*$/m;
  
  const newApiUrl = `EXPO_PUBLIC_API_URL=http://${ipAddress}:3000`;
  const newWsUrl = `EXPO_PUBLIC_WS_URL=ws://${ipAddress}:3000`;
  
  if (apiUrlRegex.test(envContent)) {
    envContent = envContent.replace(apiUrlRegex, newApiUrl);
  } else {
    envContent = newApiUrl + '\n' + envContent;
  }
  
  if (wsUrlRegex.test(envContent)) {
    envContent = envContent.replace(wsUrlRegex, newWsUrl);
  } else {
    envContent = newWsUrl + '\n' + envContent;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated .env with IP: ${ipAddress}`);
}

function main() {
  try {
    console.log('🔍 Detecting local IP address...');
    const ipAddress = getLocalIPAddress();
    updateEnvFile(ipAddress);
    console.log('🚀 Ready to start Expo!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Fallback: Using localhost (works only with emulator)');
    updateEnvFile('localhost');
  }
}

if (require.main === module) {
  main();
}

module.exports = { getLocalIPAddress, updateEnvFile };