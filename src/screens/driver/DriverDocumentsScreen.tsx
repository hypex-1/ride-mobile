import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Surface,
  Card,
  Text,
  IconButton,
  List,
  Divider,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';
import type { DriverDocumentsScreenProps } from '../../types/navigation';

interface Document {
  id: string;
  type: 'license' | 'insurance' | 'registration' | 'inspection';
  name: string;
  description: string;
  status: 'verified' | 'pending' | 'expired' | 'missing';
  expiryDate?: string;
  uploadedAt?: string;
}

const DriverDocumentsScreen: React.FC<DriverDocumentsScreenProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call when available
      // const docs = await driverService.getDocuments();
      
      // Mock data for now
      const mockDocuments: Document[] = [
        {
          id: '1',
          type: 'license',
          name: 'Driver\'s License',
          description: 'Valid driver\'s license with clean record',
          status: 'verified',
          expiryDate: '2025-12-31',
          uploadedAt: '2024-01-15',
        },
        {
          id: '2',
          type: 'insurance',
          name: 'Vehicle Insurance',
          description: 'Commercial vehicle insurance policy',
          status: 'verified',
          expiryDate: '2024-12-31',
          uploadedAt: '2024-01-15',
        },
        {
          id: '3',
          type: 'registration',
          name: 'Vehicle Registration',
          description: 'Current vehicle registration document',
          status: 'pending',
          expiryDate: '2025-06-30',
          uploadedAt: '2024-10-01',
        },
        {
          id: '4',
          type: 'inspection',
          name: 'Safety Inspection',
          description: 'Annual vehicle safety inspection',
          status: 'expired',
          expiryDate: '2024-09-30',
        },
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = (docType: string) => {
    Alert.alert(
      'Upload Document',
      `Would you like to upload/update your ${docType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Upload', 
          onPress: () => {
            // TODO: Implement document upload
            Alert.alert('Coming Soon', 'Document upload feature will be available soon.');
          }
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return theme.colors.primary;
      case 'pending':
        return '#FF9800';
      case 'expired':
        return theme.colors.error;
      case 'missing':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return 'check-circle';
      case 'pending':
        return 'clock';
      case 'expired':
        return 'alert-circle';
      case 'missing':
        return 'upload';
      default:
        return 'file-document';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'license':
        return 'card-account-details';
      case 'insurance':
        return 'shield-check';
      case 'registration':
        return 'file-document';
      case 'inspection':
        return 'car-wrench';
      default:
        return 'file-document';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const verifiedCount = documents.filter(doc => doc.status === 'verified').length;
  const pendingCount = documents.filter(doc => doc.status === 'pending').length;
  const expiredCount = documents.filter(doc => doc.status === 'expired').length;
  const expiringCount = documents.filter(doc => isExpiringSoon(doc.expiryDate)).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Documents
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Status Summary */}
          <Surface style={styles.summaryCard}>
            <Text variant="titleMedium" style={styles.cardTitle}>Document Status</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text variant="headlineSmall" style={[styles.summaryValue, { color: theme.colors.primary }]}>
                  {verifiedCount}
                </Text>
                <Text variant="bodySmall" style={styles.summaryLabel}>Verified</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="headlineSmall" style={[styles.summaryValue, { color: '#FF9800' }]}>
                  {pendingCount}
                </Text>
                <Text variant="bodySmall" style={styles.summaryLabel}>Pending</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="headlineSmall" style={[styles.summaryValue, { color: theme.colors.error }]}>
                  {expiredCount}
                </Text>
                <Text variant="bodySmall" style={styles.summaryLabel}>Expired</Text>
              </View>
            </View>
            
            {expiringCount > 0 && (
              <View style={styles.warningBanner}>
                <Text variant="bodySmall" style={styles.warningText}>
                   {expiringCount} document{expiringCount > 1 ? 's' : ''} expiring within 30 days
                </Text>
              </View>
            )}
          </Surface>

          {/* Documents List */}
          <Surface style={styles.documentsCard}>
            <Text variant="titleMedium" style={styles.cardTitle}>Required Documents</Text>
            
            {documents.map((document, index) => (
              <View key={document.id}>
                <List.Item
                  title={document.name}
                  description={document.description}
                  left={(props) => (
                    <List.Icon 
                      {...props} 
                      icon={getDocumentIcon(document.type)}
                      color={getStatusColor(document.status)}
                    />
                  )}
                  right={() => (
                    <View style={styles.documentRight}>
                      <Chip
                        mode="outlined"
                        icon={getStatusIcon(document.status)}
                        style={[styles.statusChip, { borderColor: getStatusColor(document.status) }]}
                        textStyle={[styles.statusText, { color: getStatusColor(document.status) }]}
                      >
                        {document.status}
                      </Chip>
                      <IconButton
                        icon="upload"
                        size={20}
                        onPress={() => handleUploadDocument(document.name)}
                      />
                    </View>
                  )}
                  style={styles.documentItem}
                />
                
                {/* Document Details */}
                <View style={styles.documentDetails}>
                  <View style={styles.detailRow}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Expires:</Text>
                    <Text variant="bodySmall" style={[
                      styles.detailValue,
                      isExpiringSoon(document.expiryDate) && { color: theme.colors.error }
                    ]}>
                      {formatDate(document.expiryDate)}
                    </Text>
                  </View>
                  {document.uploadedAt && (
                    <View style={styles.detailRow}>
                      <Text variant="bodySmall" style={styles.detailLabel}>Uploaded:</Text>
                      <Text variant="bodySmall" style={styles.detailValue}>
                        {formatDate(document.uploadedAt)}
                      </Text>
                    </View>
                  )}
                </View>
                
                {index < documents.length - 1 && <Divider />}
              </View>
            ))}
          </Surface>

          {/* Help Section */}
          <Surface style={styles.helpCard}>
            <Text variant="titleMedium" style={styles.cardTitle}>Need Help?</Text>
            
            <List.Item
              title="Document Requirements"
              description="Learn what documents are required"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              onPress={() => Alert.alert('Coming Soon', 'Help documentation will be available soon.')}
              style={styles.helpItem}
            />
            <Divider />
            <List.Item
              title="Upload Guide"
              description="Step-by-step upload instructions"
              left={(props) => <List.Icon {...props} icon="book-open" />}
              onPress={() => Alert.alert('Coming Soon', 'Upload guide will be available soon.')}
              style={styles.helpItem}
            />
            <Divider />
            <List.Item
              title="Contact Support"
              description="Get help with document issues"
              left={(props) => <List.Icon {...props} icon="headphones" />}
              onPress={() => Alert.alert('Coming Soon', 'Support contact will be available soon.')}
              style={styles.helpItem}
            />
          </Surface>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1.5),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
      minHeight: 56,
    },
    headerTitle: {
      textAlign: 'center',
      fontWeight: '700',
      color: theme.colors.onSurface,
      fontSize: 20,
    },
    headerPlaceholder: {
      width: 48,
      height: 48,
    },
    scrollView: {
      flex: 1,
    },
    summaryCard: {
      margin: spacing(3),
      padding: spacing(3),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    cardTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(2),
    },
    summaryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: spacing(2),
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryValue: {
      fontWeight: '700',
      marginBottom: spacing(0.5),
    },
    summaryLabel: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    warningBanner: {
      backgroundColor: theme.colors.errorContainer,
      padding: spacing(2),
      borderRadius: radii.md,
      marginTop: spacing(1),
    },
    warningText: {
      color: theme.colors.onErrorContainer,
      textAlign: 'center',
    },
    documentsCard: {
      margin: spacing(3),
      marginTop: 0,
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 2,
      overflow: 'hidden',
    },
    documentItem: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
    },
    documentRight: {
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    statusChip: {
      backgroundColor: 'transparent',
      marginBottom: spacing(1),
    },
    statusText: {
      fontSize: 10,
      fontWeight: '500',
    },
    documentDetails: {
      paddingHorizontal: spacing(3),
      paddingBottom: spacing(2),
      marginLeft: spacing(6),
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing(0.5),
    },
    detailLabel: {
      color: theme.colors.onSurfaceVariant,
    },
    detailValue: {
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    helpCard: {
      margin: spacing(3),
      marginTop: 0,
      marginBottom: spacing(4),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 2,
      overflow: 'hidden',
    },
    helpItem: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
    },
  });

export default DriverDocumentsScreen;