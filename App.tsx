import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { paperTheme } from './src/theme';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { PaymentProvider } from './src/contexts/PaymentContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <NotificationProvider>
          <PaymentProvider>
            <AppNavigator />
            <StatusBar style="dark" />
          </PaymentProvider>
        </NotificationProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
