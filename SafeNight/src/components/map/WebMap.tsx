import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Venue } from '../../types';
import { Colors, Shadows, BorderRadius, Spacing, Typography } from '../ui/theme';

interface WebMapProps {
  venues: Venue[];
  selectedVenueId?: string;
  onVenueSelect: (venue: Venue) => void;
  getCrowdColor: (level?: Venue['crowdLevel']) => string;
  getVenueTypeIcon: (type: Venue['type']) => string;
}

// Downtown Blacksburg coordinates
const BLACKSBURG_CENTER = {
  lat: 37.2296,
  lng: -80.4137,
};

// Calculate position on map as percentage
const getPosition = (venue: Venue, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => {
  const padding = 0.15;
  const latRange = bounds.maxLat - bounds.minLat;
  const lngRange = bounds.maxLng - bounds.minLng;
  
  const y = ((bounds.maxLat + latRange * padding - venue.latitude) / (latRange * (1 + 2 * padding))) * 100;
  const x = ((venue.longitude - (bounds.minLng - lngRange * padding)) / (lngRange * (1 + 2 * padding))) * 100;
  
  return { top: `${y}%`, left: `${x}%` };
};

export const WebMap: React.FC<WebMapProps> = ({
  venues,
  selectedVenueId,
  onVenueSelect,
  getCrowdColor,
  getVenueTypeIcon,
}) => {
  // Calculate bounds from venues
  const lats = venues.map(v => v.latitude);
  const lngs = venues.map(v => v.longitude);
  const bounds = {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };

  return (
    <View style={styles.container}>
      {/* Map background using OpenStreetMap static tiles */}
      <iframe
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bounds.minLng - 0.003},${bounds.minLat - 0.002},${bounds.maxLng + 0.003},${bounds.maxLat + 0.002}&layer=mapnik`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          filter: 'brightness(0.3) saturate(0.5) hue-rotate(220deg)',
        }}
      />
      
      {/* Overlay for darkening */}
      <View style={styles.overlay} />

      {/* Venue markers */}
      {venues.map((venue) => {
        const color = getCrowdColor(venue.crowdLevel);
        const size = venue.crowdLevel === 'high' ? 80 : venue.crowdLevel === 'medium' ? 60 : 40;
        const isSelected = selectedVenueId === venue.id;

        return (
          <TouchableOpacity
            key={venue.id}
            style={[
              styles.markerContainer,
              getPosition(venue, bounds) as any,
              isSelected && styles.markerSelected,
            ]}
            onPress={() => onVenueSelect(venue)}
          >
            {/* Heat glow */}
            <View
              style={[
                styles.heatGlow,
                {
                  backgroundColor: color,
                  width: size,
                  height: size,
                  opacity: venue.crowdLevel === 'high' ? 0.4 : 0.2,
                },
              ]}
            />
            {/* Pin */}
            <View style={[styles.pin, { backgroundColor: color }]}>
              <Ionicons name={getVenueTypeIcon(venue.type) as any} size={14} color={Colors.white} />
            </View>
            {/* Women-owned badge */}
            {venue.womenOwned && (
              <View style={styles.womenOwnedBadge}>
                <Ionicons name="heart" size={8} color={Colors.secondary} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.legendText}>High</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.caution }]} />
          <Text style={styles.legendText}>Medium</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.safe }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1025',
    position: 'relative',
    overflow: 'hidden',
    margin: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 16, 37, 0.4)',
    pointerEvents: 'none',
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 10,
  },
  markerSelected: {
    zIndex: 20,
    transform: [{ translateX: -50 }, { translateY: -50 }, { scale: 1.2 }],
  },
  heatGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    zIndex: 2,
    ...Shadows.md,
  },
  womenOwnedBadge: {
    position: 'absolute',
    top: 32,
    right: 32,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    zIndex: 30,
    ...Shadows.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.text,
    fontSize: Typography.xs,
  },
});
