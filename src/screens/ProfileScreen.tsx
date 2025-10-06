import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import {
  Surface,
  Text,
  Button,
  TextInput,
  Avatar,
  Card
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { ProfileScreenProps } from '../types/navigation';
import { useAppTheme, spacing, radii } from '../theme';
import type { AppTheme } from '../theme';

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [phone, setPhone] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);

  const handleSave = () => {
    // TODO: Implement profile update API call
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Surface elevation={0} style={styles.header}>
          <View style={styles.avatarSection}>
            <Avatar.Text
              size={100}
              label={user?.name
                ?.split(' ')
                .map(part => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'U'}
              style={styles.avatar}
            />
            <Button
              mode="text"
              onPress={() => {/* TODO: change photo */}}
              style={styles.changePhotoButton}
            >
              Change Photo
            </Button>
          </View>
        </Surface>

        {/* Profile Form */}
        <View style={styles.formSection}>
          <Card style={styles.formCard} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.formTitle}>
                Personal Information
              </Text>

              <View style={styles.fieldGroup}>
                <Text variant="labelMedium" style={styles.fieldLabel}>
                  Full Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  style={styles.textInput}
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text variant="labelMedium" style={styles.fieldLabel}>
                  Email Address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  style={styles.textInput}
                  disabled={!isEditing}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text variant="labelMedium" style={styles.fieldLabel}>
                  Phone Number
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  mode="outlined"
                  style={styles.textInput}
                  disabled={!isEditing}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text variant="labelMedium" style={styles.fieldLabel}>
                  Account Type
                </Text>
                <Surface elevation={0} style={styles.roleChip}>
                  <Text variant="bodyMedium" style={styles.roleText}>
                    {user?.role === 'RIDER' ? 'Rider Account' : 'Driver Account'}
                  </Text>
                </Surface>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonSection}>
                {isEditing ? (
                  <View style={styles.editingButtons}>
                    <Button
                      mode="outlined"
                      onPress={handleCancel}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSave}
                      style={styles.saveButton}
                    >
                      Save Changes
                    </Button>
                  </View>
                ) : (
                  <Button
                    mode="contained"
                    onPress={() => setIsEditing(true)}
                    style={styles.editButton}
                    icon="pencil"
                  >
                    Edit Profile
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Account Stats */}
        <View style={styles.statsSection}>
          <Text variant="titleMedium" style={styles.statsTitle}>
            Account Statistics
          </Text>
          
          <View style={styles.statsGrid}>
            <Surface elevation={1} style={styles.statCard}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                12
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Total Rides
              </Text>
            </Surface>
            
            <Surface elevation={1} style={styles.statCard}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                4.8
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Average Rating
              </Text>
            </Surface>
          </View>

          <Surface elevation={1} style={styles.statCard}>
            <Text variant="headlineMedium" style={styles.statNumber}>
              TND 156.50
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Total Spent
            </Text>
          </Surface>
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
    header: {
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      paddingVertical: spacing(3),
      marginBottom: spacing(2),
    },
    avatarSection: {
      alignItems: 'center',
    },
    avatar: {
      backgroundColor: theme.colors.primaryContainer,
      marginBottom: spacing(1),
    },
    changePhotoButton: {
      marginTop: spacing(0.5),
    },
    formSection: {
      paddingHorizontal: spacing(2),
      marginBottom: spacing(2),
    },
    formCard: {
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
    },
    cardContent: {
      padding: spacing(2.5),
    },
    formTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: spacing(2),
    },
    fieldGroup: {
      marginBottom: spacing(2),
    },
    fieldLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(0.75),
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    textInput: {
      backgroundColor: theme.colors.surface,
    },
    roleChip: {
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(1),
      borderRadius: radii.md,
      alignSelf: 'flex-start',
    },
    roleText: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '600',
    },
    buttonSection: {
      marginTop: spacing(2),
    },
    editingButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cancelButton: {
      flex: 1,
      marginRight: spacing(1),
      borderRadius: radii.lg,
    },
    saveButton: {
      flex: 1,
      marginLeft: spacing(1),
      borderRadius: radii.lg,
    },
    editButton: {
      borderRadius: radii.lg,
    },
    statsSection: {
      paddingHorizontal: spacing(2),
      marginBottom: spacing(3),
    },
    statsTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: spacing(1.5),
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing(1.5),
    },
    statCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: radii.lg,
      padding: spacing(2),
      alignItems: 'center',
      minWidth: '30%',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
    },
    statNumber: {
      color: theme.colors.primary,
      fontWeight: '700',
      marginBottom: spacing(0.5),
    },
    statLabel: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });

export default ProfileScreen;