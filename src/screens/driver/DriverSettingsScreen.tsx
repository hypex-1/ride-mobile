import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Surface,
  Text,
  IconButton,
  List,
  Divider,
  Switch,
  Button,
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';
import type { DriverSettingsScreenProps } from '../../types/navigation';

const DriverSettingsScreen: React.FC<DriverSettingsScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  // Settings state
  const [settings, setSettings] = useState({
    pushNotifications: true,
    rideRequestAlerts: true,
    autoAcceptMode: false,
    shareLocation: true,
    voiceNavigation: true,
    darkMode: false,
    offlineMode: false,
  });

  const handleToggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            setSettings({
              pushNotifications: true,
              rideRequestAlerts: true,
              autoAcceptMode: false,
              shareLocation: true,
              voiceNavigation: true,
              darkMode: false,
              offlineMode: false,
            });
            Alert.alert('Success', 'Settings have been reset to default values.');
          }
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert('Coming Soon', 'Support contact will be available soon.');
  };

  const handleReportBug = () => {
    Alert.alert('Coming Soon', 'Bug reporting will be available soon.');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Coming Soon', 'Privacy policy will be available soon.');
  };

  const handleTermsOfService = () => {
    Alert.alert('Coming Soon', 'Terms of service will be available soon.');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={theme.colors.onSurface}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Settings
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Notifications */}
          <Surface style={styles.settingsCard}>
            <Text variant="titleMedium" style={styles.cardTitle}>Notifications</Text>
            
            <List.Item
              title="Push Notifications"
              description="Receive notifications on your device"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={settings.pushNotifications}
                  onValueChange={() => handleToggleSetting('pushNotifications')}
                />
              )}
              style={styles.settingItem}
            />
            <Divider />
            <List.Item
              title="Ride Request Alerts"
              description="Get notified when new ride requests come in"
              left={(props) => <List.Icon {...props} icon="car" />}
              right={() => (
                <Switch
                  value={settings.rideRequestAlerts}
                  onValueChange={() => handleToggleSetting('rideRequestAlerts')}
                />
              )}
              style={styles.settingItem}
            />
          </Surface>

          {/* Driver Preferences */}
          <Surface style={styles.settingsCard}>
            <Text variant="titleMedium" style={styles.cardTitle}>Driver Preferences</Text>
            
            <List.Item
              title="Auto-Accept Mode"
              description="Automatically accept ride requests (use with caution)"
              left={(props) => <List.Icon {...props} icon="auto-fix" />}
              right={() => (
                <Switch
                  value={settings.autoAcceptMode}
                  onValueChange={() => handleToggleSetting('autoAcceptMode')}
                />
              )}
              style={styles.settingItem}
            />
            <Divider />
            <List.Item
              title="Share Location"
              description="Share real-time location with riders"
              left={(props) => <List.Icon {...props} icon="map-marker" />}
              right={() => (
                <Switch
                  value={settings.shareLocation}
                  onValueChange={() => handleToggleSetting('shareLocation')}
                />
              )}
              style={styles.settingItem}
            />
            <Divider />
            <List.Item
              title="Voice Navigation"
              description="Enable voice-guided navigation"
              left={(props) => <List.Icon {...props} icon="volume-high" />}
              right={() => (
                <Switch
                  value={settings.voiceNavigation}
                  onValueChange={() => handleToggleSetting('voiceNavigation')}
                />
              )}
              style={styles.settingItem}
            />
          </Surface>

          {/* App Preferences */}
          <Surface style={styles.settingsCard}>
            <Text variant="titleMedium" style={styles.cardTitle}>App Preferences</Text>
            
            <List.Item
              title="Dark Mode"
              description="Use dark theme for better night driving"
              left={(props) => <List.Icon {...props} icon="weather-night" />}
              right={() => (
                <Switch
                  value={settings.darkMode}
                  onValueChange={() => handleToggleSetting('darkMode')}
                />
              )}
              style={styles.settingItem}
            />
            <Divider />
            <List.Item
              title="Offline Mode"
              description="Continue working with limited connectivity"
              left={(props) => <List.Icon {...props} icon="wifi-off" />}
              right={() => (
                <Switch
                  value={settings.offlineMode}
                  onValueChange={() => handleToggleSetting('offlineMode')}
                />
              )}
              style={styles.settingItem}
            />
          </Surface>

          {/* Account */}
          <Surface style={styles.settingsCard}>
            <Text variant="titleMedium" style={styles.cardTitle}>Account</Text>
            
            <List.Item
              title="Edit Profile"
              description="Update your personal information"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('EditProfile')}
              style={styles.settingItem}
            />
            <Divider />
            <List.Item
              title="Reset Settings"
              description="Reset all settings to default values"
              left={(props) => <List.Icon {...props} icon="restore" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleResetSettings}
              style={styles.settingItem}
            />
          </Surface>

          {/* Support */}
          <Surface style={styles.settingsCard}>
            <Text variant="titleMedium" style={styles.cardTitle}>Support</Text>
            
            <List.Item
              title="Contact Support"
              description="Get help with driver issues"
              left={(props) => <List.Icon {...props} icon="headphones" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleContactSupport}
              style={styles.settingItem}
            />
            <Divider />
            <List.Item
              title="Report a Bug"
              description="Report technical issues with the app"
              left={(props) => <List.Icon {...props} icon="bug" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleReportBug}
              style={styles.settingItem}
            />
          </Surface>

          {/* Legal */}
          <Surface style={styles.settingsCard}>
            <Text variant="titleMedium" style={styles.cardTitle}>Legal</Text>
            
            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handlePrivacyPolicy}
              style={styles.settingItem}
            />
            <Divider />
            <List.Item
              title="Terms of Service"
              description="Read our terms of service"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleTermsOfService}
              style={styles.settingItem}
            />
          </Surface>

          {/* Sign Out */}
          <View style={styles.signOutContainer}>
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.signOutButton}
              textColor={theme.colors.error}
              buttonColor="transparent"
            >
              Sign Out
            </Button>
          </View>

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text variant="bodySmall" style={styles.versionText}>
              RideMobile Driver v1.0.0
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    headerSpacer: {
      width: 48,
    },
    scrollView: {
      flex: 1,
    },
    settingsCard: {
      margin: spacing(3),
      marginBottom: spacing(2),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 2,
      overflow: 'hidden',
    },
    cardTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      padding: spacing(3),
      paddingBottom: spacing(1),
    },
    settingItem: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
    },
    signOutContainer: {
      margin: spacing(3),
      marginTop: spacing(2),
    },
    signOutButton: {
      borderColor: theme.colors.error,
    },
    versionContainer: {
      alignItems: 'center',
      paddingBottom: spacing(4),
    },
    versionText: {
      color: theme.colors.onSurfaceVariant,
    },
  });

export default DriverSettingsScreen;