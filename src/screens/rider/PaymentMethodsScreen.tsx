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
    icon: '',
    available: true,
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Credit or debit card',
    icon: '',
    available: false,
    comingSoon: true,
  }
];

const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Fixed Header with Back Button */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>Payment Methods</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Payment Methods Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose your payment method</Text>
            <Text style={styles.sectionSubtitle}>Select how you'd like to pay for your rides</Text>
            
            <View style={styles.methodsList}>
              {paymentMethods.map((method, index) => (
                <TouchableOpacity 
                  key={method.id} 
                  style={[
                    styles.methodItem,
                    !method.available && styles.methodItemDisabled,
                    index === paymentMethods.length - 1 && styles.methodItemLast
                  ]}
                  disabled={!method.available}
                  activeOpacity={0.7}
                >
                  <View style={styles.methodIcon}>
                    <Text style={styles.methodIconText}>{method.icon}</Text>
                  </View>
                  <View style={styles.methodContent}>
                    <View style={styles.methodHeader}>
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
                  <View style={styles.methodAction}>
                    {method.available ? (
                      <IconButton 
                        icon="chevron-right" 
                        size={20} 
                        iconColor={theme.colors.onSurfaceVariant}
                        style={styles.chevron}
                      />
                    ) : (
                      <View style={styles.chevronPlaceholder} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Information Section with better styling */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoIcon}>ℹ</Text>
              <Text style={styles.infoTitle}>Payment Information</Text>
            </View>
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
    safeArea: {
      flex: 1,
    },

    // Header - Bolt style with proper spacing
    headerContainer: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
      paddingBottom: spacing(1),
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      minHeight: 56, // Ensure header doesn't get cropped
    },
    backButton: {
      margin: 0,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginHorizontal: spacing(2),
    },
    headerSpacer: {
      width: 48, // Same width as back button for centering
    },

    // Content
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingVertical: spacing(3),
      paddingBottom: spacing(4), // Prevent bottom cropping
    },

    // Section - Bolt card style
    section: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: spacing(3),
      marginBottom: spacing(3),
      borderRadius: radii.lg,
      padding: spacing(4),
      shadowColor: theme.colors.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing(1),
    },
    sectionSubtitle: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(4),
      lineHeight: 22,
    },

    // Methods List - Bolt interactive style
    methodsList: {
      gap: 0, // Remove gap, use borders instead
    },
    methodItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing(3),
      paddingHorizontal: spacing(2),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
      minHeight: 72, // Ensure consistent height
    },
    methodItemLast: {
      borderBottomWidth: 0, // Remove border on last item
    },
    methodItemDisabled: {
      opacity: 0.5,
    },

    // Method components
    methodIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primaryContainer || theme.colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing(3),
    },
    methodIconText: {
      fontSize: 24,
    },
    methodContent: {
      flex: 1,
      paddingRight: spacing(2),
    },
    methodHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing(0.5),
    },
    methodTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    methodTitleDisabled: {
      color: theme.colors.onSurfaceVariant,
    },
    methodDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    methodDescriptionDisabled: {
      color: theme.colors.outline,
    },
    methodAction: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
    },
    chevron: {
      margin: 0,
    },
    chevronPlaceholder: {
      width: 40,
      height: 40,
    },

    // Coming Soon Badge - Bolt style
    comingSoonBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(0.5),
      borderRadius: radii.md,
      marginLeft: spacing(2),
    },
    comingSoonText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.onPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // Information Card - Bolt info card style
    infoCard: {
      backgroundColor: theme.colors.surfaceVariant,
      marginHorizontal: spacing(3),
      marginBottom: spacing(4),
      borderRadius: radii.lg,
      padding: spacing(4),
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing(2),
    },
    infoIcon: {
      fontSize: 20,
      marginRight: spacing(2),
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },

    // Legacy styles (keeping for compatibility)
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
    infoSection: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: spacing(3),
      marginBottom: spacing(3),
      borderRadius: radii.lg,
      padding: spacing(3),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outline,
    },
  });

export default PaymentMethodsScreen;