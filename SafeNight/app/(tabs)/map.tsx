import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DEMO_VENUES } from '../../src/assets/data/venues';
import { Venue } from '../../src/types';
import { Colors, BorderRadius, Typography, Spacing, Shadows } from '../../src/components/ui/theme';
import { usePlanStore } from '../../src/stores/planStore';
// Web-specific map import (for proper Leaflet support)
import { PlatformMap } from '../../src/components/map/MapView.web';

type FilterType = 'all' | 'women_owned' | 'security' | 'low_crowd';

export default function MapScreen() {
  const router = useRouter();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');

  const { currentPlan, addVenue } = usePlanStore();

  // Apply filters
  const filteredVenues = DEMO_VENUES.filter((venue) => {
    switch (filter) {
      case 'women_owned':
        return venue.womenOwned;
      case 'security':
        return venue.hasSecurityStaff;
      case 'low_crowd':
        return venue.crowdLevel === 'low';
      default:
        return true;
    }
  });

  const handleAddToPlan = (venue: Venue) => {
    if (!currentPlan) {
      Alert.alert(
        'No Active Plan',
        'Create a night plan first before adding venues.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if venue is already in plan
    const exists = currentPlan.venues.some(v => v.id === venue.id);
    if (exists) {
      Alert.alert('Already Added', `${venue.name} is already in your plan.`);
      return;
    }

    addVenue(currentPlan.id, venue);

    Alert.alert(
      'Added!',
      `${venue.name} added to your plan.`,
      [
        { text: 'OK', style: 'cancel' },
        {
          text: 'View Plan',
          onPress: () => router.push('/plan')
        }
      ]
    );
  };

  const getCrowdColor = (level?: Venue['crowdLevel']) => {
    switch (level) {
      case 'low':
        return Colors.safe;
      case 'medium':
        return Colors.caution;
      case 'high':
        return Colors.danger;
      default:
        return Colors.textMuted;
    }
  };

  const getVenueTypeIcon = (type: Venue['type']): string => {
    switch (type) {
      case 'bar':
        return 'wine';
      case 'club':
        return 'musical-notes';
      case 'restaurant':
        return 'restaurant';
      case 'lounge':
        return 'cafe';
      default:
        return 'location';
    }
  };

  // Filter chips component
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'women_owned' && styles.filterChipActive]}
          onPress={() => setFilter('women_owned')}
        >
          <Ionicons name="heart" size={14} color={filter === 'women_owned' ? Colors.white : Colors.secondary} />
          <Text style={[styles.filterText, filter === 'women_owned' && styles.filterTextActive]}>
            Women-Owned
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'security' && styles.filterChipActive]}
          onPress={() => setFilter('security')}
        >
          <Ionicons name="shield-checkmark" size={14} color={filter === 'security' ? Colors.white : Colors.safe} />
          <Text style={[styles.filterText, filter === 'security' && styles.filterTextActive]}>
            Security
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'low_crowd' && styles.filterChipActive]}
          onPress={() => setFilter('low_crowd')}
        >
          <Ionicons name="people" size={14} color={filter === 'low_crowd' ? Colors.white : Colors.primary} />
          <Text style={[styles.filterText, filter === 'low_crowd' && styles.filterTextActive]}>
            Low Crowd
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Map rendering - automatically uses native or web version based on platform
  const renderMap = () => (
    <PlatformMap
      venues={filteredVenues}
      selectedVenueId={selectedVenue?.id}
      onVenueSelect={setSelectedVenue}
      getCrowdColor={getCrowdColor}
      getVenueTypeIcon={getVenueTypeIcon}
    />
  );

  // Venue detail card
  const renderVenueCard = () => {
    if (!selectedVenue) return null;

    return (
      <View style={styles.venueCard}>
        <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedVenue(null)}>
          <Ionicons name="close" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.venueHeader}>
          <View style={[styles.venueIcon, { backgroundColor: getCrowdColor(selectedVenue.crowdLevel) + '20' }]}>
            <Ionicons
              name={getVenueTypeIcon(selectedVenue.type) as any}
              size={24}
              color={getCrowdColor(selectedVenue.crowdLevel)}
            />
          </View>
          <View style={styles.venueHeaderInfo}>
            <Text style={styles.venueName}>{selectedVenue.name}</Text>
            <Text style={styles.venueAddress}>{selectedVenue.address}</Text>
          </View>
        </View>

        <View style={styles.venueTags}>
          {selectedVenue.safetyRating && (
            <View style={styles.venueTag}>
              <Ionicons name="star" size={14} color={Colors.caution} />
              <Text style={styles.venueTagText}>{selectedVenue.safetyRating.toFixed(1)} Safety</Text>
            </View>
          )}
          <View style={[styles.venueTag, { backgroundColor: getCrowdColor(selectedVenue.crowdLevel) + '20' }]}>
            <Ionicons name="people" size={14} color={getCrowdColor(selectedVenue.crowdLevel)} />
            <Text style={[styles.venueTagText, { color: getCrowdColor(selectedVenue.crowdLevel) }]}>
              {selectedVenue.crowdLevel ? selectedVenue.crowdLevel.charAt(0).toUpperCase() + selectedVenue.crowdLevel.slice(1) : 'Unknown'} Crowd
            </Text>
          </View>
          {selectedVenue.womenOwned && (
            <View style={[styles.venueTag, { backgroundColor: Colors.secondary + '20' }]}>
              <Ionicons name="heart" size={14} color={Colors.secondary} />
              <Text style={[styles.venueTagText, { color: Colors.secondary }]}>Women-Owned</Text>
            </View>
          )}
          {selectedVenue.hasSecurityStaff && (
            <View style={[styles.venueTag, { backgroundColor: Colors.safe + '20' }]}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.safe} />
              <Text style={[styles.venueTagText, { color: Colors.safe }]}>Security</Text>
            </View>
          )}
        </View>

        <View style={styles.venueActions}>
          <TouchableOpacity
            style={styles.venueActionButton}
            onPress={() => {
              if (!selectedVenue) return;
              const query = encodeURIComponent(`${selectedVenue.name}, ${selectedVenue.address}`);
              const url = Platform.select({
                ios: `maps:0,0?q=${query}`,
                android: `geo:0,0?q=${query}`,
                web: `https://www.google.com/maps/search/?api=1&query=${query}`
              });
              Linking.openURL(url || '');
            }}
          >
            <Ionicons name="navigate" size={20} color={Colors.white} />
            <Text style={styles.venueActionText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.venueActionButton, styles.venueActionSecondary]}
            onPress={() => selectedVenue && handleAddToPlan(selectedVenue)}
          >
            <Ionicons name="add-circle" size={20} color={Colors.primary} />
            <Text style={[styles.venueActionText, { color: Colors.primary }]}>Add to Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Venue list for all platforms
  const renderVenueList = () => (
    <ScrollView style={styles.venueList} showsVerticalScrollIndicator={false}>
      <View style={styles.listHeader}>
        <Ionicons name="map" size={48} color={Colors.primary} />
        <Text style={styles.listHeaderTitle}>Nearby Venues</Text>
        <Text style={styles.listHeaderSubtitle}>
          {filteredVenues.length} venues found
        </Text>
      </View>

      {filteredVenues.map((venue: Venue) => (
        <TouchableOpacity
          key={venue.id}
          style={[
            styles.venueListItem,
            selectedVenue?.id === venue.id && styles.venueListItemSelected,
          ]}
          onPress={() => setSelectedVenue(venue)}
        >
          <View style={[styles.venueListIcon, { backgroundColor: getCrowdColor(venue.crowdLevel) + '20' }]}>
            <Ionicons
              name={getVenueTypeIcon(venue.type) as any}
              size={24}
              color={getCrowdColor(venue.crowdLevel)}
            />
          </View>
          <View style={styles.venueListInfo}>
            <Text style={styles.venueListName}>{venue.name}</Text>
            <Text style={styles.venueListAddress}>{venue.address}</Text>
            <View style={styles.venueListTags}>
              {venue.safetyRating && (
                <View style={styles.venueListTag}>
                  <Ionicons name="star" size={10} color={Colors.caution} />
                  <Text style={styles.venueListTagText}>{venue.safetyRating.toFixed(1)}</Text>
                </View>
              )}
              <View style={[styles.venueListTag, { backgroundColor: getCrowdColor(venue.crowdLevel) + '20' }]}>
                <Text style={[styles.venueListTagText, { color: getCrowdColor(venue.crowdLevel) }]}>
                  {venue.crowdLevel ? venue.crowdLevel.charAt(0).toUpperCase() + venue.crowdLevel.slice(1) : 'Unknown'}
                </Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Nearby Venues</Text>
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        >
          <Ionicons name={viewMode === 'list' ? 'map' : 'list'} size={20} color={Colors.primary} />
          <Text style={styles.viewToggleText}>{viewMode === 'list' ? 'Map' : 'List'}</Text>
        </TouchableOpacity>
      </View>

      {renderFilters()}

      {viewMode === 'list' ? renderVenueList() : renderMap()}
      {renderVenueCard()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  viewToggleText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  venueList: {
    flex: 1,
  },
  listHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  listHeaderTitle: {
    color: Colors.text,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    marginTop: Spacing.md,
  },
  listHeaderSubtitle: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
  },
  venueListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  venueListItemSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  venueListIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueListInfo: {
    flex: 1,
  },
  venueListName: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  venueListAddress: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginTop: 2,
  },
  venueListTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  venueListTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  venueListTagText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  venueCard: {
    position: 'absolute',
    bottom: 20,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 1,
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  venueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueHeaderInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  venueName: {
    color: Colors.text,
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
  },
  venueAddress: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    marginTop: 2,
  },
  venueTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  venueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  venueTagText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  venueActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  venueActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  venueActionSecondary: {
    backgroundColor: Colors.primary + '20',
  },
  venueActionText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  bottomPadding: {
    height: 100,
  },
  filtersContainer: {
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  filters: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  filterTextActive: {
    color: Colors.white,
  },
});
