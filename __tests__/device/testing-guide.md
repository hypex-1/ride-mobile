# 📱 Device Testing Guide

## Overview
This guide covers testing the RideMobile app on real Android and iOS devices to ensure all features work correctly in production environments.

## Pre-Testing Setup

### 1. Environment Configuration
```bash
# Set backend URL for testing
export API_URL=https://staging.api.ridemobile.com
export ENABLE_TESTING_MODE=true

# For Expo dev builds
expo install expo-dev-client
```

### 2. Build Test Apps
```bash
# Development build with staging backend
eas build --profile development --platform all

# Production build for final testing
eas build --profile production --platform all
```

## Test Scenarios

### 🔐 Authentication Flow
**Test Steps:**
1. Open app on fresh install
2. Register new account with real phone/email
3. Verify email/SMS if required
4. Login with credentials
5. Logout and login again
6. Test "Remember Me" functionality

**Expected Results:**
- Smooth registration flow
- Email/SMS verification works
- Login persists across app restarts
- Error handling for invalid credentials

### 📍 Location Services
**Test Steps:**
1. Grant location permissions
2. Verify current location accuracy
3. Test location in different environments:
   - Indoor (GPS weak)
   - Outdoor (GPS strong)
   - Moving vehicle
   - Background mode

**Expected Results:**
- Location accuracy within 10 meters
- Background location works for drivers
- Handles GPS signal loss gracefully
- Battery optimization doesn't kill location

### 🚗 Ride Request Flow
**Test Steps:**
1. Set pickup location (current/manual)
2. Set dropoff location
3. Select ride type
4. Choose payment method
5. Request ride
6. Wait for driver acceptance
7. Track ride progress
8. Complete ride

**Expected Results:**
- Smooth location selection
- Real-time updates work
- Maps display correctly
- Navigation is accurate

### 💰 Payment Integration
**Test Steps:**
1. Select Cash payment (default)
2. Complete ride
3. Verify payment logged
4. View receipt
5. Share receipt
6. Check payment history

**Expected Results:**
- Payment defaults to Cash
- Receipt displays correctly
- Sharing works on device
- Payment history accurate

### 🔔 Push Notifications
**Test Steps:**
1. Enable notifications
2. Test notification scenarios:
   - Driver accepted ride
   - Driver arrived
   - Ride completed
   - System messages

**Expected Results:**
- Notifications appear promptly
- Tapping opens correct screen
- Works in background/foreground
- Sound/vibration as expected

### 🌐 Network Conditions
**Test Steps:**
1. Test on WiFi
2. Test on 4G/5G
3. Test on slow 3G
4. Test offline behavior
5. Test network switching

**Expected Results:**
- Adapts to connection speed
- Offline mode shows appropriate messages
- Reconnects automatically
- No crashes on network loss

## Device-Specific Tests

### Android Testing
```bash
# Connect Android device
adb devices

# Install and test
npx expo run:android --device

# Test specific features:
# - Back button behavior
# - App permissions
# - Battery optimization
# - Different Android versions (10+)
```

### iOS Testing
```bash
# Connect iOS device
xcrun devicectl list devices

# Install and test
npx expo run:ios --device

# Test specific features:
# - App Store guidelines compliance
# - iOS permissions flow
# - Background app refresh
# - Different iOS versions (14+)
```

## Automated Device Testing

### Detox E2E Testing
```javascript
// detox.config.js
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.app'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug.apk'
    }
  }
};
```

### Performance Testing
```javascript
// Performance monitoring
import { Performance } from 'react-native-performance';

// Track app launch time
Performance.mark('app-launch-start');
// ... app initialization
Performance.mark('app-launch-end');
Performance.measure('app-launch', 'app-launch-start', 'app-launch-end');
```

## Test Reporting

### Manual Test Results Template
```markdown
## Device Test Report

**Device:** iPhone 14 Pro / Samsung Galaxy S23
**OS Version:** iOS 17.1 / Android 13
**App Version:** 1.0.0
**Test Date:** 2025-10-05
**Tester:** [Name]

### Test Results
- [ ] Authentication: ✅ Pass / ❌ Fail
- [ ] Location Services: ✅ Pass / ❌ Fail  
- [ ] Ride Flow: ✅ Pass / ❌ Fail
- [ ] Payments: ✅ Pass / ❌ Fail
- [ ] Notifications: ✅ Pass / ❌ Fail
- [ ] Network Handling: ✅ Pass / ❌ Fail

### Issues Found
1. [Issue description]
2. [Issue description]

### Screenshots
- [Include screenshots of key flows]
```

## Continuous Testing

### GitHub Actions Workflow
```yaml
name: Device Testing
on: [push, pull_request]

jobs:
  device-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm test
      - name: Run integration tests
        run: npm run test:integration
        env:
          RUN_INTEGRATION_TESTS: true
          STAGING_API_URL: ${{ secrets.STAGING_API_URL }}
```

### Beta Testing with TestFlight/Google Play
1. Upload development builds
2. Add beta testers
3. Collect feedback and crash reports
4. Monitor analytics and performance

## Performance Benchmarks

### Key Metrics to Track
- App launch time: < 3 seconds
- Location acquisition: < 5 seconds
- API response time: < 2 seconds
- Memory usage: < 150MB
- Battery drain: < 10%/hour during active use

### Tools for Monitoring
- React Native Performance
- Flipper debugging
- Xcode Instruments (iOS)
- Android Studio Profiler
- Sentry for crash reporting