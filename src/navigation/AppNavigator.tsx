import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { navigationTheme, useAppTheme } from '../theme';
import type { AppTheme } from '../theme';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RequestRideScreen from '../screens/RequestRideScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HomeScreen from '../screens/rider/HomeScreen';
import RideTrackingScreen from '../screens/rider/RideTrackingScreen';
import RideReceiptScreen from '../screens/rider/RideReceiptScreen';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import RideHistoryScreen from '../screens/rider/RideHistoryScreen';
import SavedPlacesScreen from '../screens/rider/SavedPlacesScreen';
import PaymentMethodsScreen from '../screens/rider/PaymentMethodsScreen';
import SupportScreen from '../screens/rider/SupportScreen';
import PromotionsScreen from '../screens/rider/PromotionsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <SocketProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            // User is authenticated - show app screens
            <>
              {user.role === 'RIDER' ? (
                <Stack.Screen 
                  name="RequestRide" 
                  component={RequestRideScreen}
                  options={{ title: 'RideMobile' }}
                />
              ) : (
                <Stack.Screen 
                  name="DriverHome" 
                  component={DriverHomeScreen}
                  options={{ title: 'Driver Dashboard', headerShown: true }}
                />
              )}
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen}
                options={{ title: 'Settings', headerShown: true }}
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen}
                options={{ title: 'Profile', headerShown: true }}
              />
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
              <Stack.Screen 
                name="RideHistory" 
                component={RideHistoryScreen}
                options={{ title: 'Ride History', headerShown: true }}
              />
              <Stack.Screen 
                name="SavedPlaces" 
                component={SavedPlacesScreen}
                options={{ title: 'Saved Places', headerShown: true }}
              />
              <Stack.Screen 
                name="PaymentMethods" 
                component={PaymentMethodsScreen}
                options={{ title: 'Payment Methods', headerShown: true }}
              />
              <Stack.Screen 
                name="Support" 
                component={SupportScreen}
                options={{ title: 'Support', headerShown: true }}
              />
              <Stack.Screen 
                name="Promotions" 
                component={PromotionsScreen}
                options={{ title: 'Promotions', headerShown: true }}
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

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
  });

export default AppNavigator;