import React from 'react';
import { SafeAreaView, StyleSheet, ScrollView, View } from 'react-native';
import { Surface, Text, Button, List, Divider, IconButton } from 'react-native-paper';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';
import type { SupportScreenProps } from '../../types/navigation';

const helpTopics = [
  { id: 'payment', title: 'Payment issues', description: 'Missing charges, refunds, receipts' },
  { id: 'safety', title: 'Safety & incidents', description: 'Emergency support, report a driver' },
  { id: 'account', title: 'Account & data', description: 'Update details, privacy preferences' },
  { id: 'lost', title: 'Lost items', description: 'Contact your driver about lost property' },
];

const quickActions = [
  { id: 'emergency', icon: 'alert-decagram', label: 'Emergency', color: '#DC2626' },
  { id: 'call', icon: 'phone', label: 'Call support', color: '#2563EB' },
  { id: 'chat', icon: 'message-text', label: 'Chat with us', color: '#16A34A' },
];

const SupportScreen: React.FC<SupportScreenProps> = () => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface elevation={1} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Need help?</Text>
            <Text style={styles.heroSubtitle}>We’re here around the clock. Reach out any time.</Text>
          </View>
          <View style={styles.quickRow}>
            {quickActions.map(action => (
              <Surface key={action.id} style={[styles.quickAction, { borderColor: action.color }]}> 
                <IconButton icon={action.icon} iconColor={action.color} size={24} />
                <Text style={styles.quickLabel}>{action.label}</Text>
              </Surface>
            ))}
          </View>
        </Surface>

        <Surface elevation={0} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular topics</Text>
            <Button mode="text">See all</Button>
          </View>
          {helpTopics.map(topic => (
            <React.Fragment key={topic.id}>
              <List.Item
                title={topic.title}
                description={topic.description}
                left={(props) => <List.Icon {...props} icon="help-circle" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
              />
              <Divider style={styles.divider} />
            </React.Fragment>
          ))}
        </Surface>

        <Surface elevation={0} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Support tickets</Text>
          <Text style={styles.emptyState}>You don’t have any open requests.</Text>
          <Button mode="outlined" style={styles.newTicketButton}>Create a ticket</Button>
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
    quickRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    quickAction: {
      flex: 1,
      borderRadius: radii.lg,
      borderWidth: 1,
      marginHorizontal: spacing(0.5),
      paddingVertical: spacing(1.5),
      alignItems: 'center',
    },
    quickLabel: {
      fontSize: 13,
      color: theme.colors.onSurface,
      fontWeight: '600',
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
      marginBottom: spacing(1.25),
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outline,
    },
    emptyState: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing(1),
      marginBottom: spacing(2),
    },
    newTicketButton: {
      alignSelf: 'center',
      paddingHorizontal: spacing(4),
      borderRadius: radii.pill,
    },
  });

export default SupportScreen;
