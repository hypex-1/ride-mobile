import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  HelperText,
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../services/auth';
import { validateEmail } from '../../utils';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, isLoading } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
      // Navigation will happen automatically via AuthContext
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.branding}>
          <Text variant="headlineSmall" style={styles.brandTitle}>
            Welcome back 👋
          </Text>
          <Text variant="bodyMedium" style={styles.brandSubtitle}>
            Sign in to continue your journey
          </Text>
        </View>

        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.formTitle}>
              Sign in to RideShare
            </Text>

            {/* Email */}
            <TextInput
              label="Email"
              value={credentials.email}
              onChangeText={(text) => setCredentials({...credentials, email: text})}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!errors.email}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>

            {/* Password */}
            <TextInput
              label="Password"
              value={credentials.password}
              onChangeText={(text) => setCredentials({...credentials, password: text})}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              error={!!errors.password}
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            {/* Test Login Buttons */}
            <View style={styles.testSection}>
              <Text style={styles.testTitle}>Quick Test Login:</Text>
              <View style={styles.testButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setCredentials({email: 'rider@test.com', password: 'TestPass123!'})}
                  style={styles.testButton}
                  compact
                >
                  Test Rider
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setCredentials({email: 'driver@test.com', password: 'TestPass123!'})}
                  style={styles.testButton}
                  compact
                >
                  Test Driver
                </Button>
              </View>
            </View>

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>

            {/* Register Link */}
            <View style={styles.registerLink}>
              <Text variant="bodyMedium" style={styles.registerText}>
                Don't have an account?
              </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Register')}
                compact
                textColor={theme.colors.primary}
              >
                Sign Up
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    inner: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing(3),
    },
    branding: {
      marginBottom: spacing(3),
    },
    brandTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    brandSubtitle: {
      marginTop: spacing(0.5),
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
    formTitle: {
      marginBottom: spacing(2),
      textAlign: 'center',
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    input: {
      marginBottom: spacing(1),
    },
    testSection: {
      marginVertical: spacing(2),
      padding: spacing(2),
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    testTitle: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: spacing(1),
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
    },
    testButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    testButton: {
      flex: 1,
      borderRadius: radii.sm,
      marginHorizontal: spacing(0.5),
    },
    button: {
      marginTop: spacing(2),
      borderRadius: radii.md,
    },
    buttonContent: {
      height: 52,
    },
    registerLink: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing(2),
    },
    registerText: {
      color: theme.colors.onSurfaceVariant,
    },
  });

export default LoginScreen;