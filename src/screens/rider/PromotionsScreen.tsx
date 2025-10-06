import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { spacing, radii } from '../../theme';
import type { PromotionsScreenProps } from '../../types/navigation';

const activePromos = [
  {
    id: 'welcome10',
    title: 'Welcome back! 10% off',
    description: 'Enjoy 10% off your next 3 rides. Valid for 14 days.',
    code: 'RIDE10',
    expiry: 'Expires 14 Oct',
    discount: '10% OFF'
  },
  {
    id: 'weekend',
    title: 'Weekend nights',
    description: 'Flat 5 TND off rides after 8pm every Friday & Saturday.',
    code: 'WKND5',
    expiry: 'Ends 30 Nov',
    discount: '5 TND OFF'
  }
];

const availablePromos = [
  {
    id: 'friends',
    title: 'Invite friends',
    description: 'Get 10 TND credit for each friend who joins',
    action: 'Invite now'
  },
  {
    id: 'business',
    title: 'Business profile',
    description: 'Unlock exclusive deals for business travelers',
    action: 'Set up'
  },
  {
    id: 'commuter',
    title: 'Daily commuter',
    description: 'Save on your regular routes with our commuter pass',
    action: 'Learn more'
  }
];

const PromotionsScreen: React.FC<PromotionsScreenProps> = ({ navigation }) => {
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
          <Text style={styles.headerTitle}>Promotions</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Rewards and offers</Text>
          <Text style={styles.heroSubtitle}>
            Stack deals to save more on your daily trips. New offers weekly.
          </Text>
          <View style={styles.promoCodeRow}>
            <TouchableOpacity style={styles.promoCodeButton}>
              <Text style={styles.promoCodeButtonText}>Enter promo code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scanButton}>
              <Text style={styles.scanIcon}>📱</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Promotions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active</Text>
          {activePromos.map((promo) => (
            <View key={promo.id} style={styles.promoCard}>
              <View style={styles.promoHeader}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{promo.discount}</Text>
                </View>
                <Text style={styles.promoExpiry}>{promo.expiry}</Text>
              </View>
              <Text style={styles.promoTitle}>{promo.title}</Text>
              <Text style={styles.promoDescription}>{promo.description}</Text>
              <View style={styles.promoCodeContainer}>
                <Text style={styles.promoCodeLabel}>Code: </Text>
                <Text style={styles.promoCode}>{promo.code}</Text>
                <TouchableOpacity style={styles.copyButton}>
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Available Offers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available offers</Text>
          {availablePromos.map((promo, index) => (
            <TouchableOpacity key={promo.id} style={styles.offerItem}>
              <View style={styles.offerIcon}>
                <Text style={styles.offerIconText}>🎁</Text>
              </View>
              <View style={styles.offerInfo}>
                <Text style={styles.offerTitle}>{promo.title}</Text>
                <Text style={styles.offerDescription}>{promo.description}</Text>
              </View>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>{promo.action}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Terms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & conditions</Text>
          <Text style={styles.termsText}>
            • Promotions cannot be combined with other offers{'\n'}
            • Discount applies to base fare only, excludes taxes and fees{'\n'}
            • Valid for new users only (where specified){'\n'}
            • Subject to availability and terms of use{'\n'}
            • RideMobile reserves the right to modify or cancel promotions
          </Text>
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

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing(3),
    marginTop: spacing(2),
    marginBottom: spacing(2),
    borderRadius: radii.lg,
    padding: spacing(3),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing(1),
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: spacing(2.5),
  },
  promoCodeRow: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  promoCodeButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: spacing(1.5),
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  promoCodeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  scanButton: {
    backgroundColor: '#34D186',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIcon: {
    fontSize: 20,
  },

  // Sections
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

  // Promo Cards
  promoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radii.lg,
    padding: spacing(2.5),
    marginBottom: spacing(2),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(1.5),
  },
  discountBadge: {
    backgroundColor: '#34D186',
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radii.pill,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  promoExpiry: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing(0.5),
  },
  promoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: spacing(1.5),
  },
  promoCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing(1.5),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  promoCodeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  promoCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  copyButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radii.md,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },

  // Offer Items
  offerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  offerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(2),
  },
  offerIconText: {
    fontSize: 20,
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: spacing(0.25),
  },
  offerDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButton: {
    backgroundColor: '#34D186',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.md,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // Terms
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default PromotionsScreen;