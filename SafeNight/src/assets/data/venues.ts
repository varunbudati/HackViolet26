import { Venue } from '../../types';

// Demo venues for hackathon - centered around a typical city downtown area
// Using coordinates around San Francisco as an example

export const DEMO_VENUES: Venue[] = [
  {
    id: 'venue-1',
    name: 'Top of the Stairs (TOTS)',
    address: '217 College Ave, Blacksburg, VA',
    latitude: 37.2295,
    longitude: -80.4136,
    type: 'club',
    crowdLevel: 'high',
    safetyRating: 4.2,
    womenOwned: false,
    hasSecurityStaff: true,
  },
  {
    id: 'venue-2',
    name: 'Sharkey\'s Wing & Rib Joint',
    address: '220 N Main St, Blacksburg, VA',
    latitude: 37.2307,
    longitude: -80.4140,
    type: 'bar',
    crowdLevel: 'high',
    safetyRating: 4.5,
    womenOwned: false,
    hasSecurityStaff: true,
  },
  {
    id: 'venue-3',
    name: 'The Cellar',
    address: '302 N Main St, Blacksburg, VA',
    latitude: 37.2314,
    longitude: -80.4141,
    type: 'restaurant',
    crowdLevel: 'low',
    safetyRating: 4.8,
    womenOwned: true,
    hasSecurityStaff: false,
  },
  {
    id: 'venue-4',
    name: 'Hokie House',
    address: '322 N Main St, Blacksburg, VA',
    latitude: 37.2318,
    longitude: -80.4142,
    type: 'bar',
    crowdLevel: 'medium',
    safetyRating: 4.3,
    womenOwned: false,
    hasSecurityStaff: true,
  },
  {
    id: 'venue-5',
    name: 'The Milk Parlor',
    address: '211 Draper Rd NW, Blacksburg, VA',
    latitude: 37.2293,
    longitude: -80.4133,
    type: 'lounge', // Live music venue
    crowdLevel: 'medium',
    safetyRating: 4.6,
    womenOwned: true,
    hasSecurityStaff: true,
  },
  {
    id: 'venue-6',
    name: 'Rivermill Bar & Grill',
    address: '212 Draper Rd NW, Blacksburg, VA',
    latitude: 37.2292,
    longitude: -80.4132,
    type: 'bar',
    crowdLevel: 'low',
    safetyRating: 4.4,
    womenOwned: false,
    hasSecurityStaff: false,
  },
  {
    id: 'venue-7',
    name: 'PK\'s Bar & Grill',
    address: '432 N Main St, Blacksburg, VA',
    latitude: 37.2332,
    longitude: -80.4145,
    type: 'restaurant',
    crowdLevel: 'medium',
    safetyRating: 4.7,
    womenOwned: true,
    hasSecurityStaff: false,
  },
  {
    id: 'venue-8',
    name: 'Champs Sportsbar',
    address: '111 N Main St, Blacksburg, VA',
    latitude: 37.2298,
    longitude: -80.4138,
    type: 'bar',
    crowdLevel: 'medium',
    safetyRating: 4.1,
    womenOwned: false,
    hasSecurityStaff: true,
  },
  {
    id: 'venue-9',
    name: 'The Coop',
    address: '235 N Main St, Blacksburg, VA',
    latitude: 37.2309,
    longitude: -80.4140,
    type: 'restaurant',
    crowdLevel: 'low',
    safetyRating: 4.9,
    womenOwned: true,
    hasSecurityStaff: false,
  },
  {
    id: 'venue-10',
    name: 'Abby\'s Verdant Tower',
    address: '100 N Main St, Blacksburg, VA', // Fictional address for demo
    latitude: 37.2290,
    longitude: -80.4137,
    type: 'lounge',
    crowdLevel: 'low',
    safetyRating: 5.0,
    womenOwned: true,
    hasSecurityStaff: true,
  },
];

// Helper to get crowd level based on time of day
export const getSimulatedCrowdLevel = (
  venue: Venue,
  time: Date = new Date()
): Venue['crowdLevel'] => {
  const hour = time.getHours();

  // Late night (10pm - 2am) - high crowds at clubs
  if (hour >= 22 || hour < 2) {
    if (venue.type === 'club') return 'high';
    if (venue.type === 'bar' || venue.type === 'lounge') return 'medium';
    return 'low';
  }

  // Evening (6pm - 10pm) - medium crowds everywhere
  if (hour >= 18 && hour < 22) {
    if (venue.type === 'restaurant') return 'high';
    return 'medium';
  }

  // Daytime - low crowds
  return 'low';
};

// Get venues sorted by safety rating
export const getVenuesBySafetyRating = (): Venue[] => {
  return [...DEMO_VENUES].sort(
    (a, b) => (b.safetyRating || 0) - (a.safetyRating || 0)
  );
};

// Get women-owned venues
export const getWomenOwnedVenues = (): Venue[] => {
  return DEMO_VENUES.filter((v) => v.womenOwned);
};

// Get venues by type
export const getVenuesByType = (type: Venue['type']): Venue[] => {
  return DEMO_VENUES.filter((v) => v.type === type);
};

// Get venues with security
export const getVenuesWithSecurity = (): Venue[] => {
  return DEMO_VENUES.filter((v) => v.hasSecurityStaff);
};

// Search venues by name
export const searchVenues = (query: string): Venue[] => {
  const lowercaseQuery = query.toLowerCase();
  return DEMO_VENUES.filter(
    (v) =>
      v.name.toLowerCase().includes(lowercaseQuery) ||
      v.address.toLowerCase().includes(lowercaseQuery)
  );
};
