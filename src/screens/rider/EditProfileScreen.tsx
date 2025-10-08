import React from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Button, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { spacing, useAppTheme } from '../../theme';
import type { AppTheme } from '../../theme';

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [phone, setPhone] = React.useState(user?.phoneNumber || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [profilePicture, setProfilePicture] = React.useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);

  const profileInitials = React.useMemo(() => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [name]);

  React.useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhone(user?.phoneNumber || '');
    setProfilePicture(null);
  }, [user]);

  const handleChoosePhoto = React.useCallback(async () => {
    if (isLoading) return;

    Alert.alert(
      'Select Photo',
      'Choose how you want to add your profile picture',
      [
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              
              if (!permission.granted) {
                Alert.alert(
                  'Permission required',
                  'We need access to your camera to take a profile picture.'
                );
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setProfilePicture({
                  uri: asset.uri,
                  name: asset.fileName ?? asset.uri.split('/').pop() ?? 'profile.jpg',
                  type: asset.mimeType ?? 'image/jpeg',
                });
              }
            } catch (error) {
              console.error('Camera error:', error);
              const message = error instanceof Error ? error.message : 'Could not launch camera. Please try again.';
              Alert.alert('Error', message);
            }
          }
        },
        {
          text: 'Photo Library',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

              if (!permission.granted) {
                Alert.alert(
                  'Permission required',
                  'We need access to your photo library to let you pick a profile picture.'
                );
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setProfilePicture({
                  uri: asset.uri,
                  name: asset.fileName ?? asset.uri.split('/').pop() ?? 'profile.jpg',
                  type: asset.mimeType ?? 'image/jpeg',
                });
              }
            } catch (error) {
              console.error('Image picker error:', error);
              const message = error instanceof Error ? error.message : 'Could not launch photo library. Please try again.';
              Alert.alert('Error', message);
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }, [isLoading]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setIsLoading(true);
    try {
      await authService.updateProfile({
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phone.trim() || undefined,
        profilePictureUri: profilePicture?.uri ?? null,
        profilePictureName: profilePicture?.name ?? null,
        profilePictureMimeType: profilePicture?.type ?? null,
      });

      await refreshUser();
      setProfilePicture(null);

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
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
          {/* Profile Picture */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handleChoosePhoto}
              disabled={isLoading}
              style={styles.avatarTouchable}
              activeOpacity={0.7}
            >
              {profilePicture?.uri || user?.profilePicture ? (
                <Avatar.Image
                  size={100}
                  source={{ uri: profilePicture?.uri || user?.profilePicture || undefined }}
                  style={styles.avatarImage}
                />
              ) : (
                <Avatar.Text
                  size={100}
                  label={profileInitials}
                  style={styles.avatar}
                  color={theme.colors.onPrimary}
                />
              )}
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>
              {profilePicture ? 'Ready to upload new photo' : 'Tap to change photo'}
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                mode="outlined"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                style={styles.input}
                disabled={isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                mode="outlined"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                disabled={isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                mode="outlined"
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                style={styles.input}
                disabled={isLoading}
              />
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.buttonSection}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isLoading}
              disabled={isLoading}
              style={styles.saveButton}
            >
              Save Changes
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

    // Avatar Section
    avatarSection: {
      alignItems: 'center',
      paddingVertical: spacing(4),
      backgroundColor: theme.colors.surface,
      marginBottom: spacing(2),
    },
    avatarTouchable: {
      borderRadius: 60,
      overflow: 'hidden',
    },
    avatar: {
      backgroundColor: theme.colors.primary,
      marginBottom: spacing(2),
    },
    avatarImage: {
      backgroundColor: theme.colors.surfaceVariant ?? theme.colors.surface,
      marginBottom: spacing(2),
    },
    changePhotoText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },

    // Form Section
    formSection: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
    },
    inputGroup: {
      marginBottom: spacing(3),
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: spacing(1),
    },
    input: {
      backgroundColor: theme.colors.surface,
    },

    // Button Section
    buttonSection: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
    },
    saveButton: {
      paddingVertical: spacing(1),
    },
  });

export default EditProfileScreen;