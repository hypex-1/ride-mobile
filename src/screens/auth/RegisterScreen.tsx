import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  RadioButton,
  IconButton,
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterData } from '../../services/auth';
import { validateEmail } from '../../utils';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';

const { height } = Dimensions.get('window');

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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={theme.colors.onSurface}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleMedium" style={styles.headerTitle}>
          Create account
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text variant="headlineMedium" style={styles.title}>
          Create your account
        </Text>
        
        {/* Subtitle */}
        <Text variant="bodyLarge" style={styles.subtitle}>
          Let's get you started with your ride booking journey.
        </Text>

        {/* Role Selection */}
        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>I want to:</Text>
          <View style={styles.roleOptions}>
            <View style={styles.roleOption}>
              <RadioButton
                value="rider"
                status={formData.role === 'rider' ? 'checked' : 'unchecked'}
                onPress={() => setFormData({...formData, role: 'rider'})}
                color={theme.colors.primary}
              />
              <Text style={styles.roleText}>Book rides</Text>
            </View>
            <View style={styles.roleOption}>
              <RadioButton
                value="driver"
                status={formData.role === 'driver' ? 'checked' : 'unchecked'}
                onPress={() => setFormData({...formData, role: 'driver'})}
                color={theme.colors.primary}
              />
              <Text style={styles.roleText}>Drive and earn</Text>
            </View>
          </View>
        </View>

        {/* Form Inputs */}
        <View style={styles.inputContainer}>
          <TextInput
            label="First Name"
            value={formData.firstName}
            onChangeText={(text) => setFormData({...formData, firstName: text})}
            mode="outlined"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            error={!!errors.firstName}
          />
          {errors.firstName && (
            <Text style={styles.errorText}>{errors.firstName}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Last Name"
            value={formData.lastName}
            onChangeText={(text) => setFormData({...formData, lastName: text})}
            mode="outlined"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            error={!!errors.lastName}
          />
          {errors.lastName && (
            <Text style={styles.errorText}>{errors.lastName}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            error={!!errors.email}
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Phone Number"
            value={formData.phoneNumber}
            onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            error={!!errors.phoneNumber}
          />
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(text) => setFormData({...formData, password: text})}
            mode="outlined"
            secureTextEntry={!passwordVisible}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            error={!!errors.password}
            right={
              <TextInput.Icon 
                icon={passwordVisible ? "eye-off" : "eye"}
                onPress={() => setPasswordVisible(!passwordVisible)}
              />
            }
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={!confirmPasswordVisible}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            error={!!errors.confirmPassword}
            right={
              <TextInput.Icon 
                icon={confirmPasswordVisible ? "eye-off" : "eye"}
                onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              />
            }
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        {/* Create Account Button */}
        <Button
          mode="contained"
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          style={styles.continueButton}
          labelStyle={styles.continueButtonLabel}
          contentStyle={styles.continueButtonContent}
        >
          Create {formData.role === 'rider' ? 'Rider' : 'Driver'} Account
        </Button>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>
            Already have an account?{' '}
          </Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            compact
            labelStyle={styles.signInButton}
          >
            Sign in
          </Button>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    headerTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    headerSpacer: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(3),
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: '700',
      marginBottom: spacing(2),
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(4),
      lineHeight: 24,
    },
    roleContainer: {
      marginBottom: spacing(4),
      padding: spacing(3),
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    roleLabel: {
      fontWeight: '600',
      marginBottom: spacing(2),
      color: theme.colors.onSurface,
      fontSize: 16,
    },
    roleOptions: {
      gap: spacing(1),
    },
    roleOption: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    roleText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      marginLeft: spacing(1),
    },
    inputContainer: {
      marginBottom: spacing(3),
    },
    input: {
      backgroundColor: theme.colors.surface,
    },
    inputOutline: {
      borderWidth: 1,
      borderRadius: radii.md,
    },
    inputContent: {
      paddingVertical: spacing(2),
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: spacing(0.5),
      marginLeft: spacing(2),
    },
    continueButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: radii.md,
      marginTop: spacing(2),
      marginBottom: spacing(3),
    },
    continueButtonLabel: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    continueButtonContent: {
      height: 56,
    },
    signInContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing(4),
    },
    signInText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    signInButton: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default RegisterScreen;