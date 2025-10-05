import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Home: undefined;
  DriverHome: undefined;
  RideTracking: {
    rideId: string;
    pickupLocation: {
      latitude: number;
      longitude: number;
      address: string;
    };
    dropoffLocation: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
  RideReceipt: {
    rideId: string;
    totalAmount: number;
    rideDetails: {
      pickupLocation: string;
      dropoffLocation: string;
      distance: number;
      duration: number;
      driverName: string;
      vehicleInfo: string;
    };
  };
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type RideTrackingScreenProps = NativeStackScreenProps<RootStackParamList, 'RideTracking'>;
export type RideReceiptScreenProps = NativeStackScreenProps<RootStackParamList, 'RideReceipt'>;