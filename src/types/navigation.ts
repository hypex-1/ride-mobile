import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Profile: undefined;
  Dashboard: undefined;
  Home: undefined;
  DriverHome: undefined;
  DriverProfile: undefined;
  DriverEarnings: undefined;
  DriverRideHistory: undefined;
  DriverDocuments: undefined;
  DriverSettings: undefined;
  DriverPickup: { rideId: string };
  EditProfile: undefined;
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
  PaymentMethods: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
export type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type DriverHomeScreenProps = NativeStackScreenProps<RootStackParamList, 'DriverHome'>;
export type DriverProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'DriverProfile'>;
export type DriverEarningsScreenProps = NativeStackScreenProps<RootStackParamList, 'DriverEarnings'>;
export type DriverRideHistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'DriverRideHistory'>;
export type DriverDocumentsScreenProps = NativeStackScreenProps<RootStackParamList, 'DriverDocuments'>;
export type DriverSettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'DriverSettings'>;
export type DriverPickupScreenProps = NativeStackScreenProps<RootStackParamList, 'DriverPickup'>;
export type RideTrackingScreenProps = NativeStackScreenProps<RootStackParamList, 'RideTracking'>;
export type RideReceiptScreenProps = NativeStackScreenProps<RootStackParamList, 'RideReceipt'>;
export type RideHistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'RideHistory'>;
export type PaymentMethodsScreenProps = NativeStackScreenProps<RootStackParamList, 'PaymentMethods'>;
export type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;
