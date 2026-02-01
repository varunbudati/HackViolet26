// MapView.ts - Default stub (for type definitions)
// Metro will automatically resolve to:
// - MapView.native.tsx for iOS/Android
// - MapView.web.tsx for web (via MapView.web.ts)

import { Venue } from '../../types';
import React from 'react';

export interface PlatformMapProps {
    venues: Venue[];
    selectedVenueId?: string;
    onVenueSelect: (venue: Venue) => void;
    getCrowdColor: (level?: Venue['crowdLevel']) => string;
    getVenueTypeIcon: (type: Venue['type']) => string;
}

// This should never be used - Metro should resolve to platform files
// If you see this, the platform resolution isn't working
export const PlatformMap: React.FC<PlatformMapProps> = ({ venues }) => {
    console.warn('MapView.ts stub was used instead of platform-specific file');
    return null;
};
