import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions, SafeAreaView, Linking, Share } from 'react-native';
import {
  Surface,
  Card,
  Button,
  Text,
  Portal,
  Modal,
  Chip,
  Avatar,
  IconButton,
  TouchableRipple,
  Icon,
  ProgressBar,
  List,
} from 'react-native-paper';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { RideTrackingScreenProps } from '../../types/navigation';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface RideLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

const rideTimelineStages = [
  {
    key: 'ACCEPTED',
    label: 'Driver on the way',
    description: 'Heading to pickup point',
    icon: 'car-arrow-right',
    tagline: 'Stay ready—driver is navigating to you.',
  },
  {
    key: 'ARRIVED',
    label: 'Driver has arrived',
    description: 'Waiting at pickup location',
    icon: 'map-marker-check-outline',
    tagline: 'Meet your driver at the pickup spot.',
  },
  {
    key: 'IN_PROGRESS',
    label: 'Ride in progress',
    description: 'On the way to destination',
    icon: 'navigation-variant-outline',
    tagline: 'Sit back and track the route in real time.',
  },
  {
    key: 'COMPLETED',
    label: 'Trip completed',
    description: 'Thanks for riding with us',
    icon: 'flag-checkered',
    tagline: 'Hope you enjoyed the ride—leave feedback soon!',
  },
] as const;

const rideQuickActions = [
  { id: 'call', label: 'Call driver', icon: 'phone' },
  { id: 'chat', label: 'Message', icon: 'message-text-outline' },
  { id: 'share', label: 'Share trip', icon: 'share-variant' },
  { id: 'safety', label: 'Safety', icon: 'shield-check' },
] as const;

const rideSupportActions = [
  { id: 'change-destination', label: 'Change destination', icon: 'map-marker-path' },
  { id: 'add-stop', label: 'Add stop', icon: 'plus-circle-outline' },
  { id: 'payment-method', label: 'Update payment method', icon: 'credit-card-sync-outline' },
  { id: 'report-issue', label: 'Report an issue', icon: 'alert-circle-outline' },
] as const;

