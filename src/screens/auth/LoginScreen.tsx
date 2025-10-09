import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextInput,
  Button,
  Text,
  IconButton,
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../services/auth';
import { validateEmail } from '../../utils';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';
import type { LoginScreenProps } from '../../types/navigation';

const { height } = Dimensions.get('window');

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, isLoading } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [passwordVisible, setPasswordVisible] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!credentials.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(credentials.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!credentials.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login(credentials);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={theme.colors.onSurface}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleMedium" style={styles.headerTitle}>
          Sign In
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text variant="headlineMedium" style={styles.title}>
          Welcome back
        </Text>
        
        {/* Subtitle */}
        <Text variant="bodyLarge" style={styles.subtitle}>
          Sign in to your account to continue.
        </Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            label="Email"
            value={credentials.email}
            onChangeText={(text) => setCredentials({...credentials, email: text})}
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

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            label="Password"
            value={credentials.password}
            onChangeText={(text) => setCredentials({...credentials, password: text})}
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

        {/* Test Login Buttons - Bolt Style */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Quick Test Login:</Text>
          <View style={styles.testButtons}>
            <Button
              mode="outlined"
              onPress={() => setCredentials({email: 'rider@test.com', password: 'TestPass123!'})}
              style={styles.testButton}
              labelStyle={styles.testButtonLabel}
              compact
            >
              Test Rider
            </Button>
            <Button
              mode="outlined"
              onPress={() => setCredentials({email: 'driver@test.com', password: 'TestPass123!'})}
              style={styles.testButton}
              labelStyle={styles.testButtonLabel}
              compact
            >
              Test Driver
            </Button>
          </View>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Continue Button */}
        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading || !credentials.email || !credentials.password}
          style={styles.continueButton}
          contentStyle={styles.continueButtonContent}
          buttonColor={(!credentials.email || !credentials.password) ? theme.colors.surfaceVariant : theme.colors.primary}
          textColor={(!credentials.email || !credentials.password) ? theme.colors.onSurfaceVariant : theme.colors.onPrimary}
          labelStyle={styles.continueButtonLabel}
        >
          Continue
        </Button>

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>
            Don't have an account?{' '}
          </Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            compact
            labelStyle={styles.signUpButton}
          >
            Sign up
          </Button>
        </View>
      </View>
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
    content: {
      flex: 1,
      paddingHorizontal: spacing(3),
      paddingTop: spacing(4),
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
    testSection: {
      marginVertical: spacing(3),
      padding: spacing(2),
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    testTitle: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: spacing(1.5),
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
    },
    testButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing(2),
    },
    testButton: {
      flex: 1,
      borderRadius: radii.sm,
      borderColor: theme.colors.outline,
    },
    testButtonLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    bottomSection: {
      paddingHorizontal: spacing(3),
      paddingBottom: spacing(4),
    },
    continueButton: {
      borderRadius: radii.md,
      marginBottom: spacing(3),
    },
    continueButtonLabel: {
      fontSize: 16,
      fontWeight: '600',
    },
    continueButtonContent: {
      height: 56,
    },
    signUpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signUpText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    signUpButton: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default LoginScreen;