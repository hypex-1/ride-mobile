import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { spacing, radii, useAppTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import type { SupportScreenProps } from '../../types/navigation';

const helpTopics = [
  { id: 'payment', title: 'Payment issues', description: 'Missing charges, refunds, receipts', icon: '💳' },
  { id: 'safety', title: 'Safety & incidents', description: 'Emergency support, report a driver', icon: '🛡️' },
  { id: 'account', title: 'Account & data', description: 'Update details, privacy preferences', icon: '👤' },
  { id: 'lost', title: 'Lost items', description: 'Contact your driver about lost property', icon: '🎒' },
];

const SupportScreen: React.FC<SupportScreenProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const quickActions = React.useMemo(
    () => [
      { id: 'emergency', icon: '🚨', label: 'Emergency', color: theme.colors.error },
      { id: 'call', icon: '📞', label: 'Call Support', color: theme.colors.primary },
      { id: 'chat', icon: '💬', label: 'Live Chat', color: theme.colors.secondary },
    ],
    [theme],
  );

  return (
    <View style={styles.container}>
  <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onSurface}
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Support</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.id} style={[styles.quickActionCard, { borderLeftColor: action.color }]}>
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Help Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help topics</Text>
          <View style={styles.topicsList}>
            {helpTopics.map((topic, index) => (
              <TouchableOpacity key={topic.id} style={styles.topicItem}>
                <View style={styles.topicIcon}>
                  <Text style={styles.topicIconText}>{topic.icon}</Text>
                </View>
                <View style={styles.topicInfo}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.topicDescription}>{topic.description}</Text>
                </View>
                <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact us</Text>
          
          <TouchableOpacity style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>📧</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email</Text>
              <Text style={styles.contactValue}>support@ridemobile.tn</Text>
            </View>
            <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>📞</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Phone</Text>
              <Text style={styles.contactValue}>+216 71 123 456</Text>
            </View>
            <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>🕒</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Support hours</Text>
              <Text style={styles.contactValue}>24/7 available</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently asked questions</Text>
          
          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I cancel a ride?</Text>
            <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How are ride fares calculated?</Text>
            <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What if I lost an item in the car?</Text>
              <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I report a driver?</Text>
              <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surfaceVariant,
    },

    // Header
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
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
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 48,
    },

    // Content
    scrollView: {
      flex: 1,
    },

    // Sections
    quickActionsSection: {
      marginHorizontal: spacing(3),
      marginTop: spacing(2),
      marginBottom: spacing(2),
    },
    section: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: spacing(3),
      marginBottom: spacing(2),
      borderRadius: radii.lg,
      padding: spacing(3),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(2),
    },

    // Quick Actions
    quickActionsGrid: {
      flexDirection: 'row',
      gap: spacing(2),
    },
    quickActionCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: radii.lg,
      padding: spacing(2.5),
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
      borderLeftWidth: 4,
    },
    quickActionIcon: {
      fontSize: 28,
      marginBottom: spacing(1),
    },
    quickActionLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      textAlign: 'center',
    },

    // Help Topics
    topicsList: {
      gap: spacing(1),
    },
    topicItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing(1.5),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    topicIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing(2),
    },
    topicIconText: {
      fontSize: 20,
    },
    topicInfo: {
      flex: 1,
    },
    topicTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: spacing(0.25),
    },
    topicDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },

    // Contact Items
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing(1.5),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    contactIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing(2),
    },
    contactIconText: {
      fontSize: 20,
    },
    contactInfo: {
      flex: 1,
    },
    contactTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: spacing(0.25),
    },
    contactValue: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },

    // FAQ Items
    faqItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing(2),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    faqQuestion: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
  });

export default SupportScreen;