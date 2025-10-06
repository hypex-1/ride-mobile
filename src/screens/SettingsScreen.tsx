import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import {
  Surface,
  Text,
  Button,
  List,
  Avatar,
  Divider,
  Switch,
  TouchableRipple
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { SettingsScreenProps } from '../types/navigation';
import { useAppTheme, spacing, radii } from '../theme';
import type { AppTheme } from '../theme';

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationSharing, setLocationSharing] = React.useState(true);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileEdit = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Surface elevation={0} style={styles.profileHeader}>
          <TouchableRipple
            style={styles.profileCard}
            onPress={handleProfileEdit}
            borderless
          >
            <View style={styles.profileContent}>
              <Avatar.Text
                size={64}
                label={user?.name
                  ?.split(' ')
                  .map(part => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'U'}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text variant="titleLarge" style={styles.userName}>
                  {user?.name || 'User'}
                </Text>
                <Text variant="bodyMedium" style={styles.userEmail}>
                  {user?.email || 'user@example.com'}
                </Text>
                <Text variant="bodySmall" style={styles.userRole}>
                  {user?.role === 'RIDER' ? 'Rider Account' : 'Driver Account'}
                </Text>
              </View>
              <List.Icon icon="chevron-right" color={theme.colors.onSurfaceVariant} />
            </View>
          </TouchableRipple>
        </Surface>

        {/* Account Section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Account
          </Text>
          
          <Surface elevation={0} style={styles.listCard}>
            <List.Item
              title="Personal Information"
              description="Name, email, phone number"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleProfileEdit}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Payment Methods"
              description="Manage cards and payment options"
              left={(props) => <List.Icon {...props} icon="credit-card" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('PaymentMethods')}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Ride History"
              description="View past rides and receipts"
              left={(props) => <List.Icon {...props} icon="history" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('RideHistory')}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Saved Places"
              description="Manage favorite pickup spots"
              left={(props) => <List.Icon {...props} icon="heart" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('SavedPlaces')}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Promotions"
              description="Track rewards and promo codes"
              left={(props) => <List.Icon {...props} icon="tag" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Promotions')}
            />
          </Surface>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Preferences
          </Text>
          
          <Surface elevation={0} style={styles.listCard}>
            <List.Item
              title="Push Notifications"
              description="Ride updates and promotions"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Location Sharing"
              description="Share location during rides"
              left={(props) => <List.Icon {...props} icon="map-marker" />}
              right={() => (
                <Switch
                  value={locationSharing}
                  onValueChange={setLocationSharing}
                />
              )}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Language"
              description="English"
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: language selection */}}
            />
          </Surface>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Support
          </Text>
          
          <Surface elevation={0} style={styles.listCard}>
            <List.Item
              title="Help Center"
              description="FAQs and support articles"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Support')}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Contact Support"
              description="Get help from our team"
              left={(props) => <List.Icon {...props} icon="message" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Support')}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Safety"
              description="Emergency contacts and features"
              left={(props) => <List.Icon {...props} icon="shield-check" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Support')}
            />
          </Surface>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Legal
          </Text>
          
          <Surface elevation={0} style={styles.listCard}>
            <List.Item
              title="Terms of Service"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: terms */}}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Privacy Policy"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: privacy */}}
            />
          </Surface>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor={theme.colors.error}
          >
            Sign Out
          </Button>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>RideMobile v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    profileHeader: {
      backgroundColor: theme.colors.surface,
      marginBottom: spacing(2),
    },
    profileCard: {
      borderRadius: 0,
    },
    profileContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing(2.5),
    },
    avatar: {
      backgroundColor: theme.colors.primaryContainer,
      marginRight: spacing(2),
    },
    profileInfo: {
      flex: 1,
    },
    userName: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    userEmail: {
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing(0.25),
    },
    userRole: {
      color: theme.colors.primary,
      marginTop: spacing(0.25),
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    section: {
      marginBottom: spacing(2.5),
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginHorizontal: spacing(2),
      marginBottom: spacing(1),
    },
    listCard: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: spacing(2),
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
    },
    divider: {
      backgroundColor: theme.colors.outlineVariant,
      marginHorizontal: spacing(2),
    },
    logoutSection: {
      paddingHorizontal: spacing(2),
      marginTop: spacing(2),
      marginBottom: spacing(3),
    },
    logoutButton: {
      borderColor: theme.colors.error,
      borderRadius: radii.lg,
    },
    versionSection: {
      alignItems: 'center',
      paddingBottom: spacing(3),
    },
    versionText: {
      color: theme.colors.onSurfaceVariant,
    },
  });

export default SettingsScreen;