import React from 'react';
import { SafeAreaView, StyleSheet, ScrollView, View } from 'react-native';
import { Surface, Text, Button, IconButton, Divider } from 'react-native-paper';
import { useAppTheme, spacing, radii } from '../../theme';
import type { AppTheme } from '../../theme';
import type { SavedPlacesScreenProps } from '../../types/navigation';

const savedPlaces = [
  {
    id: 'home',
    label: 'Home',
    address: 'Résidence Les Jasmins, Ennasr 1',
    icon: 'home'
  },
  {
    id: 'work',
    label: 'Work',
    address: 'Technopark El Ghazala, Ariana',
    icon: 'briefcase'
  },
  {
    id: 'gym',
    label: 'Gym',
    address: 'Orange Dome, Berges du Lac 2',
    icon: 'dumbbell'
  }
];

const suggestedSpots = [
  'Habib Bourguiba Avenue',
  'Cité El Ghazela',
  'Tunisia Mall',
  'Gammarth Village'
];

const SavedPlacesScreen: React.FC<SavedPlacesScreenProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface elevation={1} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Manage your saved places</Text>
            <Text style={styles.heroSubtitle}>
              Pin your everyday spots for faster bookings. They stay synced across all your devices.
            </Text>
          </View>
          <Button
            mode="contained"
            icon="plus"
            style={styles.heroButton}
            onPress={() => navigation.navigate('Home')}
          >
            Add new place
          </Button>
        </Surface>

        <Surface elevation={0} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Your Picks</Text>
          {savedPlaces.map((place, index) => (
            <React.Fragment key={place.id}>
              <View style={styles.placeRow}>
                <Surface style={[styles.placeIcon, { backgroundColor: theme.colors.surfaceVariant }]}> 
                  <IconButton icon={place.icon} iconColor={theme.colors.primary} size={20} />
                </Surface>
                <View style={styles.placeDetails}>
                  <Text style={styles.placeLabel}>{place.label}</Text>
                  <Text style={styles.placeAddress}>{place.address}</Text>
                </View>
                <IconButton icon="pencil" onPress={() => navigation.navigate('Home')} />
              </View>
              {index < savedPlaces.length - 1 && <Divider style={styles.divider} />}
            </React.Fragment>
          ))}
        </Surface>

        <Surface elevation={0} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Suggested nearby</Text>
          {suggestedSpots.map(spot => (
            <View key={spot} style={styles.suggestionRow}>
              <IconButton icon="map-marker" size={20} iconColor={theme.colors.onSurfaceVariant} />
              <Text style={styles.suggestionText}>{spot}</Text>
              <Button mode="text" onPress={() => navigation.navigate('Home')}>Save</Button>
            </View>
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
      fontSize: 26,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    heroSubtitle: {
      marginTop: spacing(1),
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 22,
    },
    heroButton: {
      alignSelf: 'flex-start',
      borderRadius: radii.pill,
      paddingHorizontal: spacing(2),
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
      marginBottom: spacing(1.5),
      color: theme.colors.onSurface,
    },
    placeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing(1),
    },
    placeIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing(1.5),
    },
    placeDetails: {
      flex: 1,
    },
    placeLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    placeAddress: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing(0.25),
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outline,
    },
    suggestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing(1),
    },
    suggestionText: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.onSurface,
    },
  });

export default SavedPlacesScreen;
