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
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={theme.colors.onSurface}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Driver Profile
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <Surface style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Avatar.Text
                size={80}
                label={user?.name?.charAt(0) || 'D'}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.driverName}>
                  {user?.name || 'Driver Name'}
                </Text>
                <Text variant="bodyMedium" style={styles.driverEmail}>
                  {user?.email || 'driver@example.com'}
                </Text>
                <View style={styles.ratingContainer}>
                  <Text variant="bodyMedium" style={styles.rating}>
                    ⭐ {stats?.rating?.toFixed(1) || '5.0'}
                  </Text>
                  <Text variant="bodySmall" style={styles.totalRides}>
                    {stats?.totalRides || 0} rides
                  </Text>
                </View>
              </View>
            </View>
            
            <Button
              mode="outlined"
              onPress={handleEditProfile}
              style={styles.editButton}
              contentStyle={styles.editButtonContent}
            >
              Edit Profile
            </Button>
          </Surface>

          {/* Quick Stats */}
          <Surface style={styles.statsCard}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Today's Performance</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {stats?.ridesCompleted || 0}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Rides</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statValue}>
                  ${stats?.earnings?.toFixed(2) || '0.00'}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Earnings</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {Math.floor((stats?.onlineTime || 0) / 60)}h {(stats?.onlineTime || 0) % 60}m
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Online</Text>
              </View>
            </View>
          </Surface>

          {/* Menu Options */}
          <Surface style={styles.menuCard}>
            <List.Item
              title="Earnings"
              description="View earnings history and reports"
              left={(props) => <List.Icon {...props} icon="currency-usd" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleViewEarnings}
              style={styles.menuItem}
            />
            <Divider />
            <List.Item
              title="Ride History"
              description="View past rides and details"
              left={(props) => <List.Icon {...props} icon="history" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleRideHistory}
              style={styles.menuItem}
            />
            <Divider />
            <List.Item
              title="Documents"
              description="Manage license, insurance, vehicle docs"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleViewDocuments}
              style={styles.menuItem}
            />
            <Divider />
            <List.Item
              title="Settings"
              description="App preferences and notifications"
              left={(props) => <List.Icon {...props} icon="cog" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleSettings}
              style={styles.menuItem}
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
      paddingHorizontal: spacing(3),
    },
    profileCard: {
      padding: spacing(3),
      marginVertical: spacing(2),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing(3),
    },
    avatar: {
      backgroundColor: theme.colors.primary,
      marginRight: spacing(3),
    },
    profileInfo: {
      flex: 1,
    },
    driverName: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(0.5),
    },
    driverEmail: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(1),
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rating: {
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginRight: spacing(2),
    },
    totalRides: {
      color: theme.colors.onSurfaceVariant,
    },
    editButton: {
      borderColor: theme.colors.outline,
    },
    editButtonContent: {
      paddingVertical: spacing(0.5),
    },
    statsCard: {
      padding: spacing(3),
      marginBottom: spacing(2),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    sectionTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(2),
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: spacing(0.5),
    },
    statLabel: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    menuCard: {
      marginBottom: spacing(3),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 2,
      overflow: 'hidden',
    },
    menuItem: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
    },
  });

export default DriverProfileScreen;