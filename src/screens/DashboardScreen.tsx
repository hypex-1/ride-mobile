import React from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Card, Button, Avatar, Text, Chip } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { DashboardScreenProps } from '../types/navigation';
import { useAppTheme, spacing, radii } from '../theme';
import type { AppTheme } from '../theme';

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const theme = useAppTheme();
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

  const handleViewEarnings = () => {
    Alert.alert(
      '💰 Earnings Dashboard',
      'Earnings dashboard coming soon!\n\nHere you will see:\n• Daily earnings breakdown\n• Weekly/monthly reports\n• Payment history\n• Tax summaries',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handleVehicleSettings = () => {
    Alert.alert(
      '🔧 Vehicle Settings',
      'Vehicle management coming soon!\n\nHere you can:\n• Update vehicle information\n• Upload inspection documents\n• Manage insurance details\n• Update license plate',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handleRideHistory = () => {
    Alert.alert(
      '📋 Ride History',
      'Ride history coming soon!\n\nHere you will see:\n• Past rides\n• Trip details\n• Receipts\n• Ratings and reviews',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handlePaymentMethods = () => {
    Alert.alert(
      '💳 Payment Methods',
      'Payment methods coming soon!\n\nHere you can:\n• Add credit/debit cards\n• Manage digital wallets\n• Set default payment\n• View payment history',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  if (!user) {
    return null; // This shouldn't happen, but just in case
  }

  const isDriver = user.role?.toLowerCase() === 'driver';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* User Profile Card */}
      <Card style={styles.profileCard} mode="elevated">
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Text
              size={72}
              label={user.name ? user.name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase() : user.email.charAt(0).toUpperCase()}
            />
            <View style={styles.profileInfo}>
              <Text variant="titleMedium" style={styles.profileName}>
                {user.name || 'User'}
              </Text>
              <Text variant="bodyMedium" style={styles.profileEmail}>
                {user.email}
              </Text>
              <Chip
                mode="outlined"
                style={[styles.roleChip, isDriver ? styles.driverChip : styles.riderChip]}
                textStyle={styles.roleChipText}
              >
                {isDriver ? 'Driver' : 'Rider'}
              </Chip>
            </View>
          </View>

          {isDriver && (
            <View style={styles.driverDetails}>
              <Text variant="bodySmall" style={styles.driverDetailText}>Vehicle · Toyota Corolla 2020</Text>
              <Text variant="bodySmall" style={styles.driverDetailText}>Plate · 123 TUN 456</Text>
              <Text variant="bodySmall" style={styles.driverDetailText}>Rating · 4.8 (245 rides)</Text>
              <Text variant="bodySmall" style={styles.driverDetailText}>Today · 85.50 TND earned</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Role-specific Actions */}
      <Card style={styles.sectionCard} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {isDriver ? 'Driver workspace' : 'Plan your next ride'}
          </Text>
          <Text variant="bodyMedium" style={styles.sectionSubtitle}>
            {isDriver
              ? 'Go online to start accepting new ride requests.'
              : 'Pick a destination and we will match you with nearby drivers.'}
          </Text>

          {isDriver ? (
            <>
              <Button
                mode="contained"
                style={styles.primaryAction}
                contentStyle={styles.buttonContent}
                onPress={() => navigation.navigate('DriverHome')}
                icon="car"
              >
                Go online
              </Button>
              <Button
                mode="outlined"
                style={styles.secondaryAction}
                contentStyle={styles.buttonContent}
                onPress={handleViewEarnings}
                icon="cash"
              >
                View earnings
              </Button>
              <Button
                mode="outlined"
                style={styles.secondaryAction}
                contentStyle={styles.buttonContent}
                onPress={handleVehicleSettings}
                icon="car-cog"
              >
                Vehicle settings
              </Button>
            </>
          ) : (
            <>
              <Button
                mode="contained"
                style={styles.primaryAction}
                contentStyle={styles.buttonContent}
                onPress={() => navigation.navigate('Home')}
                icon="map-marker"
              >
                Request a ride
              </Button>
              <Button
                mode="outlined"
                style={styles.secondaryAction}
                contentStyle={styles.buttonContent}
                onPress={handleRideHistory}
                icon="history"
              >
                Ride history
              </Button>
              <Button
                mode="outlined"
                style={styles.secondaryAction}
                contentStyle={styles.buttonContent}
                onPress={handlePaymentMethods}
                icon="credit-card"
              >
                Payment methods
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Account Status */}
      <Card style={styles.sectionCard} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {isDriver ? 'Driver status' : 'Account status'}
          </Text>

          {isDriver ? (
            <View style={styles.statusGrid}>
              <View style={styles.statusRow}>
                <Text variant="bodyMedium" style={styles.statusLabel}>Availability</Text>
                <Chip mode="outlined" style={styles.statusChip} textStyle={styles.statusChipText}>
                  Online
                </Chip>
              </View>
              <View style={styles.statusRow}>
                <Text variant="bodyMedium" style={styles.statusLabel}>License</Text>
                <Chip mode="outlined" style={styles.statusChip} textStyle={styles.statusChipText}>
                  Verified
                </Chip>
              </View>
              <View style={styles.statusRow}>
                <Text variant="bodyMedium" style={styles.statusLabel}>Inspection</Text>
                <Chip mode="outlined" style={styles.statusChip} textStyle={styles.statusChipText}>
                  Valid · Dec 2025
                </Chip>
              </View>
              <View style={styles.statusRow}>
                <Text variant="bodyMedium" style={styles.statusLabel}>Background</Text>
                <Chip mode="outlined" style={styles.statusChip} textStyle={styles.statusChipText}>
                  Cleared
                </Chip>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.statusRow}>
                <Text variant="bodyMedium" style={styles.statusLabel}>Email verification</Text>
                <Chip
                  mode="outlined"
                  style={[styles.statusChip, !user.isVerified && styles.statusChipWarning]}
                  textStyle={[styles.statusChipText, !user.isVerified && styles.statusChipWarningText]}
                >
                  {user.isVerified ? 'Verified' : 'Pending'}
                </Chip>
              </View>

              {!user.isVerified && (
                <Button
                  mode="text"
                  textColor={theme.colors.primary}
                  style={styles.verifyButton}
                  onPress={() => {/* TODO: Navigate to email verification */}}
                >
                  Verify email
                </Button>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        contentStyle={styles.buttonContent}
      >
        Sign out
      </Button>

      {/* Debug Info (Development only) */}
      {__DEV__ && (
  <Card style={styles.debugCard} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall" style={styles.debugTitle}>Debug info</Text>
            <Text variant="bodySmall" style={styles.debugText}>User ID: {user.id}</Text>
            <Text variant="bodySmall" style={styles.debugText}>Role: {user.role} (isDriver: {isDriver.toString()})</Text>
            <Text variant="bodySmall" style={styles.debugText}>Created: {new Date(user.createdAt).toLocaleDateString()}</Text>
          </Card.Content>
        </Card>
      )}
      </ScrollView>
    </View>
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
    scrollContent: {
      padding: spacing(3),
      paddingBottom: spacing(4),
    },
    profileCard: {
      marginBottom: spacing(2),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileInfo: {
      flex: 1,
      marginLeft: spacing(2),
    },
    profileName: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    profileEmail: {
      marginTop: spacing(0.5),
      color: theme.colors.onSurfaceVariant,
    },
    roleChip: {
      marginTop: spacing(1),
      alignSelf: 'flex-start',
      borderRadius: radii.pill,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surfaceVariant,
    },
    roleChipText: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    driverChip: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    riderChip: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    driverDetails: {
      marginTop: spacing(2),
      paddingTop: spacing(1.5),
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    driverDetailText: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(0.5),
    },
    sectionCard: {
      marginBottom: spacing(2),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: spacing(1),
    },
    sectionSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(2),
    },
    primaryAction: {
      borderRadius: radii.md,
    },
    secondaryAction: {
      marginTop: spacing(1),
      borderRadius: radii.md,
    },
    buttonContent: {
      height: 50,
    },
    statusGrid: {
      marginTop: spacing(1),
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing(0.75),
    },
    statusLabel: {
      color: theme.colors.onSurface,
      flex: 1,
    },
    statusChip: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surfaceVariant,
    },
    statusChipText: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    statusChipWarning: {
      borderColor: theme.colors.error,
      backgroundColor: 'rgba(220,38,38,0.1)',
    },
    statusChipWarningText: {
      color: theme.colors.error,
    },
    verifyButton: {
      marginTop: spacing(1),
      alignSelf: 'flex-start',
    },
    logoutButton: {
      marginTop: spacing(1),
      borderRadius: radii.md,
      borderColor: theme.colors.outline,
    },
    debugCard: {
      marginTop: spacing(2),
      borderRadius: radii.lg,
    },
    debugTitle: {
      marginBottom: spacing(1),
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    debugText: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(0.5),
    },
  });

export default DashboardScreen;