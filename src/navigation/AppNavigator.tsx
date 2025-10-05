import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { RootStackParamList } from '../types/navigation';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HomeScreen from '../screens/rider/HomeScreen';
import RideTrackingScreen from '../screens/rider/RideTrackingScreen';
import RideReceiptScreen from '../screens/rider/RideReceiptScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <SocketProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            // User is authenticated - show app screens
            <>
              <Stack.Screen 
                name="Dashboard" 
                component={DashboardScreen}
                options={{ title: `${user.role === 'driver' ? 'Driver' : 'Rider'} Dashboard` }}
              />
              <Stack.Screen 
                name="Home" 
                component={HomeScreen}
                options={{ title: 'Find a Ride', headerShown: true }}
              />
              <Stack.Screen 
                name="RideTracking" 
                component={RideTrackingScreen}
                options={{ title: 'Your Ride', headerShown: true }}
              />
              <Stack.Screen 
                name="RideReceipt" 
                component={RideReceiptScreen}
                options={{ title: 'Ride Receipt', headerShown: true }}
              />
            </>
          ) : (
            // User is not authenticated - show auth screens
            <>
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ title: 'Sign In' }}
              />
              <Stack.Screen 
                name="Register" 
                component={RegisterScreen}
                options={{ title: 'Create Account' }}
              />
            </>
          )}
        </Stack.Navigator>
      </SocketProvider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default AppNavigator;