import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  RequestRide: undefined;
  Settings: undefined;
  Profile: undefined;
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
  RideHistory: undefined;
  SavedPlaces: undefined;
  PaymentMethods: undefined;
  Support: undefined;
  Promotions: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type RequestRideScreenProps = NativeStackScreenProps<RootStackParamList, 'RequestRide'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
export type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type RideTrackingScreenProps = NativeStackScreenProps<RootStackParamList, 'RideTracking'>;
export type RideReceiptScreenProps = NativeStackScreenProps<RootStackParamList, 'RideReceipt'>;
export type RideHistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'RideHistory'>;
export type SavedPlacesScreenProps = NativeStackScreenProps<RootStackParamList, 'SavedPlaces'>;
export type PaymentMethodsScreenProps = NativeStackScreenProps<RootStackParamList, 'PaymentMethods'>;
export type SupportScreenProps = NativeStackScreenProps<RootStackParamList, 'Support'>;
export type PromotionsScreenProps = NativeStackScreenProps<RootStackParamList, 'Promotions'>;