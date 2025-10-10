import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Surface,
  Card,
  Text,
  IconButton,
  SegmentedButtons,
  ActivityIndicator,
  List,
  Divider,
} from 'react-native-paper';
import { driverService } from '../../services';
import type { DriverStats } from '../../services/driver';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';
import type { DriverEarningsScreenProps } from '../../types/navigation';

const { width } = Dimensions.get('window');

const DriverEarningsScreen: React.FC<DriverEarningsScreenProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  const [timeframe, setTimeframe] = useState('today');
  const [todayStats, setTodayStats] = useState<DriverStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<DriverStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      const [today, weekly] = await Promise.all([
        driverService.getTodayStats(),
        driverService.getWeeklyStats(),
      ]);
      setTodayStats(today);
      setWeeklyStats(weekly);
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyTotal = () => {
    return weeklyStats.reduce((total, day) => total + day.earnings, 0);
  };

  const getWeeklyRides = () => {
    return weeklyStats.reduce((total, day) => total + day.ridesCompleted, 0);
  };

  const getWeeklyHours = () => {
    return weeklyStats.reduce((total, day) => total + day.onlineTime, 0);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCurrentStats = () => {
    if (timeframe === 'today') {
      return {
        earnings: todayStats?.earnings || 0,
        rides: todayStats?.ridesCompleted || 0,
        hours: todayStats?.onlineTime || 0,
      };
    } else {
      return {
        earnings: getWeeklyTotal(),
        rides: getWeeklyRides(),
        hours: getWeeklyHours(),
      };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const currentStats = getCurrentStats();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header - Enhanced Bolt Style */}
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Earnings & Reports
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Timeframe Selector */}
          <View style={styles.timeframeContainer}>
            <SegmentedButtons
              value={timeframe}
              onValueChange={setTimeframe}
              buttons={[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          {/* Earnings Summary */}
          <Surface style={styles.summaryCard}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {timeframe === 'today' ? 'Today\'s Earnings' : 'Weekly Earnings'}
            </Text>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text variant="headlineLarge" style={styles.earningsAmount}>
                  ${currentStats.earnings.toFixed(2)}
                </Text>
                <Text variant="bodySmall" style={styles.summaryLabel}>Total Earnings</Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryDetails}>
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Rides Completed</Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>{currentStats.rides}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Online Time</Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>{formatTime(currentStats.hours)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Avg per Ride</Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    ${currentStats.rides > 0 ? (currentStats.earnings / currentStats.rides).toFixed(2) : '0.00'}
                  </Text>
                </View>
              </View>
            </View>
          </Surface>

          {/* Weekly Breakdown (when week is selected) */}
          {timeframe === 'week' && (
            <Surface style={styles.breakdownCard}>
              <Text variant="titleMedium" style={styles.cardTitle}>Daily Breakdown</Text>
              
              {weeklyStats.map((dayStats, index) => {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const today = new Date();
                const dayOfWeek = (today.getDay() - index + 7) % 7;
                
                return (
                  <View key={index}>
                    <List.Item
                      title={dayNames[dayOfWeek]}
                      description={`${dayStats.ridesCompleted} rides • ${formatTime(dayStats.onlineTime)}`}
                      right={() => (
                        <Text variant="bodyLarge" style={styles.dayEarnings}>
                          ${dayStats.earnings.toFixed(2)}
                        </Text>
                      )}
                      style={styles.dayItem}
                    />
                    {index < weeklyStats.length - 1 && <Divider />}
                  </View>
                );
              })}
            </Surface>
          )}

          {/* Performance Insights */}
          <Surface style={styles.insightsCard}>
            <Text variant="titleMedium" style={styles.cardTitle}>Performance Insights</Text>
            
            <List.Item
              title="Peak Hours"
              description="Your best earning hours are typically 7-9 AM and 5-7 PM"
              left={(props) => <List.Icon {...props} icon="clock" />}
              style={styles.insightItem}
            />
            <Divider />
            <List.Item
              title="Rating Impact"
              description={`Current rating: ${todayStats?.rating?.toFixed(1) || '5.0'}  - Great job!`}
              left={(props) => <List.Icon {...props} icon="star" />}
              style={styles.insightItem}
            />
            <Divider />
            <List.Item
              title="Weekly Goal"
              description={`You're ${((currentStats.earnings / 500) * 100).toFixed(0)}% towards your $500 weekly goal`}
              left={(props) => <List.Icon {...props} icon="target" />}
              style={styles.insightItem}
            />
          </Surface>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1.5),
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
      minHeight: 56,
    },
    headerTitle: {
      textAlign: 'center',
      fontWeight: '700',
      color: theme.colors.onSurface,
      fontSize: 20,
    },
    headerPlaceholder: {
      width: 48,
      height: 48,
    },
    scrollView: {
      flex: 1,
    },
    timeframeContainer: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
    },
    segmentedButtons: {
      marginBottom: spacing(1),
    },
    summaryCard: {
      margin: spacing(3),
      marginTop: spacing(1),
      padding: spacing(3),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    cardTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing(3),
    },
    summaryGrid: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    earningsAmount: {
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: spacing(1),
    },
    summaryLabel: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    summaryDivider: {
      width: 1,
      height: 60,
      backgroundColor: theme.colors.outline,
      marginHorizontal: spacing(3),
    },
    summaryDetails: {
      flex: 1,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing(1),
    },
    detailLabel: {
      color: theme.colors.onSurfaceVariant,
    },
    detailValue: {
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    breakdownCard: {
      margin: spacing(3),
      marginTop: 0,
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 2,
      overflow: 'hidden',
    },
    dayItem: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
    },
    dayEarnings: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    insightsCard: {
      margin: spacing(3),
      marginTop: 0,
      marginBottom: spacing(4),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      elevation: 2,
      overflow: 'hidden',
    },
    insightItem: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
    },
  });

export default DriverEarningsScreen;