import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { PaymentProvider } from './src/contexts/PaymentContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <NotificationProvider>
          <PaymentProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </PaymentProvider>
        </NotificationProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
