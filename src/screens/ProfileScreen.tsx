import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { ProfileScreenProps } from '../types/navigation';
import { spacing, radii } from '../theme';

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [phone, setPhone] = React.useState('+216 55 123 456');
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
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name
                ?.split(' ')
                .map(part => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'U'}
            </Text>
          </View>
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Form */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, isEditing && styles.inputEditing]}
                value={name}
                onChangeText={setName}
                editable={isEditing}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, isEditing && styles.inputEditing]}
                value={email}
                onChangeText={setEmail}
                editable={isEditing}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, isEditing && styles.inputEditing]}
                value={phone}
                onChangeText={setPhone}
                editable={isEditing}
                placeholder="Enter your phone"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            {isEditing ? (
              <View style={styles.editingButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Your Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>23</Text>
              <Text style={styles.statLabel}>Completed Trips</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>4.8</Text>
              <Text style={styles.statLabel}>Average Rating</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>TND 156.50</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
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
    width: 48,
  },

  // Content
  scrollView: {
    flex: 1,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing(3),
    backgroundColor: '#FFFFFF',
    marginBottom: spacing(2),
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#34D186',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(1.5),
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  changePhotoButton: {
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2),
  },
  changePhotoText: {
    fontSize: 16,
    color: '#34D186',
    fontWeight: '500',
  },

  // Form Section
  formSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing(3),
    marginBottom: spacing(2),
    borderRadius: radii.lg,
    padding: spacing(3),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  inputGroup: {
    marginBottom: spacing(2.5),
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: spacing(1),
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radii.md,
    backgroundColor: '#F9FAFB',
  },
  input: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    fontSize: 16,
    color: '#111827',
  },
  inputEditing: {
    backgroundColor: '#FFFFFF',
    borderColor: '#34D186',
  },

  // Buttons
  buttonSection: {
    marginTop: spacing(1),
  },
  editingButtons: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  editButton: {
    backgroundColor: '#34D186',
    paddingVertical: spacing(1.5),
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: spacing(1.5),
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#34D186',
    paddingVertical: spacing(1.5),
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Stats Section
  statsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing(3),
    marginBottom: spacing(3),
    borderRadius: radii.lg,
    padding: spacing(3),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing(2),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing(2),
  },
  statCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radii.md,
    padding: spacing(2.5),
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing(0.5),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing(0.5),
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ProfileScreen;