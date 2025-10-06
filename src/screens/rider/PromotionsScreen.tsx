import React from 'react';
import { SafeAreaView, StyleSheet, ScrollView, View } from 'react-native';
import { Surface, Text, Button, Chip, IconButton } from 'react-native-paper';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';
import type { PromotionsScreenProps } from '../../types/navigation';

const activePromos = [
  {
    id: 'welcome10',
    title: 'Welcome back! 10% off',
    description: 'Enjoy 10% off your next 3 rides. Valid for 14 days.',
    code: 'RIDE10',
    expiry: 'Expires 14 Oct'
  },
  {
    id: 'weekend',
    title: 'Weekend nights',
    description: 'Flat 5 TND off rides after 8pm every Friday & Saturday.',
    code: 'WKND5',
    expiry: 'Ends 30 Nov'
  }
];

const suggestions = ['Friends referral', 'Business profile', 'Daily commuter'];

const PromotionsScreen: React.FC<PromotionsScreenProps> = () => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface elevation={1} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Rewards and offers</Text>
            <Text style={styles.heroSubtitle}>
              Stack deals to save more on your daily trips. New offers weekly.
            </Text>
          </View>
          <View style={styles.codeRow}>
            <Button mode="outlined" style={styles.codeButton}>Enter promo code</Button>
            <IconButton icon="qrcode-scan" size={28} onPress={() => {}} />
          </View>
        </Surface>

        <Surface elevation={0} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Active</Text>
          {activePromos.map(promo => (
            <Surface key={promo.id} style={styles.promoCard}>
              <View style={styles.promoHeader}>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Chip mode="outlined" style={styles.codeChip}>#{promo.code}</Chip>
              </View>
              <Text style={styles.promoDescription}>{promo.description}</Text>
              <View style={styles.promoFooter}>
                <Text style={styles.promoExpiry}>{promo.expiry}</Text>
                <Button mode="text">Use now</Button>
              </View>
            </Surface>
          ))}
        </Surface>

        <Surface elevation={0} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>More ways to save</Text>
          <View style={styles.chipRow}>
            {suggestions.map(item => (
              <Chip key={item} mode="outlined" style={styles.suggestionChip}>{item}</Chip>
            ))}
          </View>
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
    heroCard: {
      borderRadius: radii.xl,
      padding: spacing(3),
      backgroundColor: theme.colors.surface,
      marginBottom: spacing(2.5),
    },
    heroHeader: {
      marginBottom: spacing(2),
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    heroSubtitle: {
      marginTop: spacing(1),
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    codeButton: {
      flex: 1,
      marginRight: spacing(1),
      borderRadius: radii.pill,
    },
    sectionCard: {
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(2.5),
      marginBottom: spacing(2),
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(1.5),
    },
    promoCard: {
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surfaceVariant,
      padding: spacing(2),
      marginBottom: spacing(1.5),
    },
    promoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(1),
    },
    promoTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    codeChip: {
      borderRadius: radii.pill,
    },
    promoDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(1.25),
    },
    promoFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    promoExpiry: {
      color: theme.colors.onSurfaceVariant,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    suggestionChip: {
      borderRadius: radii.pill,
      marginRight: spacing(1),
      marginBottom: spacing(1),
    },
  });

export default PromotionsScreen;
