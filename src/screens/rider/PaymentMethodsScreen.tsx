import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { spacing, radii } from '../../theme';
import type { PaymentMethodsScreenProps } from '../../types/navigation';

const cards = [
  {
    id: 'visa',
    brand: 'Visa',
    last4: '9284',
    exp: '12/26',
    isDefault: true,
  },
  {
    id: 'mastercard',
    brand: 'Mastercard',
    last4: '4410',
    exp: '06/27',
    isDefault: false,
  }
];

const wallets = [
  {
    id: 'cash',
    label: 'Cash',
    description: 'Pay driver in person',
    icon: '💵',
  },
  {
    id: 'balance',
    label: 'Ride Wallet',
    description: 'Use RideMobile credits',
    icon: '💳'
  }
];

const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({ navigation }) => {
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
          <Text style={styles.headerTitle}>Payment methods</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Wallet balance</Text>
              <Text style={styles.balanceAmount}>34.800 TND</Text>
            </View>
            <TouchableOpacity style={styles.topUpButton}>
              <Text style={styles.topUpButtonText}>Top up</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceSubtitle}>Earn cashback on every trip you take.</Text>
        </View>

        {/* Cards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cards</Text>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>Add card</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardsList}>
            {cards.map((card, index) => (
              <TouchableOpacity key={card.id} style={styles.cardItem}>
                <View style={styles.cardIcon}>
                  <Text style={styles.cardIconText}>{card.brand.charAt(0)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{card.brand} •••• {card.last4}</Text>
                  <Text style={styles.cardExpiry}>Expires {card.exp}</Text>
                </View>
                <View style={styles.cardActions}>
                  {card.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                  <IconButton icon="dots-vertical" size={20} iconColor="#6B7280" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Other Methods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other methods</Text>
          
          <View style={styles.methodsList}>
            {wallets.map((wallet, index) => (
              <TouchableOpacity key={wallet.id} style={styles.methodItem}>
                <View style={styles.methodIcon}>
                  <Text style={styles.methodIconText}>{wallet.icon}</Text>
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>{wallet.label}</Text>
                  <Text style={styles.methodDescription}>{wallet.description}</Text>
                </View>
                <IconButton icon="chevron-right" size={20} iconColor="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Information</Text>
          <Text style={styles.infoText}>
            Your payment method is charged after the trip is completed. You can update your payment method at any time.
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

  // Balance Card
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing(3),
    marginTop: spacing(2),
    marginBottom: spacing(2),
    borderRadius: radii.lg,
    padding: spacing(3),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing(1),
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: spacing(0.5),
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  topUpButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topUpButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  balanceSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(2),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    paddingVertical: spacing(0.5),
  },
  addButtonText: {
    fontSize: 16,
    color: '#34D186',
    fontWeight: '500',
  },

  // Cards List
  cardsList: {
    gap: spacing(1),
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(2),
  },
  cardIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34D186',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: spacing(0.25),
  },
  cardExpiry: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultBadge: {
    backgroundColor: '#34D186',
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radii.pill,
    marginRight: spacing(1),
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Methods List
  methodsList: {
    gap: spacing(1),
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(2),
  },
  methodIconText: {
    fontSize: 20,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: spacing(0.25),
  },
  methodDescription: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Information Section
  infoSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing(3),
    marginBottom: spacing(3),
    borderRadius: radii.lg,
    padding: spacing(3),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing(1.5),
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default PaymentMethodsScreen;