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
  Title,
  Paragraph,
  HelperText,
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../services/auth';
import { validateEmail } from '../../utils';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, isLoading } = useAuth();

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
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Welcome Back</Title>
            <Paragraph style={styles.subtitle}>
              Sign in to your RideShare account
            </Paragraph>

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
            >
              Sign In
            </Button>

            {/* Register Link */}
            <View style={styles.registerLink}>
              <Text>Don't have an account? </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Register')}
                compact
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  testSection: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  testTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#666',
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  testButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default LoginScreen;