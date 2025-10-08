import React from 'react';
import { View, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native';
import { Surface, Button, Avatar, Text, IconButton, TouchableRipple, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardScreenProps } from '../../types/navigation';
import { spacing, radii } from '../../theme';

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const handleLogout = async () => {
    try {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                await logout();
              } catch (error) {
                console.error('Logout error:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null; // This shouldn't happen, but just in case
  }

  const isDriver = user.role?.toLowerCase() === 'driver';

  const accountOptions = React.useMemo(
    () => [
      {
        key: 'edit-profile',
        icon: 'account-circle',
        label: 'Edit profile',
        onPress: () => (navigation as any).navigate('EditProfile'),
      },
      {
        key: 'delete-account',
        icon: 'account-remove',
        label: 'Delete account',
        onPress: () => (navigation as any).navigate('DeleteAccount'),
      },
    ],
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.surface} barStyle="dark-content" />
      
      {/* Header - Bolt Style */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
        <IconButton
          icon="logout"
          size={24}
          onPress={handleLogout}
          style={styles.logoutIcon}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section - Bolt Style */}
        <Surface elevation={1} style={styles.profileSection}>
          <View style={styles.profileRow}>
            {user?.profilePicture ? (
              <Avatar.Image
                size={56}
                source={{ uri: user.profilePicture }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={56}
                label={user.name ? user.name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase() : user.email.charAt(0).toUpperCase()}
                style={styles.avatar}
              />
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user.name || 'User'}
              </Text>
              <Text style={styles.userEmail}>
                {user.email}
              </Text>
              <Text style={styles.userRole}>
                {isDriver ? 'Driver' : 'Rider'}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Quick Actions - Bolt Style */}
        <Surface elevation={1} style={styles.actionSection}>
          {isDriver ? (
            <>
              <Button
                mode="contained"
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
                onPress={() => (navigation as any).navigate('DriverHome')}
                icon="car"
              >
                Go online
              </Button>
              <View style={styles.actionGrid}>
                <Button
                  mode="text"
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  icon="cash"
                  onPress={() => Alert.alert('Earnings', 'Coming soon')}
                >
                  Earnings
                </Button>
                <Button
                  mode="text"
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  icon="car-cog"
                  onPress={() => Alert.alert('Vehicle', 'Coming soon')}
                >
                  Vehicle
                </Button>
              </View>
            </>
          ) : (
            <>
              <Button
                mode="contained"
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
                onPress={() => (navigation as any).navigate('Home')}
                icon="map-marker"
              >
                Book a ride
              </Button>
              <View style={styles.actionGrid}>
                <Button
                  mode="text"
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  icon="history"
                  onPress={() => (navigation as any).navigate('RideHistory')}
                >
                  Your trips
                </Button>
                <Button
                  mode="text"
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  icon="credit-card"
                  onPress={() => Alert.alert('Payment', 'Coming soon')}
                >
                  Payment
                </Button>
              </View>
            </>
          )}
        </Surface>

        {/* Settings List - Bolt Style */}
        <Surface elevation={1} style={styles.settingsSection}>
          {accountOptions.map((option, index) => (
            <React.Fragment key={option.key}>
              <TouchableRipple onPress={option.onPress} style={styles.settingsRipple}>
                <View style={styles.settingsItem}>
                  <IconButton icon={option.icon} size={24} style={styles.settingsIcon} />
                  <Text style={styles.settingsText}>{option.label}</Text>
                  <IconButton icon="chevron-right" size={20} style={styles.chevronIcon} />
                </View>
              </TouchableRipple>
              {index < accountOptions.length - 1 && <View style={styles.settingsDivider} />}
            </React.Fragment>
          ))}
        </Surface>

        {/* Driver Status (for drivers only) */}
        {isDriver && (
          <Surface elevation={1} style={styles.statusSection}>
            <Text style={styles.statusTitle}>Driver status</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>License</Text>
              <Text style={styles.statusValue}>Verified</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Vehicle inspection</Text>
              <Text style={styles.statusValue}>Valid until Dec 2025</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Background check</Text>
              <Text style={styles.statusValue}>Cleared</Text>
            </View>
          </Surface>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    
    // Header - Bolt Style
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    logoutIcon: {
      margin: 0,
    },

    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing(2),
      paddingBottom: spacing(4),
    },

    // Profile Section - Bolt Style
    profileSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: radii.lg,
      padding: spacing(3),
      marginBottom: spacing(2),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      backgroundColor: theme.colors.primary,
    },
    profileInfo: {
      flex: 1,
      marginLeft: spacing(2),
    },
    userName: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing(0.5),
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(0.5),
    },
    userRole: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(0.5),
      borderRadius: radii.sm,
      alignSelf: 'flex-start',
    },

    // Action Section - Bolt Style
    actionSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: radii.lg,
      padding: spacing(3),
      marginBottom: spacing(2),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: radii.md,
      marginBottom: spacing(2),
    },
    buttonContent: {
      height: 52,
    },
    actionGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    actionButton: {
      flex: 1,
      marginHorizontal: spacing(0.5),
    },
    actionButtonContent: {
      height: 48,
      flexDirection: 'column',
    },

    // Settings Section - Bolt Style
    settingsSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: radii.lg,
      padding: spacing(1),
      marginBottom: spacing(2),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    settingsRipple: {
      borderRadius: radii.md,
    },
    settingsItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing(1),
      paddingHorizontal: spacing(2),
    },
    settingsIcon: {
      margin: 0,
      marginRight: spacing(1),
    },
    settingsText: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.onSurface,
      marginLeft: spacing(1),
    },
    chevronIcon: {
      margin: 0,
    },
    settingsDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outline,
      marginLeft: spacing(7),
    },

    // Status Section - Bolt Style (for drivers)
    statusSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: radii.lg,
      padding: spacing(3),
      marginBottom: spacing(2),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(2),
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing(1),
    },
    statusLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    statusValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
  });

export default DashboardScreen;