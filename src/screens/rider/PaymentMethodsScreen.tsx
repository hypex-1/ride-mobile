import React from 'react';
import { SafeAreaView, StyleSheet, ScrollView, View } from 'react-native';
import { Surface, Text, Button, List, IconButton, Divider, Avatar } from 'react-native-paper';
import { useAppTheme, spacing, radii } from '../../theme';
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
    icon: 'cash-multiple',
  },
  {
    id: 'balance',
    label: 'Ride Wallet',
    description: 'Use RideMobile credits',
    icon: 'wallet'
  }
];

const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = () => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface elevation={1} style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceLabel}>Wallet balance</Text>
              <Text style={styles.balanceAmount}>34.800 TND</Text>
            </View>
            <Button mode="outlined" compact>Top up</Button>
          </View>
          <Text style={styles.balanceSubtitle}>Earn cashback on every trip you take.</Text>
        </Surface>

        <Surface elevation={0} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cards</Text>
            <Button mode="text" onPress={() => {}}>Add card</Button>
          </View>
          {cards.map(card => (
            <React.Fragment key={card.id}>
              <List.Item
                style={styles.listItem}
                title={`${card.brand} •••• ${card.last4}`}
                description={`Expires ${card.exp}`}
                left={() => (
                  <Avatar.Text
                    size={44}
                    label={card.brand.charAt(0)}
                    style={styles.cardAvatar}
                    color={theme.colors.primary}
                  />
                )}
                right={() => (
                  <View style={styles.cardActions}>
                    {card.isDefault && (
                      <Surface style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.badgeText}>Default</Text>
                      </Surface>
                    )}
                    <IconButton icon="dots-vertical" onPress={() => {}} />
                  </View>
                )}
              />
              <Divider style={styles.divider} />
            </React.Fragment>
          ))}
        </Surface>

        <Surface elevation={0} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Other methods</Text>
          {wallets.map((wallet, index) => (
            <React.Fragment key={wallet.id}>
              <List.Item
                style={styles.listItem}
                title={wallet.label}
                description={wallet.description}
                left={(props) => <List.Icon {...props} icon={wallet.icon} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
              />
              {index < wallets.length - 1 && <Divider style={styles.divider} />}
            </React.Fragment>
          ))}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: spacing(2),
      paddingBottom: spacing(4),
    },
    balanceCard: {
      borderRadius: radii.xl,
      padding: spacing(3),
      backgroundColor: theme.colors.surface,
      marginBottom: spacing(2.5),
    },
    balanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    balanceLabel: {
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
    },
    balanceAmount: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    balanceSubtitle: {
      marginTop: spacing(1.5),
      color: theme.colors.onSurfaceVariant,
    },
    sectionCard: {
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(2.5),
      marginBottom: spacing(2),
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(1.5),
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    listItem: {
      borderRadius: radii.md,
    },
    cardAvatar: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outline,
    },
    badge: {
      borderRadius: radii.pill,
      paddingHorizontal: spacing(1.25),
      paddingVertical: spacing(0.5),
      marginRight: spacing(0.75),
    },
    badgeText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
      fontSize: 12,
    },
  });

export default PaymentMethodsScreen;
