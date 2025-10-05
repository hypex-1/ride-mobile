import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Text,
  Chip,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null; // This shouldn't happen, but just in case
  }

  const isDriver = user.role === 'driver';

  return (
    <View style={styles.container}>
      {/* User Profile Card */}
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Text
              size={80}
              label={`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}
            />
            <View style={styles.profileInfo}>
              <Title>{user.firstName} {user.lastName}</Title>
              <Paragraph>{user.email}</Paragraph>
              <Paragraph>{user.phoneNumber}</Paragraph>
              <Chip 
                mode="outlined" 
                style={[styles.roleChip, isDriver ? styles.driverChip : styles.riderChip]}
              >
                {isDriver ? '🚗 Driver' : '👤 Rider'}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Role-specific Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title>{isDriver ? 'Driver Dashboard' : 'Rider Dashboard'}</Title>
          
          {isDriver ? (
            <>
              <Paragraph>Ready to start driving?</Paragraph>
              <Button
                mode="contained"
                style={styles.actionButton}
                onPress={() => {/* TODO: Navigate to driver mode */}}
              >
                🚗 Go Online
              </Button>
              <Button
                mode="outlined"
                style={styles.actionButton}
                onPress={() => {/* TODO: Navigate to earnings */}}
              >
                💰 View Earnings
              </Button>
            </>
          ) : (
            <>
              <Paragraph>Where would you like to go?</Paragraph>
              <Button
                mode="contained"
                style={styles.actionButton}
                onPress={() => {/* TODO: Navigate to ride request */}}
              >
                🚕 Request Ride
              </Button>
              <Button
                mode="outlined"
                style={styles.actionButton}
                onPress={() => {/* TODO: Navigate to ride history */}}
              >
                📋 Ride History
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Account Status */}
      <Card style={styles.statusCard}>
        <Card.Content>
          <Title>Account Status</Title>
          <View style={styles.statusRow}>
            <Text>Email Verified: </Text>
            <Chip 
              mode="outlined"
              textStyle={user.isVerified ? styles.verifiedText : styles.unverifiedText}
            >
              {user.isVerified ? '✅ Verified' : '❌ Not Verified'}
            </Chip>
          </View>
          
          {!user.isVerified && (
            <Button
              mode="text"
              style={styles.verifyButton}
              onPress={() => {/* TODO: Navigate to email verification */}}
            >
              Verify Email
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        Sign Out
      </Button>

      {/* Debug Info (Development only) */}
      {__DEV__ && (
        <Card style={styles.debugCard}>
          <Card.Content>
            <Title>Debug Info</Title>
            <Text>User ID: {user.id}</Text>
            <Text>Role: {user.role}</Text>
            <Text>Created: {new Date(user.createdAt).toLocaleDateString()}</Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  roleChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  driverChip: {
    backgroundColor: '#e3f2fd',
  },
  riderChip: {
    backgroundColor: '#f3e5f5',
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 12,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  verifiedText: {
    color: '#4caf50',
  },
  unverifiedText: {
    color: '#f44336',
  },
  verifyButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  logoutButton: {
    marginBottom: 16,
  },
  debugCard: {
    backgroundColor: '#fff3e0',
  },
});

export default DashboardScreen;