import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { spacing, radii, useAppTheme } from '../../theme';
import type { AppTheme } from '../../theme';
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
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const statusBarStyle: 'light-content' | 'dark-content' = 'dark-content';

  return (
    <View style={styles.container}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={theme.colors.background} />
      
      <SafeAreaView style={styles.safeArea}>
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
                  <IconButton icon="dots-vertical" size={20} iconColor={theme.colors.onSurfaceVariant} />
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
                <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant} />
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

    // Safe Area
    safeArea: {
      flex: 1,
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

    // Balance Card
    balanceCard: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: spacing(3),
      marginTop: spacing(2),
      marginBottom: spacing(2),
      borderRadius: radii.lg,
      padding: spacing(3),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
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
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(0.5),
    },
    balanceAmount: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    topUpButton: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    topUpButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    balanceSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },

    // Sections
    section: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: spacing(3),
      marginBottom: spacing(2),
      borderRadius: radii.lg,
      padding: spacing(3),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
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
      color: theme.colors.onSurface,
    },
    addButton: {
      paddingVertical: spacing(0.5),
    },
    addButtonText: {
      fontSize: 16,
      color: theme.colors.primary,
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
      borderBottomColor: theme.colors.outline,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing(2),
    },
    cardIconText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    cardInfo: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: spacing(0.25),
    },
    cardExpiry: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    defaultBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(0.5),
      borderRadius: radii.pill,
      marginRight: spacing(1),
    },
    defaultBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onPrimary,
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
      borderBottomColor: theme.colors.outline,
    },
    methodIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceVariant,
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
      color: theme.colors.onSurface,
      marginBottom: spacing(0.25),
    },
    methodDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },

    // Information Section
    infoSection: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: spacing(3),
      marginBottom: spacing(3),
      borderRadius: radii.lg,
      padding: spacing(3),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(1.5),
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
  });

export default PaymentMethodsScreen;