const RideTrackingScreen: React.FC<RideTrackingScreenProps> = ({ route, navigation }) => {
  const { rideId, pickupLocation, dropoffLocation } = route.params;
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  // State
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [rideStatus, setRideStatus] = useState('ACCEPTED');
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [driverInfo, setDriverInfo] = useState({
    name: 'John Doe',
    vehicle: 'Toyota Camry',
    plateNumber: 'ABC-123',
    rating: 4.8,
    phone: '+1234567890',
  });
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  
  const mapRef = useRef<MapView>(null);

  const stageAliasMap = React.useMemo(() => ({
    ACCEPTED: 'ACCEPTED',
    ARRIVING: 'ARRIVED',
    ARRIVED: 'ARRIVED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
  } as Record<string, typeof rideTimelineStages[number]['key']>), []);

  const activeStageIndex = React.useMemo(() => {
    const mappedKey = stageAliasMap[rideStatus] ?? 'ACCEPTED';
    const resolvedIndex = rideTimelineStages.findIndex(stage => stage.key === mappedKey);
    return resolvedIndex === -1 ? 0 : resolvedIndex;
  }, [rideStatus, stageAliasMap]);

  const isRideCompleted = rideStatus === 'COMPLETED';

  const isStageCompleted = (index: number) => {
    if (isRideCompleted) {
      return true;
    }
    return index < activeStageIndex;
  };

  const isStageActive = (index: number) => {
    if (isRideCompleted) {
      return index === rideTimelineStages.length - 1;
    }
    return index === activeStageIndex;
  };

  const rideDistanceKm = React.useMemo(() => {
    if (!pickupLocation || !dropoffLocation) {
      return null;
    }

    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const lat1 = pickupLocation.latitude;
    const lon1 = pickupLocation.longitude;
    const lat2 = dropoffLocation.latitude;
    const lon2 = dropoffLocation.longitude;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = earthRadiusKm * c;
    if (Number.isNaN(distance) || !Number.isFinite(distance)) {
      return null;
    }

    return Math.max(distance, 0).toFixed(1);
  }, [pickupLocation, dropoffLocation]);

  const rideDurationMinutes = React.useMemo(() => {
    if (!rideDistanceKm) {
      return null;
    }

    const avgSpeedKmh = 35; // Approximate city traffic average
    const hours = parseFloat(rideDistanceKm) / avgSpeedKmh;
    const minutes = Math.max(1, Math.round(hours * 60));
    return minutes;
  }, [rideDistanceKm]);

  const handleCallDriver = React.useCallback(async () => {
    const phoneUrl = `tel:${driverInfo.phone}`;
    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Call driver', 'Phone calls are not supported on this device.');
      }
    } catch (error) {
      Alert.alert('Call driver', 'Unable to launch the dialer right now.');
    }
  }, [driverInfo.phone]);

  const handleMessageDriver = React.useCallback(async () => {
    const smsUrl = `sms:${driverInfo.phone}`;
    try {
      const supported = await Linking.canOpenURL(smsUrl);
      if (supported) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Message driver', 'Messaging is not supported on this device.');
      }
    } catch (error) {
      Alert.alert('Message driver', 'Unable to open the messaging app.');
    }
  }, [driverInfo.phone]);

  const handleShareTrip = React.useCallback(async () => {
    try {
      const message = `I\'m on a ride from ${pickupLocation.address || 'my pickup point'} to ${dropoffLocation.address || 'my destination'}. Track my trip with RideMobile.`;
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Share trip', 'Unable to open the share sheet right now.');
    }
  }, [pickupLocation.address, dropoffLocation.address]);

  const handleOpenSafety = React.useCallback(() => {
    setShowSafetyModal(true);
  }, []);

  const handleCloseSafety = React.useCallback(() => {
    setShowSafetyModal(false);
  }, []);

  const handleEmergencyCall = React.useCallback(async () => {
    const emergencyNumber = '112';
    const emergencyUrl = `tel:${emergencyNumber}`;
    try {
      const supported = await Linking.canOpenURL(emergencyUrl);
      if (supported) {
        await Linking.openURL(emergencyUrl);
      } else {
        Alert.alert('Emergency call', 'Phone calls are not supported on this device.');
      }
    } catch (error) {
      Alert.alert('Emergency call', 'Unable to place an emergency call right now.');
    }
  }, []);

  const handleShareStatusWithContact = React.useCallback(async () => {
    await handleShareTrip();
    setShowSafetyModal(false);
  }, [handleShareTrip]);

  const handleContactSupport = React.useCallback(() => {
    Alert.alert('Support', 'Our support team will contact you shortly.');
    setShowSafetyModal(false);
  }, []);

  const handleChangeDestination = React.useCallback(() => {
    Alert.alert('Change destination', 'Feature coming soon.');
  }, []);

  const handleAddStop = React.useCallback(() => {
    Alert.alert('Add stop', 'Feature coming soon.');
  }, []);

  const handleUpdatePayment = React.useCallback(() => {
    Alert.alert('Payment method', 'Switch payment methods in an upcoming update.');
  }, []);

  const handleReportIssue = React.useCallback(() => {
    Alert.alert('Report an issue', 'Support will help you shortly.');
  }, []);

  const supportActionHandlers = React.useMemo(() => ({
    'change-destination': handleChangeDestination,
    'add-stop': handleAddStop,
    'payment-method': handleUpdatePayment,
    'report-issue': handleReportIssue,
  }), [handleAddStop, handleChangeDestination, handleReportIssue, handleUpdatePayment]);

  const quickActionItems = React.useMemo(() => ([
    { ...rideQuickActions[0], onPress: handleCallDriver },
    { ...rideQuickActions[1], onPress: handleMessageDriver },
    { ...rideQuickActions[2], onPress: handleShareTrip },
    { ...rideQuickActions[3], onPress: handleOpenSafety },
  ]), [handleCallDriver, handleMessageDriver, handleShareTrip, handleOpenSafety]);

  const timelineProgress = React.useMemo(() => {
    if (rideTimelineStages.length <= 1) {
      return 0;
    }
    if (isRideCompleted) {
      return 1;
    }
    return activeStageIndex / (rideTimelineStages.length - 1);
  }, [activeStageIndex, isRideCompleted]);

  const activeStage = React.useMemo(() => {
    return rideTimelineStages[Math.min(activeStageIndex, rideTimelineStages.length - 1)] ?? rideTimelineStages[0];
  }, [activeStageIndex]);

  const rideMetaHighlights = React.useMemo(() => ([
    {
      key: 'eta',
      icon: 'clock-outline',
      label: 'ETA',
      value: estimatedArrival || '5 min',
    },
    {
      key: 'distance',
      icon: 'map-marker-distance',
      label: 'Distance',
      value: rideDistanceKm ? `${rideDistanceKm} km` : '—',
    },
    {
      key: 'duration',
      icon: 'timer-outline',
      label: 'Duration',
      value: rideDurationMinutes ? `${rideDurationMinutes} min` : '—',
    },
  ]), [estimatedArrival, rideDistanceKm, rideDurationMinutes]);

  useEffect(() => {
    if (socket && isConnected) {
      // Subscribe to driver location updates
      socket.on('driverLocation', handleDriverLocationUpdate);
      socket.on('rideUpdate', handleRideStatusUpdate);
      
      // Request initial driver location
      socket.emit('subscribeToRide', { rideId });
      
      return () => {
        socket.off('driverLocation');
        socket.off('rideUpdate');
      };
    }
  }, [socket, isConnected, rideId]);

  useEffect(() => {
    // Fit map to show pickup, dropoff, and driver location
    if (pickupLocation && dropoffLocation) {
      const coordinates: RideLocation[] = [pickupLocation, dropoffLocation];
      if (driverLocation) {
        coordinates.push({
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
        });
      }
      
      fitMapToCoordinates(coordinates);
    }
  }, [pickupLocation, dropoffLocation, driverLocation]);

  const handleDriverLocationUpdate = (data: any) => {
    if (data.rideId === rideId) {
      setDriverLocation({
        latitude: data.lat,
        longitude: data.lng,
        heading: data.heading,
        speed: data.speed,
      });
      
      // Calculate estimated arrival time (mock calculation)
      setEstimatedArrival('5 min');
    }
  };

  const handleRideStatusUpdate = (data: any) => {
    if (data.rideId === rideId) {
      setRideStatus(data.status);
      
      if (data.status === 'IN_PROGRESS') {
        Alert.alert('Ride Started', 'Your driver has started the trip');
      } else if (data.status === 'COMPLETED') {
        setShowCompleteModal(true);
      }
    }
  };

  const fitMapToCoordinates = (coordinates: RideLocation[]) => {
    if (coordinates.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const cancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            // TODO: API call to cancel ride
            socket?.emit('cancelRide', { rideId });
            navigation.goBack();
          },
        },
      ]
    );
  };

  const completeRide = async () => {
    try {
      // TODO: Call payment API
      // await fetch('/payments/log', { ... });
      
      setShowCompleteModal(false);
      navigation.navigate('RideReceipt', { 
        rideId,
        totalAmount: 15.50, // This would come from the ride data in a real app
        rideDetails: {
          pickupLocation: pickupLocation.address || 'Pickup Location',
          dropoffLocation: dropoffLocation.address || 'Dropoff Location',
          distance: 5.2, // This would be calculated
          duration: 12, // This would be tracked
          driverName: 'John Doe', // This would come from driver data
          vehicleInfo: 'Toyota Camry - ABC123' // This would come from driver data
        }
      });
    } catch (error) {
      console.error('Error completing ride:', error);
      Alert.alert('Error', 'Failed to process payment');
    }
  };

  const getStatusColor = () => {
    switch (rideStatus) {
      case 'ACCEPTED':
        return theme.colors.primary;
      case 'IN_PROGRESS':
        return theme.colors.tertiary;
      case 'COMPLETED':
        return theme.colors.secondary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusText = () => {
    switch (rideStatus) {
      case 'ACCEPTED':
      case 'ARRIVING':
        return 'Driver on the way';
      case 'ARRIVED':
        return 'Driver has arrived';
      case 'IN_PROGRESS':
        return 'Ride in progress';
      case 'COMPLETED':
        return 'Ride completed';
      default:
        return 'Updating ride status';
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
      >
        {/* Pickup marker */}
        <Marker
          coordinate={pickupLocation}
          title="Pickup Location"
          pinColor="green"
        />
        
        {/* Dropoff marker */}
        <Marker
          coordinate={dropoffLocation}
          title="Dropoff Location"
          pinColor="red"
        />
        
        {/* Driver marker */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Your Driver"
            rotation={driverLocation.heading || 0}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverText}>🚗</Text>
            </View>
          </Marker>
        )}
        
        {/* Route polyline */}
        {driverLocation && (
          <Polyline
            coordinates={[driverLocation, pickupLocation, dropoffLocation]}
            strokeColor={theme.colors.primary}
            strokeWidth={3}
          />
        )}
      </MapView>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <Surface elevation={0} style={styles.topBar}>
          <IconButton
            icon="arrow-left"
            size={22}
            onPress={() => navigation.goBack()}
            style={styles.topBarIcon}
          />
          <View style={styles.topBarContent}>
            <Text variant="labelSmall" style={styles.topBarLabel}>
              Ride to
            </Text>
            <Text variant="titleMedium" style={styles.topBarTitle} numberOfLines={1}>
              {dropoffLocation.address || 'Selected destination'}
            </Text>
          </View>
          <Button
            compact
            mode="text"
            onPress={() => {/* TODO: support flow */}}
            textColor={theme.colors.primary}
          >
            Help
          </Button>
        </Surface>
      </SafeAreaView>

      {/* Ride info card */}
      <Surface
        style={[
          styles.rideInfoCard,
          !panelExpanded && styles.rideInfoCardCollapsed
        ]}
        elevation={4}
      >
        <TouchableRipple
          borderless
          style={styles.panelHandleContainer}
          onPress={() => setPanelExpanded(prev => !prev)}
        >
          <View style={styles.panelHandle} />
        </TouchableRipple>

        {panelExpanded ? (
          <View style={styles.panelContent}>
            <View style={styles.statusHeader}>
              <Chip
                mode="outlined"
                style={[styles.statusChip, { borderColor: getStatusColor() }]}
                textStyle={[styles.statusChipText, { color: getStatusColor() }]}
                icon="clock-outline"
              >
                {getStatusText()}
              </Chip>
              <View style={styles.statusMeta}>
                <Text variant="bodyMedium" style={styles.statusPrimaryText}>
                  {estimatedArrival ? `ETA ${estimatedArrival}` : 'Driver location updating'}
                </Text>
                <Text variant="bodySmall" style={styles.statusSecondaryText}>
                  {driverInfo.name} • {driverInfo.vehicle}
                </Text>
              </View>
            </View>

            <ProgressBar
              progress={timelineProgress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />

            <Surface elevation={0} style={styles.stageHighlightCard}>
              <View style={styles.stageHighlightIcon}>
                <Icon source={activeStage.icon} size={18} color={theme.colors.onSecondary} />
              </View>
              <View style={styles.stageHighlightContent}>
                <Text variant="titleSmall" style={styles.stageHighlightTitle}>
                  {activeStage.label}
                </Text>
                <Text variant="bodySmall" style={styles.stageHighlightText}>
                  {activeStage.tagline}
                </Text>
              </View>
            </Surface>

            <View style={styles.metaHighlightRow}>
              {rideMetaHighlights.map(item => (
                <Surface key={item.key} elevation={0} style={styles.metaHighlightCard}>
                  <Icon source={item.icon} size={18} color={theme.colors.primary} />
                  <Text variant="labelSmall" style={styles.metaHighlightLabel}>
                    {item.label}
                  </Text>
                  <Text variant="titleSmall" style={styles.metaHighlightValue}>
                    {item.value}
                  </Text>
                </Surface>
              ))}
            </View>

            <Surface elevation={0} style={styles.driverCard}>
              <Avatar.Text
                size={56}
                label={driverInfo.name
                  .split(' ')
                  .map(part => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
                style={styles.avatar}
              />
              <View style={styles.driverMeta}>
                <Text variant="titleMedium" style={styles.driverName}>
                  {driverInfo.name}
                </Text>
                <View style={styles.driverBadges}>
                  <Chip compact icon="steering" style={styles.inlineChip}>
                    {driverInfo.plateNumber}
                  </Chip>
                  <Chip compact icon="star" style={styles.inlineChip}>
                    {driverInfo.rating.toFixed(1)}
                  </Chip>
                </View>
                <Text variant="bodySmall" style={styles.driverInfoText}>
                  {pickupLocation.address || 'Meet at pickup point'}
                </Text>
              </View>
            </Surface>

            <View style={styles.quickActionsRow}>
              {quickActionItems.map(action => (
                <TouchableRipple
                  key={action.id}
                  style={styles.quickActionButton}
                  onPress={action.onPress}
                >
                  <View style={styles.quickActionContent}>
                    <Avatar.Icon
                      size={40}
                      icon={action.icon}
                      style={styles.quickActionIcon}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                  </View>
                </TouchableRipple>
              ))}
            </View>

            <Surface elevation={0} style={styles.timelineCard}>
              {rideTimelineStages.map((stage, index) => {
                const completed = isStageCompleted(index);
                const active = isStageActive(index);
                const nodeIconColor = completed ? theme.colors.onPrimary : theme.colors.primary;
                return (
                  <View
                    key={stage.key}
                    style={[
                      styles.timelineRow,
                      index < rideTimelineStages.length - 1 && styles.timelineRowDivider,
                    ]}
                  >
                    <View style={styles.timelineIndicatorColumn}>
                      <View
                        style={[
                          styles.timelineNode,
                          completed && styles.timelineNodeCompleted,
                          active && styles.timelineNodeActive,
                        ]}
                      >
                        <Icon
                          source={completed ? 'check' : stage.icon}
                          size={16}
                          color={nodeIconColor}
                        />
                      </View>
                      {index < rideTimelineStages.length - 1 && (
                        <View
                          style={[
                            styles.timelineConnector,
                            completed && styles.timelineConnectorCompleted,
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text
                        variant="titleSmall"
                        style={[
                          styles.timelineTitle,
                          active && styles.timelineTitleActive,
                          completed && styles.timelineTitleCompleted,
                        ]}
                      >
                        {stage.label}
                      </Text>
                      <Text variant="bodySmall" style={styles.timelineSubtitle}>
                        {stage.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Surface>

            <Surface elevation={0} style={styles.routeSummaryCard}>
              <View style={styles.routeRow}>
                <View style={styles.routeBullet} />
                <View style={styles.routeContent}>
                  <Text variant="labelMedium" style={styles.routeLabel}>
                    Pickup
                  </Text>
                  <Text variant="bodyMedium" style={styles.routeValue} numberOfLines={1}>
                    {pickupLocation.address || 'Pickup location selected'}
                  </Text>
                </View>
              </View>
              <View style={styles.routeDivider} />
              <View style={styles.routeRow}>
                <View style={[styles.routeBullet, styles.routeBulletDestination]} />
                <View style={styles.routeContent}>
                  <Text variant="labelMedium" style={styles.routeLabel}>
                    Drop-off
                  </Text>
                  <Text variant="bodyMedium" style={styles.routeValue} numberOfLines={1}>
                    {dropoffLocation.address || 'Destination added'}
                  </Text>
                </View>
              </View>
            </Surface>

            <Surface elevation={0} style={styles.fareSummaryCard}>
              <View style={styles.fareSummaryHeader}>
                <Text variant="titleSmall" style={styles.fareTitle}>
                  Fare estimate
                </Text>
                <Text variant="headlineSmall" style={styles.fareTotal}>
                  TND 15.50
                </Text>
              </View>
              <View style={styles.fareBreakdownRow}>
                <Text variant="bodySmall" style={styles.fareLabel}>
                  Base fare
                </Text>
                <Text variant="bodySmall" style={styles.fareValue}>
                  TND 3.00
                </Text>
              </View>
              <View style={styles.fareBreakdownRow}>
                <Text variant="bodySmall" style={styles.fareLabel}>
                  Distance & time
                </Text>
                <Text variant="bodySmall" style={styles.fareValue}>
                  TND 10.00
                </Text>
              </View>
              <View style={styles.fareBreakdownRow}>
                <Text variant="bodySmall" style={styles.fareLabel}>
                  Service fee
                </Text>
                <Text variant="bodySmall" style={styles.fareValue}>
                  TND 2.50
                </Text>
              </View>
              <Button
                mode="outlined"
                icon="credit-card-outline"
                onPress={() => {/* TODO: change payment */}}
                style={styles.paymentButton}
              >
                Change payment method
              </Button>
            </Surface>

            <View style={styles.supportActionsSection}>
              <Text variant="titleSmall" style={styles.supportActionsTitle}>
                Trip actions
              </Text>
              {rideSupportActions.map(action => (
                <TouchableRipple
                  key={action.id}
                  style={styles.supportActionRow}
                  onPress={supportActionHandlers[action.id]}
                  rippleColor={theme.colors.primaryContainer}
                >
                  <View style={styles.supportActionContent}>
                    <Icon source={action.icon} size={20} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.supportActionLabel}>
                      {action.label}
                    </Text>
                    <Icon source="chevron-right" size={20} color={theme.colors.outline} />
                  </View>
                </TouchableRipple>
              ))}
            </View>

            <View style={styles.primaryActionRow}>
              <Button
                mode="outlined"
                icon="close-circle"
                onPress={cancelRide}
                style={styles.secondaryAction}
                textColor={theme.colors.error}
              >
                Cancel ride
              </Button>
              <Button
                mode="contained"
                icon="headset"
                onPress={() => Alert.alert('Need help?', 'Support will reach you shortly.')}
                style={styles.primaryAction}
              >
                Get help
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.collapsedPanelContent}>
            <Chip
              mode="outlined"
              style={[styles.statusChipCompact, { borderColor: getStatusColor() }]}
              textStyle={[styles.statusChipCompactText, { color: getStatusColor() }]}
            >
              {getStatusText()}
            </Chip>
            <Text variant="titleMedium" style={styles.collapsedEta}>
              {estimatedArrival ? `ETA ${estimatedArrival}` : 'Tracking driver'}
            </Text>
            <Text variant="bodySmall" style={styles.collapsedSubtitle}>
              {driverInfo.name} • {driverInfo.vehicle}
            </Text>
            <Text variant="bodySmall" style={styles.collapsedStageLabel}>
              {activeStage.label}
            </Text>
            <Text variant="bodySmall" style={styles.collapsedStageTip}>
              {activeStage.tagline}
            </Text>
            <ProgressBar
              progress={timelineProgress}
              color={theme.colors.primary}
              style={styles.collapsedProgress}
            />
            <Button
              compact
              mode="text"
              onPress={cancelRide}
              textColor={theme.colors.error}
            >
              Cancel ride
            </Button>
          </View>
        )}
      </Surface>

      {/* Ride completion modal */}
      <Portal>
        <Modal
          visible={showSafetyModal}
          onDismiss={handleCloseSafety}
          contentContainerStyle={styles.safetyModalContainer}
        >
          <Surface elevation={2} style={styles.safetyModalCard}>
            <View style={styles.safetyHeader}>
              <Icon source="shield-check" size={22} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.safetyTitle}>
                Safety toolkit
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.safetySubtitle}>
              Choose an option below to stay safe during your trip.
            </Text>

            <List.Section>
              <List.Item
                title="Call emergency services"
                description="Dial your local emergency number"
                left={props => <List.Icon {...props} icon="alarm-light" />}
                onPress={handleEmergencyCall}
                style={styles.safetyItem}
              />
              <List.Item
                title="Share trip with contact"
                description="Send your live trip details"
                left={props => <List.Icon {...props} icon="share-variant" />}
                onPress={handleShareStatusWithContact}
                style={styles.safetyItem}
              />
              <List.Item
                title="Contact support"
                description="Report an issue to RideMobile"
                left={props => <List.Icon {...props} icon="headset" />}
                onPress={handleContactSupport}
                style={styles.safetyItem}
              />
            </List.Section>

            <Button
              mode="outlined"
              onPress={handleCloseSafety}
              style={styles.safetyDismiss}
            >
              Close
            </Button>
          </Surface>
        </Modal>

        <Modal 
          visible={showCompleteModal} 
          dismissable={false}
          contentContainerStyle={styles.modalContent}
        >
          <Card style={styles.completeCard}>
            <Card.Content style={styles.completeContent}>
              <Text variant="headlineSmall" style={styles.completeTitle}>
                Ride Completed!
              </Text>
              <Text variant="bodyMedium" style={styles.completeMessage}>
                Thank you for riding with us. How was your experience?
              </Text>
              
              {/* TODO: Add rating component */}
              
              <View style={styles.completeButtons}>
                <Button 
                  mode="contained" 
                  onPress={completeRide}
                  style={styles.completeButton}
                >
                  View Receipt
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    map: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingTop: spacing(1),
    },
    topBar: {
      marginHorizontal: spacing(2),
      paddingVertical: spacing(1),
      paddingHorizontal: spacing(1.5),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
      shadowColor: theme.colors.onSurface,
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
    },
    topBarIcon: {
      margin: 0,
    },
    topBarContent: {
      flex: 1,
      marginRight: spacing(1),
    },
    topBarLabel: {
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing(0.25),
    },
    topBarTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    rideInfoCard: {
      position: 'absolute',
      bottom: spacing(2),
      left: spacing(2),
      right: spacing(2),
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      borderRadius: radii.xl || radii.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
      shadowColor: theme.colors.onSurface,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    rideInfoCardCollapsed: {
      paddingVertical: spacing(1.25),
    },
    panelHandleContainer: {
      alignItems: 'center',
      paddingVertical: spacing(0.75),
    },
    panelHandle: {
      width: 44,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.colors.outlineVariant,
    },
    panelContent: {
      paddingBottom: spacing(2.5),
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusChip: {
      borderWidth: 1,
      backgroundColor: theme.colors.surfaceVariant,
      alignSelf: 'flex-start',
    },
    statusChipText: {
      fontWeight: '600',
    },
    statusMeta: {
      flex: 1,
      marginLeft: spacing(1.5),
    },
    statusPrimaryText: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    statusSecondaryText: {
      marginTop: spacing(0.25),
      color: theme.colors.onSurfaceVariant,
    },
    driverCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing(1.5),
      padding: spacing(1.25),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
    },
    avatar: {
      backgroundColor: theme.colors.primaryContainer,
      marginRight: spacing(1.5),
    },
    driverMeta: {
      flex: 1,
    },
    driverName: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    driverInfoText: {
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing(0.5),
    },
    progressBar: {
      marginTop: spacing(1.5),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
    },
    driverBadges: {
      flexDirection: 'row',
      marginTop: spacing(0.75),
    },
    inlineChip: {
      marginRight: spacing(0.75),
      backgroundColor: theme.colors.surfaceVariant,
    },
    stageHighlightCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing(1.5),
      padding: spacing(1.25),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.secondaryContainer,
    },
    stageHighlightIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
  backgroundColor: theme.colors.secondary,
      marginRight: spacing(1),
    },
    stageHighlightContent: {
      flex: 1,
    },
    stageHighlightTitle: {
      color: theme.colors.onSecondaryContainer,
      fontWeight: '600',
    },
    stageHighlightText: {
      color: theme.colors.onSecondaryContainer,
      marginTop: spacing(0.25),
    },
    metaHighlightRow: {
      flexDirection: 'row',
      marginTop: spacing(1.5),
      marginHorizontal: -spacing(0.5),
    },
    metaHighlightCard: {
      flex: 1,
      marginHorizontal: spacing(0.5),
      borderRadius: radii.md,
      paddingVertical: spacing(1),
      paddingHorizontal: spacing(1.25),
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'flex-start',
    },
    metaHighlightLabel: {
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 0.5,
      marginTop: spacing(0.5),
    },
    metaHighlightValue: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    quickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing(1.5),
      marginHorizontal: -spacing(0.5),
    },
    quickActionButton: {
      flex: 1,
      marginHorizontal: spacing(0.5),
      borderRadius: radii.lg,
      overflow: 'hidden',
    },
    quickActionContent: {
      alignItems: 'center',
      paddingVertical: spacing(1),
      backgroundColor: theme.colors.surface,
      paddingHorizontal: spacing(0.5),
    },
    quickActionIcon: {
      backgroundColor: theme.colors.primaryContainer,
    },
    quickActionLabel: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginTop: spacing(0.5),
    },
    timelineCard: {
      marginTop: spacing(2),
      paddingVertical: spacing(1),
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
    },
    timelineRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(1),
    },
    timelineRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    timelineIndicatorColumn: {
      alignItems: 'center',
      marginRight: spacing(1.25),
    },
    timelineNode: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    timelineNodeCompleted: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    timelineNodeActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    timelineConnector: {
      width: 2,
      flex: 1,
      backgroundColor: theme.colors.outline,
    },
    timelineConnectorCompleted: {
      backgroundColor: theme.colors.primary,
    },
    timelineContent: {
      flex: 1,
    },
    timelineTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    timelineTitleActive: {
      color: theme.colors.primary,
    },
    timelineTitleCompleted: {
      color: theme.colors.primary,
    },
    timelineSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing(0.25),
    },
    routeSummaryCard: {
      marginTop: spacing(2),
      padding: spacing(1.5),
      borderRadius: radii.md,
      backgroundColor: theme.colors.surfaceVariant,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    routeBullet: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    routeBulletDestination: {
      backgroundColor: theme.colors.secondary,
    },
    routeContent: {
      flex: 1,
      marginLeft: spacing(1),
    },
    routeLabel: {
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontSize: 12,
    },
    routeValue: {
      color: theme.colors.onSurface,
      fontWeight: '500',
      marginTop: spacing(0.25),
    },
    routeDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outline,
      marginVertical: spacing(1.25),
    },
    fareSummaryCard: {
      marginTop: spacing(2),
      padding: spacing(1.5),
      borderRadius: radii.md,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
    },
    fareSummaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(1),
    },
    fareTitle: {
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: '600',
    },
    fareTotal: {
      color: theme.colors.onSurface,
      fontWeight: '700',
    },
    fareBreakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: spacing(0.25),
    },
    fareLabel: {
      color: theme.colors.onSurfaceVariant,
    },
    fareValue: {
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    paymentButton: {
      marginTop: spacing(1.5),
      borderRadius: radii.md,
    },
    supportActionsSection: {
      marginTop: spacing(2.5),
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    supportActionsTitle: {
      paddingHorizontal: spacing(1.5),
      paddingTop: spacing(1.25),
      paddingBottom: spacing(0.75),
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: '600',
    },
    supportActionRow: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outlineVariant,
    },
    supportActionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(1.1),
    },
    supportActionLabel: {
      flex: 1,
      marginLeft: spacing(1),
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    primaryActionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing(2.5),
      gap: spacing(1),
    },
    secondaryAction: {
      flex: 1,
      borderRadius: radii.lg,
      borderColor: theme.colors.error,
      borderWidth: StyleSheet.hairlineWidth,
    },
    primaryAction: {
      flex: 1,
      borderRadius: radii.lg,
    },
    collapsedPanelContent: {
      alignItems: 'center',
      paddingBottom: spacing(1),
    },
    statusChipCompact: {
      borderWidth: 1,
      backgroundColor: theme.colors.surfaceVariant,
      marginBottom: spacing(0.75),
    },
    statusChipCompactText: {
      fontWeight: '600',
    },
    collapsedEta: {
      color: theme.colors.onSurface,
      marginBottom: spacing(0.5),
      textAlign: 'center',
    },
    collapsedSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(0.75),
      textAlign: 'center',
    },
    collapsedStageLabel: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: spacing(0.25),
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    collapsedStageTip: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing(0.75),
    },
    collapsedProgress: {
      width: '70%',
      alignSelf: 'center',
      marginTop: spacing(0.5),
      borderRadius: radii.md,
      backgroundColor: theme.colors.surfaceVariant,
    },
    safetyModalContainer: {
      margin: spacing(2),
    },
    safetyModalCard: {
      borderRadius: radii.lg,
      padding: spacing(2),
      backgroundColor: theme.colors.surface,
    },
    safetyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing(1),
    },
    safetyTitle: {
      marginLeft: spacing(1),
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    safetySubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing(1.5),
    },
    safetyItem: {
      borderRadius: radii.md,
    },
    safetyDismiss: {
      marginTop: spacing(1.5),
      borderRadius: radii.md,
    },
    driverMarker: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.tertiary,
    },
    driverText: {
      fontSize: 20,
    },
    modalContent: {
      margin: spacing(3),
      backgroundColor: 'transparent',
    },
    completeCard: {
      borderRadius: radii.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    completeContent: {
      alignItems: 'center',
      padding: spacing(3),
    },
    completeTitle: {
      marginBottom: spacing(2),
      textAlign: 'center',
      color: theme.colors.onSurface,
    },
    completeMessage: {
      marginBottom: spacing(2.5),
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
    },
    completeButtons: {
      width: '100%',
    },
    completeButton: {
      marginTop: spacing(1),
      borderRadius: radii.md,
    },
  });

export default RideTrackingScreen;