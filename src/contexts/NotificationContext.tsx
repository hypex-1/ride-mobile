import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notification';

interface NotificationContextType {
  isNotificationEnabled: boolean;
  sendTestNotification: (title: string, body: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [listeners, setListeners] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setupNotificationListeners();
    } else {
      removeNotificationListeners();
    }

    return () => {
      removeNotificationListeners();
    };
  }, [user]);

  const setupNotificationListeners = () => {
    console.log('🔧 Setting up notification listeners');
    
    const notificationListeners = notificationService.setupNotificationListeners();
    setListeners(notificationListeners);
    
    // Check if notifications are enabled
    notificationService.checkPermissions().then(setIsNotificationEnabled);

    // Override the notification received handler for app-specific logic
    const { notificationListener, responseListener } = notificationListeners;

    // Create enhanced listeners that include navigation logic
    const enhancedNotificationListener = notificationListener;
    
    const enhancedResponseListener = responseListener;

    setListeners({
      notificationListener: enhancedNotificationListener,
      responseListener: enhancedResponseListener,
    });
  };

  const removeNotificationListeners = () => {
    if (listeners) {
      console.log('🔧 Removing notification listeners');
      notificationService.removeNotificationListeners(listeners);
      setListeners(null);
    }
  };

  const sendTestNotification = async (title: string, body: string) => {
    try {
      await notificationService.sendTestNotification(title, body, {
        type: 'test',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const value: NotificationContextType = {
    isNotificationEnabled,
    sendTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};