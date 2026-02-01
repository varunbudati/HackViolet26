import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Venue } from '../../types';
import { Colors, Shadows, BorderRadius, Spacing, Typography } from '../ui/theme';

interface PlatformMapProps {
    venues: Venue[];
    selectedVenueId?: string;
    onVenueSelect: (venue: Venue) => void;
    getCrowdColor: (level?: Venue['crowdLevel']) => string;
    getVenueTypeIcon: (type: Venue['type']) => string;
}

// Downtown Blacksburg, VA coordinates
const BLACKSBURG_REGION = {
    latitude: 37.2296,
    longitude: -80.4137,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008,
};

// Dark map style for night mode
const mapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1a1025' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8B5CF6' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1025' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#251B35' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#352B45' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0F0A1A' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#251B35' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2e1a' }] },
];

// Get heat glow radius based on crowd level
const getHeatGlowRadius = (crowdLevel?: Venue['crowdLevel']): number => {
    switch (crowdLevel) {
        case 'high':
            return 60;
        case 'medium':
            return 45;
        case 'low':
            return 30;
        default:
            return 30;
    }
};

// Get heat glow opacity based on crowd level
const getHeatGlowOpacity = (crowdLevel?: Venue['crowdLevel']): number => {
    switch (crowdLevel) {
        case 'high':
            return 0.4;
        case 'medium':
            return 0.25;
        case 'low':
            return 0.15;
        default:
            return 0.15;
    }
};

export const PlatformMap: React.FC<PlatformMapProps> = ({
    venues,
    selectedVenueId,
    onVenueSelect,
    getCrowdColor,
    getVenueTypeIcon,
}) => {
    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={BLACKSBURG_REGION}
                customMapStyle={mapStyle}
            >
                {/* Heat glow circles for crowd density */}
                {venues.map((venue) => (
                    <Circle
                        key={`heat-${venue.id}`}
                        center={{
                            latitude: venue.latitude,
                            longitude: venue.longitude,
                        }}
                        radius={getHeatGlowRadius(venue.crowdLevel)}
                        fillColor={getCrowdColor(venue.crowdLevel) + Math.round(getHeatGlowOpacity(venue.crowdLevel) * 255).toString(16).padStart(2, '0')}
                        strokeColor="transparent"
                    />
                ))}

                {/* Venue markers */}
                {venues.map((venue) => (
                    <Marker
                        key={venue.id}
                        coordinate={{
                            latitude: venue.latitude,
                            longitude: venue.longitude,
                        }}
                        onPress={() => onVenueSelect(venue)}
                    >
                        <View style={[styles.markerContainer, selectedVenueId === venue.id && styles.markerSelected]}>
                            <View style={[styles.marker, { backgroundColor: getCrowdColor(venue.crowdLevel) }]}>
                                <Ionicons name={getVenueTypeIcon(venue.type) as any} size={16} color={Colors.white} />
                            </View>
                            {venue.womenOwned && (
                                <View style={styles.womenOwnedBadge}>
                                    <Ionicons name="heart" size={8} color={Colors.secondary} />
                                </View>
                            )}
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Legend overlay */}
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
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        alignItems: 'center',
    },
    markerSelected: {
        transform: [{ scale: 1.2 }],
    },
    marker: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
        ...Shadows.md,
    },
    womenOwnedBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
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
