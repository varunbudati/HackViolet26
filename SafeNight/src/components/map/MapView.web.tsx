import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Venue } from '../../types';
import { Colors, Shadows, BorderRadius, Spacing, Typography } from '../ui/theme';

// Leaflet types only (no runtime import)
type LeafletType = typeof import('leaflet');
type LeafletMap = import('leaflet').Map;
type LeafletMarker = import('leaflet').Marker;

// Inject Leaflet CSS dynamically for web
const injectLeafletCSS = () => {
  if (typeof document !== 'undefined') {
    const existingLink = document.getElementById('leaflet-css');
    if (!existingLink) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }
};

interface PlatformMapProps {
  venues: Venue[];
  selectedVenueId?: string;
  onVenueSelect: (venue: Venue) => void;
  getCrowdColor: (level?: Venue['crowdLevel']) => string;
  getVenueTypeIcon: (type: Venue['type']) => string;
}

// Create custom marker icon based on crowd level
const createMarkerIcon = (L: LeafletType, color: string, isSelected: boolean) => {
  const size = isSelected ? 36 : 28;
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        transition: transform 0.2s;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export const PlatformMap: React.FC<PlatformMapProps> = ({
  venues,
  selectedVenueId,
  onVenueSelect,
  getCrowdColor,
  getVenueTypeIcon,
}) => {
  const [leaflet, setLeaflet] = useState<LeafletType | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<LeafletMarker[]>([]);

  // Calculate bounds from venues
  const lats = venues.map((v) => v.latitude);
  const lngs = venues.map((v) => v.longitude);
  const bounds = {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };

  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;

  // Load Leaflet dynamically (client-side only)
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Inject CSS first
    injectLeafletCSS();

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      setLeaflet(L.default || L);
    });
  }, []);

  // Initialize map once Leaflet is loaded
  useEffect(() => {
    if (!leaflet || !mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = leaflet.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // Add dark-styled tiles (CartoDB Dark Matter)
    leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Fit to venue bounds with padding
    const leafletBounds = leaflet.latLngBounds(
      [bounds.minLat - 0.001, bounds.minLng - 0.001],
      [bounds.maxLat + 0.001, bounds.maxLng + 0.001]
    );
    map.fitBounds(leafletBounds, { padding: [30, 30] });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leaflet]);

  // Update markers when venues or selection changes
  useEffect(() => {
    if (!leaflet || !mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    venues.forEach((venue) => {
      const color = getCrowdColor(venue.crowdLevel);
      const isSelected = selectedVenueId === venue.id;

      const marker = leaflet.marker([venue.latitude, venue.longitude], {
        icon: createMarkerIcon(leaflet, color, isSelected),
      });

      marker.on('click', () => onVenueSelect(venue));
      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [leaflet, venues, selectedVenueId, getCrowdColor, onVenueSelect]);

  // Show a loading/fallback view while Leaflet loads
  if (!leaflet) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingTitle}>🗺️ Loading Map...</Text>
          <Text style={styles.loadingSubtitle}>{venues.length} venues in Blacksburg</Text>
          {/* Show venue markers as visual fallback */}
          <View style={styles.fallbackGrid}>
            {venues.slice(0, 6).map((venue) => (
              <TouchableOpacity
                key={venue.id}
                style={[styles.fallbackVenue, { borderColor: getCrowdColor(venue.crowdLevel) }]}
                onPress={() => onVenueSelect(venue)}
              >
                <Text style={styles.fallbackVenueName}>{venue.name}</Text>
                <View style={[styles.fallbackDot, { backgroundColor: getCrowdColor(venue.crowdLevel) }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  }

  return (
    <View style={styles.container}>
      {/* Leaflet map container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: BorderRadius.xl,
        }}
      />

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
  legend: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    zIndex: 1000,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  loadingTitle: {
    color: Colors.text,
    fontSize: Typography.xl,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  loadingSubtitle: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginBottom: Spacing.lg,
  },
  fallbackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    maxWidth: 400,
  },
  fallbackVenue: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fallbackVenueName: {
    color: Colors.text,
    fontSize: Typography.sm,
  },
  fallbackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
