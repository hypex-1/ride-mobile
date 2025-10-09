import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { useAppTheme, navigationTheme } from '../theme';
import type { AppTheme } from '../theme';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ProfileScreen from '../screens/rider/ProfileScreen';
import DashboardScreen from '../screens/rider/DashboardScreen';
import HomeScreen from '../screens/rider/HomeScreen';
import RideTrackingScreen from '../screens/rider/RideTrackingScreen';
import RideReceiptScreen from '../screens/rider/RideReceiptScreen';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';
import DriverEarningsScreen from '../screens/driver/DriverEarningsScreen';
import DriverRideHistoryScreen from '../screens/driver/DriverRideHistoryScreen';
import DriverDocumentsScreen from '../screens/driver/DriverDocumentsScreen';
import DriverSettingsScreen from '../screens/driver/DriverSettingsScreen';
import DriverPickupScreen from '../screens/driver/DriverPickupScreen';
import RideHistoryScreen from '../screens/rider/RideHistoryScreen';
import PaymentMethodsScreen from '../screens/rider/PaymentMethodsScreen';
import EditProfileScreen from '../screens/rider/EditProfileScreen';

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
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'fade',
          }}
        >
          {user ? (
            // User is authenticated - show app screens
            <>
              {user.role === 'RIDER' ? (
                <Stack.Screen 
                  name="Home" 
                  component={HomeScreen}
                  options={{ headerShown: false }}
                />
              ) : (
                <Stack.Screen 
                  name="DriverHome" 
                  component={DriverHomeScreen}
                  options={{ headerShown: false }}
                />
              )}
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Dashboard" 
                component={DashboardScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="RideTracking" 
                component={RideTrackingScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="RideReceipt" 
                component={RideReceiptScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="RideHistory" 
                component={RideHistoryScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="PaymentMethods" 
                component={PaymentMethodsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="EditProfile" 
                component={EditProfileScreen}
                options={{ headerShown: false }}
              />
              {/* Driver-specific screens */}
              <Stack.Screen 
                name="DriverProfile" 
                component={DriverProfileScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="DriverEarnings" 
                component={DriverEarningsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="DriverRideHistory" 
                component={DriverRideHistoryScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="DriverDocuments" 
                component={DriverDocumentsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="DriverSettings" 
                component={DriverSettingsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="DriverPickup" 
                component={DriverPickupScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            // User is not authenticated - show auth screens
            <>
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Register" 
                component={RegisterScreen}
                options={{ headerShown: false }}
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