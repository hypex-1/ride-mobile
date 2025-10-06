import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  RadioButton,
  HelperText,
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterData } from '../../services/auth';
import { validateEmail } from '../../utils';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register, isLoading } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [formData, setFormData] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'rider',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      Alert.alert(
        'Success!',
        `${formData.role === 'rider' ? 'Rider' : 'Driver'} account created successfully!`,
        [
          {
            text: 'OK',
            // Navigation will happen automatically when user state changes
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.branding}>
          <Text variant="headlineSmall" style={styles.brandTitle}>
            Create your account
          </Text>
          <Text variant="bodyMedium" style={styles.brandSubtitle}>
            Join RideShare as a {formData.role}
          </Text>
        </View>

        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.cardContent}>

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <Text variant="bodyMedium" style={styles.roleLabel}>I want to:</Text>
              <RadioButton.Group
                onValueChange={(value) => setFormData({...formData, role: value as 'rider' | 'driver'})}
                value={formData.role}
              >
                <View style={styles.radioItem}>
                  <RadioButton value="rider" />
                  <Text variant="bodyMedium">Request rides (Rider)</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="driver" />
                  <Text variant="bodyMedium">Provide rides (Driver)</Text>
                </View>
              </RadioButton.Group>
            </View>

            {/* First Name */}
            <TextInput
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => setFormData({...formData, firstName: text})}
              mode="outlined"
              style={styles.input}
              error={!!errors.firstName}
            />
            <HelperText type="error" visible={!!errors.firstName}>
              {errors.firstName}
            </HelperText>

            {/* Last Name */}
            <TextInput
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => setFormData({...formData, lastName: text})}
              mode="outlined"
              style={styles.input}
              error={!!errors.lastName}
            />
            <HelperText type="error" visible={!!errors.lastName}>
              {errors.lastName}
            </HelperText>

            {/* Email */}
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!errors.email}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>

            {/* Phone */}
            <TextInput
              label="Phone Number"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              error={!!errors.phoneNumber}
            />
            <HelperText type="error" visible={!!errors.phoneNumber}>
              {errors.phoneNumber}
            </HelperText>

            {/* Password */}
            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              error={!!errors.password}
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            {/* Confirm Password */}
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              error={!!errors.confirmPassword}
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>

            {/* Register Button */}
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Create {formData.role === 'rider' ? 'Rider' : 'Driver'} Account
            </Button>

            {/* Login Link */}
            <View style={styles.loginLink}>
              <Text variant="bodyMedium" style={styles.loginText}>Already have an account?</Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                compact
                textColor={theme.colors.primary}
              >
                Sign In
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing(3),
    },
    branding: {
      marginBottom: spacing(2),
    },
    brandTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: spacing(0.5),
    },
    brandSubtitle: {
      color: theme.colors.onSurfaceVariant,
    },
    card: {
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      overflow: 'hidden',
    },
    cardContent: {
      paddingVertical: spacing(2),
    },
    roleContainer: {
      marginBottom: spacing(2.5),
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      padding: spacing(2),
    },
    roleLabel: {
      fontWeight: '600',
      marginBottom: spacing(1),
      color: theme.colors.onSurface,
    },
    radioItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing(1),
    },
    input: {
      marginBottom: spacing(1),
    },
    button: {
      marginTop: spacing(2),
      borderRadius: radii.md,
    },
    buttonContent: {
      height: 52,
    },
    loginLink: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing(3),
    },
    loginText: {
      marginRight: spacing(1),
      color: theme.colors.onSurfaceVariant,
    },
  });

export default RegisterScreen;