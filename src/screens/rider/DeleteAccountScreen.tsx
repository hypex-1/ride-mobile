import React from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { spacing, useAppTheme } from '../../theme';
import type { AppTheme } from '../../theme';

interface DeleteAccountScreenProps {
  navigation: any;
}

const DeleteAccountScreen: React.FC<DeleteAccountScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [isLoading, setIsLoading] = React.useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await authService.deleteAccount();

      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Warning Section */}
          <View style={styles.warningSection}>
            <Text style={styles.warningTitle}>Delete Account</Text>
            <Text style={styles.warningText}>
              Deleting your account will permanently remove your profile, ride history, saved places, payment
              methods, and preferences. This action cannot be undone.
            </Text>
          </View>

          {/* Delete Button */}
          <View style={styles.buttonSection}>
            <Button
              mode="contained"
              onPress={handleDeleteAccount}
              loading={isLoading}
              disabled={isLoading}
              style={styles.deleteButton}
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
            >
              Delete My Account
            </Button>
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

    // Warning Section
    warningSection: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(3),
      backgroundColor: theme.colors.surface,
      marginBottom: spacing(2),
    },
    warningTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.error,
      marginBottom: spacing(2),
    },
    warningText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      lineHeight: 24,
    },

    // Button Section
    buttonSection: {
      paddingHorizontal: spacing(3),
      paddingBottom: spacing(4),
    },
    deleteButton: {
      paddingVertical: spacing(1),
    },
  });

export default DeleteAccountScreen;