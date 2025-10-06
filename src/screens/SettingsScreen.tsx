import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import {
  Surface,
  Text,
  Button,
  IconButton,
  TouchableRipple,
  Switch
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { SettingsScreenProps } from '../types/navigation';
import { useAppTheme, spacing, radii } from '../theme';

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

  const menuItems = [
    { id: 'profile', title: 'Profile', icon: 'account-outline', route: 'Profile' as const },
    { id: 'payment', title: 'Payment methods', icon: 'credit-card-outline', route: 'PaymentMethods' as const },
    { id: 'history', title: 'Trip history', icon: 'history', route: 'RideHistory' as const },
    { id: 'saved', title: 'Saved places', icon: 'heart-outline', route: 'SavedPlaces' as const },
    { id: 'support', title: 'Support', icon: 'help-circle-outline', route: 'Support' as const },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            iconColor="#000000"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Surface style={styles.profileCard} elevation={0}>
          <TouchableRipple
            onPress={() => navigation.navigate('Profile')}
            style={styles.profileTouchable}
          >
            <View style={styles.profileContent}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <Text style={styles.profileRole}>
                  {user?.role === 'RIDER' ? 'Rider account' : 'Driver account'}
                </Text>
              </View>
              <View style={styles.chevronContainer}>
                <Text style={styles.chevron}>›</Text>
              </View>
            </View>
          </TouchableRipple>
        </Surface>

        {/* Menu Items */}
        <Surface style={styles.menuCard} elevation={0}>
          {menuItems.map((item, index) => (
            <TouchableRipple
              key={item.id}
              onPress={() => navigation.navigate(item.route)}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder
              ]}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Text style={styles.menuIcon}>
                      {item.icon === 'account-outline' ? '👤' :
                       item.icon === 'credit-card-outline' ? '💳' :
                       item.icon === 'history' ? '🕐' :
                       item.icon === 'heart-outline' ? '❤️' :
                       item.icon === 'help-circle-outline' ? '❓' : ''}
                    </Text>
                  </View>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                </View>
                <View style={styles.chevronContainer}>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </View>
            </TouchableRipple>
          ))}
        </Surface>

        {/* Settings */}
        <Surface style={styles.settingsCard} elevation={0}>
          <View style={styles.settingsItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>🔔</Text>
              </View>
              <Text style={styles.menuItemTitle}>Push notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              color="#34D186"
            />
          </View>
          
          <View style={[styles.settingsItem, styles.menuItemBorder]}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>📍</Text>
              </View>
              <Text style={styles.menuItemTitle}>Location sharing</Text>
            </View>
            <Switch
              value={locationSharing}
              onValueChange={setLocationSharing}
              color="#34D186"
            />
          </View>
        </Surface>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor="#FF4444"
          >
            Sign out
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8F9FA',
    },

    // Header - Bolt Style
    header: {
      backgroundColor: '#FFFFFF',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E7EB',
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1.5),
    },
    backButton: {
      margin: 0,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      textAlign: 'center',
    },
    headerSpacer: {
      width: 48, // Balance the back button
    },

    // Scroll View
    scrollView: {
      flex: 1,
    },

    // Profile Card
    profileCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: spacing(3),
      marginTop: spacing(2),
      marginBottom: spacing(2),
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: '#E5E7EB',
    },
    profileTouchable: {
      borderRadius: radii.lg,
    },
    profileContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing(3),
    },
    profileAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#34D186',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing(2),
    },
    profileAvatarText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      marginBottom: spacing(0.5),
    },
    profileEmail: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: spacing(0.5),
    },
    profileRole: {
      fontSize: 13,
      color: '#34D186',
      fontWeight: '500',
    },
    chevronContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 24,
      height: 24,
    },
    chevron: {
      fontSize: 18,
      color: '#9CA3AF',
      fontWeight: '300',
    },

    // Menu Card
    menuCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: spacing(3),
      marginBottom: spacing(2),
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: '#E5E7EB',
    },
    menuItem: {
      borderRadius: radii.lg,
    },
    menuItemBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E7EB',
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing(3),
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuIconContainer: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing(2),
    },
    menuIcon: {
      fontSize: 18,
    },
    menuItemTitle: {
      fontSize: 16,
      color: '#111827',
      fontWeight: '400',
    },

    // Settings Card
    settingsCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: spacing(3),
      marginBottom: spacing(2),
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: '#E5E7EB',
    },
    settingsItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing(3),
    },

    // Logout Section
    logoutSection: {
      paddingHorizontal: spacing(3),
      paddingBottom: spacing(4),
      paddingTop: spacing(2),
    },
    logoutButton: {
      borderColor: '#FF4444',
      borderRadius: radii.md,
    },
  });

export default SettingsScreen;