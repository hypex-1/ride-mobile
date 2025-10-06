import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { spacing, radii } from '../../theme';
import type { SupportScreenProps } from '../../types/navigation';

const helpTopics = [
  { id: 'payment', title: 'Payment issues', description: 'Missing charges, refunds, receipts', icon: '💳' },
  { id: 'safety', title: 'Safety & incidents', description: 'Emergency support, report a driver', icon: '🛡️' },
  { id: 'account', title: 'Account & data', description: 'Update details, privacy preferences', icon: '👤' },
  { id: 'lost', title: 'Lost items', description: 'Contact your driver about lost property', icon: '🎒' },
];

const quickActions = [
  { id: 'emergency', icon: '🚨', label: 'Emergency', color: '#DC2626' },
  { id: 'call', icon: '📞', label: 'Call Support', color: '#34D186' },
  { id: 'chat', icon: '💬', label: 'Live Chat', color: '#3B82F6' },
];

const SupportScreen: React.FC<SupportScreenProps> = ({ navigation }) => {
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
                <IconButton icon="chevron-right" size={20} iconColor="#6B7280" />
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
            <IconButton icon="chevron-right" size={20} iconColor="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>📞</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Phone</Text>
              <Text style={styles.contactValue}>+216 71 123 456</Text>
            </View>
            <IconButton icon="chevron-right" size={20} iconColor="#6B7280" />
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
            <IconButton icon="chevron-right" size={20} iconColor="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How are ride fares calculated?</Text>
            <IconButton icon="chevron-right" size={20} iconColor="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What if I lost an item in the car?</Text>
            <IconButton icon="chevron-right" size={20} iconColor="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I report a driver?</Text>
            <IconButton icon="chevron-right" size={20} iconColor="#6B7280" />
          </TouchableOpacity>
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

  // Sections
  quickActionsSection: {
    marginHorizontal: spacing(3),
    marginTop: spacing(2),
    marginBottom: spacing(2),
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing(3),
    marginBottom: spacing(2),
    borderRadius: radii.lg,
    padding: spacing(3),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing(2),
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing(2.5),
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: spacing(1),
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
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
    borderBottomColor: '#F3F4F6',
  },
  topicIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
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
    color: '#111827',
    marginBottom: spacing(0.25),
  },
  topicDescription: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Contact Items
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
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
    color: '#111827',
    marginBottom: spacing(0.25),
  },
  contactValue: {
    fontSize: 14,
    color: '#6B7280',
  },

  // FAQ Items
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
});

export default SupportScreen;