import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { spacing, radii, useAppTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import type { PaymentMethodsScreenProps } from '../../types/navigation';

const paymentMethods = [
  {
    id: 'cash',
    label: 'Cash',
    description: 'Pay driver in person',
    icon: '💵',
    available: true,
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Credit or debit card',
    icon: '�',
    available: false,
    comingSoon: true,
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Payment Methods</Text>
          </View>

          {/* Payment Methods Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Methods</Text>
            
            <View style={styles.methodsList}>
              {paymentMethods.map((method) => (
                <TouchableOpacity 
                  key={method.id} 
                  style={[
                    styles.methodItem,
                    !method.available && styles.methodItemDisabled
                  ]}
                  disabled={!method.available}
                >
                  <View style={styles.methodIcon}>
                    <Text style={styles.methodIconText}>{method.icon}</Text>
                  </View>
                  <View style={styles.methodInfo}>
                    <View style={styles.methodTitleRow}>
                      <Text style={[
                        styles.methodTitle,
                        !method.available && styles.methodTitleDisabled
                      ]}>
                        {method.label}
                      </Text>
                      {method.comingSoon && (
                        <View style={styles.comingSoonBadge}>
                          <Text style={styles.comingSoonText}>Coming Soon</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.methodDescription,
                      !method.available && styles.methodDescriptionDisabled
                    ]}>
                      {method.description}
                    </Text>
                  </View>
                  {method.available && (
                    <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Information Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Information</Text>
            <Text style={styles.infoText}>
              Currently, only cash payment is available. Card payment support will be added soon. 
              You can pay the driver directly with cash at the end of your trip.
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
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
      marginBottom: spacing(2),
    },
    screenTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },

    // Content
    scrollView: {
      flex: 1,
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
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
    methodItemDisabled: {
      opacity: 0.5,
    },
    methodTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing(0.25),
    },
    methodTitleDisabled: {
      color: theme.colors.onSurfaceVariant,
    },
    methodDescriptionDisabled: {
      color: theme.colors.outline,
    },
    comingSoonBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing(1),
      paddingVertical: spacing(0.25),
      borderRadius: radii.sm,
      marginLeft: spacing(1),
    },
    comingSoonText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.onPrimary,
      textTransform: 'uppercase',
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