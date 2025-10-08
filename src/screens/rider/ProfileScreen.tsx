import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton, Avatar, Divider, List, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileScreenProps } from '../../types/navigation';
import { spacing, radii, useAppTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import { rideService } from '../../services';

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [phone, setPhone] = React.useState('+216 55 123 456');
  const [isEditing, setIsEditing] = React.useState(false);
  const [completedTrips, setCompletedTrips] = React.useState<number>(0);
  const [totalSpent, setTotalSpent] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadStatistics = async () => {
      try {
        const stats = await rideService.getRideStatistics();
        setCompletedTrips(stats.completedTrips);
        setTotalSpent(stats.totalSpent);
      } catch (error) {
        console.error('Failed to load ride statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  const handleSave = () => {
    // TODO: Implement profile update API call
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const navigateTo = (screenName: string) => {
    (navigation as any).navigate(screenName);
  };

  const profileInitials = React.useMemo(() => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  return (
    <View style={styles.container}>
  <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      {/* Content */}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            {user?.profilePicture ? (
              <Avatar.Image
                size={80}
                source={{ uri: user.profilePicture }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={80}
                label={profileInitials}
                style={styles.avatar}
                color={theme.colors.onPrimary}
              />
            )}
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>

          {/* Menu Options */}
          <View style={styles.menuContainer}>
            <List.Item
              title="Edit profile"
              description="Manage your account details"
              left={(props) => <List.Icon {...props} icon="account-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigateTo('EditProfile')}
            />
            <Divider />

            <List.Item
              title="Completed Trips"
              right={() => <Text style={styles.statValue}>{loading ? '...' : completedTrips}</Text>}
              left={(props) => <List.Icon {...props} icon="car" />}
            />
            <Divider />
            
            <List.Item
              title="Total Spent"
              right={() => <Text style={styles.statValue}>{loading ? '...' : `TND ${totalSpent.toFixed(3)}`}</Text>}
              left={(props) => <List.Icon {...props} icon="cash" />}
            />
            <Divider />
            
            <List.Item
              title="Ride History"
              left={(props) => <List.Icon {...props} icon="history" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigateTo('RideHistory')}
            />
            <Divider />
            
            <List.Item
              title="Payment Methods"
              left={(props) => <List.Icon {...props} icon="credit-card" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigateTo('PaymentMethods')}
            />
            <Divider />
            
            <List.Item
              title="Logout"
              titleStyle={{ color: theme.colors.error }}
              left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
              onPress={handleLogout}
            />
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

    scrollView: {
      flex: 1,
    },

    // Profile Header
    profileHeader: {
      alignItems: 'center',
      paddingVertical: spacing(4),
      backgroundColor: theme.colors.surface,
      marginBottom: spacing(2),
    },
    avatar: {
      backgroundColor: theme.colors.primary,
      marginBottom: spacing(2),
    },
    userName: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(0.5),
    },
    userEmail: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },

    // Menu Container
    menuContainer: {
      backgroundColor: theme.colors.surface,
    },

    // Stat Value
    statValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });

export default ProfileScreen;