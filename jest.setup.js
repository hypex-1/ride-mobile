// import 'react-native-gesture-handler/jestSetup';
// Skip gesture handler setup for now as it's not essential for our payment tests

// Mock expo modules
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 36.8065,
      longitude: 10.1815,
      altitude: 0,
      accuracy: 5,
      heading: 0,
      speed: 0
    }
  })),
  watchPositionAsync: jest.fn(),
  LocationAccuracy: {
    High: 'high',
    Balanced: 'balanced',
    Low: 'low'
  }
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-expo-push-token' })),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  deviceType: 1,
  osName: 'iOS',
  osVersion: '17.0'
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-paper', () => ({
  Provider: ({ children }) => children,
  Button: ({ children, onPress, ...props }) => 
    require('react').createElement('TouchableOpacity', { onPress, testID: props.testID }, children),
  Text: ({ children, ...props }) => 
    require('react').createElement('Text', props, children),
  Chip: ({ children, ...props }) => 
    require('react').createElement('View', props, children),
}));

// Mock React Native components
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  StyleSheet: {
    create: (styles) => styles,
  },
  Platform: {
    OS: 'ios',
    select: (platforms) => platforms.ios,
  },
}));

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Marker: View,
    Callout: View,
    PROVIDER_GOOGLE: 'google'
  };
});

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connected: true,
    id: 'mock-socket-id'
  }))
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Global test utilities
global.fetch = jest.fn();

// Setup for React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});