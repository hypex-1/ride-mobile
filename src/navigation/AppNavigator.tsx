import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createNativeStackNavigator();

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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is authenticated - show app screens
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{ title: `${user.role === 'driver' ? 'Driver' : 'Rider'} Dashboard` }}
          />
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