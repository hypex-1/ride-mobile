import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Surface,
  Card,
  Button,
  Text,
  IconButton,
  Avatar,
  List,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { driverService } from '../../services';
import type { DriverStats } from '../../services/driver';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';
import type { DriverProfileScreenProps } from '../../types/navigation';

const DriverProfileScreen: React.FC<DriverProfileScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriverStats();
  }, []);

  const loadDriverStats = async () => {
    try {
      setLoading(true);
      const driverStats = await driverService.getTodayStats();
      setStats(driverStats);
    } catch (error) {
      console.error('Error loading driver stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleViewEarnings = () => {
    navigation.navigate('DriverEarnings');
  };

  const handleViewDocuments = () => {
    navigation.navigate('DriverDocuments');
  };

  const handleSettings = () => {
    navigation.navigate('DriverSettings');
  };

  const handleRideHistory = () => {
    navigation.navigate('DriverRideHistory');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header - Enhanced Bolt Style */}
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Driver Profile
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Section - Enhanced Bolt Style */}
          <Surface style={styles.profileCard} elevation={3}>
            <View style={styles.profileHeader}>
              <Avatar.Text
                size={88}
                label={user?.name?.charAt(0) || 'D'}
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.driverName}>
                  {user?.name || 'Driver Name'}
                </Text>
                <Text variant="bodyMedium" style={styles.driverEmail}>
                  {user?.email || 'driver@example.com'}
                </Text>
                <View style={styles.ratingContainer}>
                  <View style={styles.ratingBadge}>
                    <Text variant="bodyMedium" style={styles.rating}>
                      ⭐ {stats?.rating?.toFixed(1) || '5.0'}
                    </Text>
                  </View>
                  <Text variant="bodySmall" style={styles.totalRides}>
                    {stats?.totalRides || 0} total rides
                  </Text>
                </View>
              </View>
            </View>
            
            <Button
              mode="outlined"
              onPress={handleEditProfile}
              style={styles.editButton}
              contentStyle={styles.editButtonContent}
              labelStyle={styles.editButtonLabel}
            >
              Edit Profile
            </Button>
          </Surface>

          {/* Quick Stats - Enhanced Bolt Style */}
          <Surface style={styles.statsCard} elevation={3}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Today's Performance</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={styles.statValueContainer}>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {stats?.ridesCompleted || 0}
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.statLabel}>Rides Completed</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statValueContainer}>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    ${stats?.earnings?.toFixed(2) || '0.00'}
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.statLabel}>Today's Earnings</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statValueContainer}>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {Math.floor((stats?.onlineTime || 0) / 60)}h {(stats?.onlineTime || 0) % 60}m
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.statLabel}>Time Online</Text>
              </View>
            </View>
          </Surface>

          {/* Menu Options - Enhanced Bolt Style */}
          <Surface style={styles.menuCard} elevation={3}>
            <List.Item
              title="Earnings"
              description="View earnings history and detailed reports"
              left={(props) => <List.Icon {...props} icon="currency-usd" color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
              onPress={handleViewEarnings}
              style={styles.menuItem}
              titleStyle={styles.menuTitle}
              descriptionStyle={styles.menuDescription}
            />
            <Divider style={styles.menuDivider} />
            <List.Item
              title="Ride History"
              description="View past rides and trip details"
              left={(props) => <List.Icon {...props} icon="history" color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
              onPress={handleRideHistory}
              style={styles.menuItem}
              titleStyle={styles.menuTitle}
              descriptionStyle={styles.menuDescription}
            />
            <Divider style={styles.menuDivider} />
            <List.Item
              title="Documents"
              description="Manage license, insurance, and vehicle documents"
              left={(props) => <List.Icon {...props} icon="file-document" color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
              onPress={handleViewDocuments}
              style={styles.menuItem}
              titleStyle={styles.menuTitle}
              descriptionStyle={styles.menuDescription}
            />
            <Divider style={styles.menuDivider} />
            <List.Item
              title="Settings"
              description="App preferences and notification settings"
              left={(props) => <List.Icon {...props} icon="cog" color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
              onPress={handleSettings}
              style={styles.menuItem}
              titleStyle={styles.menuTitle}
              descriptionStyle={styles.menuDescription}
            />
          </Surface>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1.5),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
      minHeight: 56,
    },
    headerTitle: {
      textAlign: 'center',
      fontWeight: '700',
      color: theme.colors.onSurface,
      fontSize: 20,
    },
    headerPlaceholder: {
      width: 48,
      height: 48,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: spacing(3),
      paddingTop: spacing(2),
    },
    profileCard: {
      padding: spacing(4),
      marginVertical: spacing(3),
      borderRadius: radii.xl,
      backgroundColor: theme.colors.surface,
      elevation: 4,
      shadowColor: theme.colors.onSurface,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing(4),
    },
    avatar: {
      backgroundColor: theme.colors.primary,
      marginRight: spacing(3),
    },
    avatarLabel: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
      fontSize: 32,
    },
    profileInfo: {
      flex: 1,
    },
    driverName: {
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing(0.5),
      fontSize: 24,
    },
    driverEmail: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(2),
      fontSize: 16,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(2),
    },
    ratingBadge: {
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(0.5),
      borderRadius: radii.md,
    },
    rating: {
      fontWeight: '600',
      color: theme.colors.onPrimaryContainer,
      fontSize: 14,
    },
    totalRides: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    editButton: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
      borderRadius: radii.lg,
    },
    editButtonContent: {
      paddingVertical: spacing(1),
    },
    editButtonLabel: {
      fontWeight: '600',
      fontSize: 16,
    },
    statsCard: {
      padding: spacing(4),
      marginBottom: spacing(3),
      borderRadius: radii.xl,
      backgroundColor: theme.colors.surface,
      elevation: 4,
      shadowColor: theme.colors.onSurface,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    sectionTitle: {
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing(3),
      textAlign: 'center',
      fontSize: 20,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValueContainer: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: radii.lg,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      marginBottom: spacing(1),
      minWidth: 80,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      height: 50,
      backgroundColor: theme.colors.outline,
      marginHorizontal: spacing(1),
    },
    statValue: {
      fontWeight: '700',
      color: theme.colors.onPrimaryContainer,
      fontSize: 20,
      textAlign: 'center',
    },
    statLabel: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    menuCard: {
      marginBottom: spacing(4),
      borderRadius: radii.xl,
      backgroundColor: theme.colors.surface,
      elevation: 4,
      shadowColor: theme.colors.onSurface,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      overflow: 'hidden',
    },
    menuItem: {
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(3),
      minHeight: 72, // Ensure comfortable touch target
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    menuDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    menuDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outline,
      marginLeft: spacing(4),
    },
  });

export default DriverProfileScreen;