import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiService } from './api';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private pushToken: string | null = null;

  // Initialize notifications and get push token
  async initialize(): Promise<string | null> {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.log('🚫 Push notifications only work on physical devices');
        return null;
      }

      // Get existing notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('🚫 Failed to get push token for push notification!');
        return null;
      }

      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID?.trim();
      const isUuid = projectId
        ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/u.test(projectId)
        : false;

      if (!isUuid) {
        console.log(
          '⚠️ Skipping Expo push token fetch: missing valid EXPO_PUBLIC_PROJECT_ID. Set this to your Expo project UUID when building a dev/production client.'
        );
        return null;
      }

      // Get the push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('🔔 Push token obtained:', token.data);
      this.pushToken = token.data;

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('ride-updates', {
          name: 'Ride Updates',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('driver-alerts', {
          name: 'Driver Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4CAF50',
        });
      }

      return token.data;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  // Send push token to backend
  async registerPushToken(token: string): Promise<boolean> {
    try {
      console.log('📤 Sending push token to backend:', token);
      
      await apiService.post('/users/me/push-token', {
        pushToken: token,
        platform: Platform.OS,
        deviceInfo: {
          brand: Device.brand,
          modelName: Device.modelName,
          osName: Device.osName,
          osVersion: Device.osVersion,
        }
      });

      console.log('✅ Push token registered successfully');
      return true;
    } catch (error) {
      console.error('❌ Error registering push token:', error);
      return false;
    }
  }

  // Set up notification listeners
  setupNotificationListeners(): {
    responseListener: any;
    notificationListener: any;
  } {
    // Handle notification received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
      
      // You can handle specific notification types here
      const { title, body, data } = notification.request.content;
      
      if (data?.type === 'ride_accepted') {
        console.log('🚗 Ride accepted notification');
      } else if (data?.type === 'new_ride_request') {
        console.log('📱 New ride request notification');
      }
    });

    // Handle notification response (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      
      const { data } = response.notification.request.content;
      
      // Navigate based on notification type
      if (data?.type === 'ride_accepted' && data?.rideId) {
        // Navigate to ride tracking screen
        console.log('Navigate to ride tracking for ride:', data.rideId);
      } else if (data?.type === 'new_ride_request' && data?.rideId) {
        // Navigate to ride request screen for drivers
        console.log('Navigate to ride request for ride:', data.rideId);
      }
    });

    return { notificationListener, responseListener };
  }

  // Remove notification listeners
  removeNotificationListeners(listeners: { notificationListener: any; responseListener: any }) {
    if (listeners.notificationListener) {
      listeners.notificationListener.remove();
    }
    if (listeners.responseListener) {
      listeners.responseListener.remove();
    }
  }

  // Send local test notification (for testing)
  async sendTestNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
      console.log('📱 Test notification sent');
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  }

  // Get current push token
  getPushToken(): string | null {
    return this.pushToken;
  }

  // Check notification permissions
  async checkPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
}

export const notificationService = new NotificationService();
export default notificationService;