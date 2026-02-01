import { create } from 'zustand';
import { RideRequest, SocialPost, RideRequestType } from '../types';
import * as ridesApi from '../services/api/rides';

interface SocialState {
  posts: SocialPost[];
  rideRequests: RideRequest[];
  isLoading: boolean;
  error: string | null;
  isSimulating: boolean;

  // Actions
  loadRides: () => Promise<void>;
  createRideRequest: (
    userId: string,
    displayName: string,
    type: RideRequestType,
    fromLocation: string,
    toLocation: string,
    departureTime: Date,
    maxPassengers?: number
  ) => Promise<RideRequest>;
  cancelRideRequest: (requestId: string) => Promise<void>;
  matchRideRequest: (requestId: string, matchedUserId: string) => Promise<void>;
  completeRide: (requestId: string) => Promise<void>;
  getOpenRideRequests: () => RideRequest[];
  getUserRideRequests: (userId: string) => RideRequest[];
  createPost: (post: Omit<SocialPost, 'id' | 'createdAt'>) => SocialPost;
  deletePost: (postId: string) => void;
  clearError: () => void;
  loadDemoData: () => void;
  clearAllData: () => void;
  // Live simulation
  startSimulation: () => void;
  stopSimulation: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// ============ RANDOM DATA POOLS ============
const RANDOM_NAMES = [
  'Emma S.', 'Sophia L.', 'Olivia M.', 'Ava K.', 'Isabella R.',
  'Mia T.', 'Charlotte W.', 'Amelia B.', 'Harper G.', 'Evelyn P.',
  'Abigail H.', 'Emily F.', 'Elizabeth C.', 'Sofia D.', 'Avery N.',
  'Ella J.', 'Scarlett V.', 'Grace Z.', 'Chloe A.', 'Victoria Q.',
  'Riley X.', 'Aria Y.', 'Lily U.', 'Aubrey I.', 'Zoey O.',
];

const BLACKSBURG_LOCATIONS = [
  'Downtown Blacksburg', 'Virginia Tech Campus', 'TOTS', 'Sharkey\'s',
  'The Cellar', 'Hokie House', 'The Milk Parlor', 'Bull & Bones',
  'Champs Sportsbar', 'Cabo Fish Taco', 'Gillie\'s', 'PK\'s',
];

const APARTMENT_LOCATIONS = [
  'Foxridge Apartments', 'The Edge Apartments', 'University Terrace',
  'Pheasant Run', 'Collegiate Suites', 'Terrace View', 'Oak Manor',
  'University Mall Apts', 'Windsor Hills', 'Maple Ridge',
];

const SAFETY_TIPS = [
  'Always share your location with a friend before heading out! 📍',
  'Remember to drink water between alcoholic drinks 💧',
  'Use the buddy system - never walk home alone at night! 👯‍♀️',
  'Trust your instincts - if something feels off, leave immediately 🚨',
  'Have your phone fully charged before going out 🔋',
  'Know your limits and track your drinks with SafeNight 📊',
  'Always keep an eye on your drink! Never leave it unattended 👀',
  'Set a check-in reminder with your friends throughout the night ⏰',
  'Download the Hokie Ready app for campus safety alerts 📱',
  'Blacksburg Transit runs late on weekends - save the schedule! 🚌',
];

const VENUE_REVIEWS = [
  'Great security and well-lit parking. Felt very safe! ⭐',
  'The bartenders here are amazing - they actually watch out for customers 💜',
  'Love that they have free water cups! Staying hydrated is key 💧',
  'Women-owned and the vibes are immaculate! Highly recommend 🎶',
  'Security was super responsive when someone was being creepy. 10/10 👏',
  'Clean bathrooms and good lighting - the little things matter! ✨',
  'Staff checked in on me when I was alone - felt so safe 💕',
  'They have a safe word program if you feel uncomfortable! 🙌',
];

const GENERAL_POSTS = [
  'Who else is going out tonight? Looking for people to meet up with! 🎉',
  'Just used the drink tracker and it actually helped me pace myself! 🍸',
  'This app is amazing - found a ride home in 2 minutes 🚗',
  'Pro tip: The back patio at Bull & Bones is the best on warm nights 🌙',
  'Anyone else doing a safety check-in? Text me if you need a buddy! 💪',
  'Friday night plans: Sharkey\'s then TOTS - who\'s in? 🙋‍♀️',
];

// Simulation interval ID
let simulationIntervalId: ReturnType<typeof setInterval> | null = null;

// Helper to get random item from array
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Get a random profile picture URL (using randomuser.me portraits)
const getRandomAvatar = (): string => {
  // Using randomuser.me - provides realistic female portraits
  const index = Math.floor(Math.random() * 99) + 1; // 1-99
  return `https://randomuser.me/api/portraits/women/${index}.jpg`;
};

// Generate random ride request with profile picture
const generateRandomRide = (): RideRequest => {
  const isOffer = Math.random() > 0.5;
  const fromBar = Math.random() > 0.3;

  return {
    id: generateId(),
    userId: `sim-user-${generateId()}`,
    userDisplayName: getRandom(RANDOM_NAMES),
    userProfilePicture: getRandomAvatar(),
    type: isOffer ? 'offer_ride' : 'need_ride',
    fromLocation: fromBar ? getRandom(BLACKSBURG_LOCATIONS) : getRandom(APARTMENT_LOCATIONS),
    toLocation: fromBar ? getRandom(APARTMENT_LOCATIONS) : getRandom(BLACKSBURG_LOCATIONS),
    departureTime: new Date(Date.now() + Math.floor(Math.random() * 3 * 60 * 60 * 1000)),
    maxPassengers: isOffer ? Math.floor(Math.random() * 3) + 2 : undefined,
    status: 'open',
    createdAt: new Date(),
  };
};

// Generate random post with profile picture
const generateRandomPost = (): SocialPost => {
  const type = Math.random();
  let content: string;
  let postType: 'safety_tip' | 'venue_review';

  if (type < 0.5) {
    content = getRandom(SAFETY_TIPS);
    postType = 'safety_tip';
  } else {
    const venue = getRandom(BLACKSBURG_LOCATIONS);
    content = `${venue}: ${getRandom(VENUE_REVIEWS)}`;
    postType = 'venue_review';
  }

  return {
    id: generateId(),
    userId: `sim-user-${generateId()}`,
    userDisplayName: getRandom(RANDOM_NAMES),
    userProfilePicture: getRandomAvatar(),
    type: postType,
    content,
    createdAt: new Date(),
  };
};

// Demo data for social feed - more realistic Blacksburg data
const DEMO_RIDE_REQUESTS: RideRequest[] = [
  {
    id: 'demo-ride-1',
    userId: 'user-1',
    userDisplayName: 'Sarah M.',
    userProfilePicture: 'https://randomuser.me/api/portraits/women/1.jpg',
    type: 'need_ride',
    fromLocation: 'Downtown Blacksburg',
    toLocation: 'Foxridge Apartments',
    departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    status: 'open',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'demo-ride-2',
    userId: 'user-2',
    userDisplayName: 'Emily K.',
    userProfilePicture: 'https://randomuser.me/api/portraits/women/2.jpg',
    type: 'offer_ride',
    fromLocation: 'Virginia Tech Campus',
    toLocation: 'N Main St Bars',
    departureTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
    maxPassengers: 3,
    status: 'open',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: 'demo-ride-3',
    userId: 'user-3',
    userDisplayName: 'Jessica L.',
    userProfilePicture: 'https://randomuser.me/api/portraits/women/3.jpg',
    type: 'need_ride',
    fromLocation: 'TOTS',
    toLocation: 'The Edge Apartments',
    departureTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    status: 'open',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: 'demo-ride-4',
    userId: 'user-6',
    userDisplayName: 'Madison W.',
    userProfilePicture: 'https://randomuser.me/api/portraits/women/4.jpg',
    type: 'offer_ride',
    fromLocation: 'Sharkey\'s',
    toLocation: 'Pheasant Run',
    departureTime: new Date(Date.now() + 45 * 60 * 1000),
    maxPassengers: 2,
    status: 'open',
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: 'demo-ride-5',
    userId: 'user-7',
    userDisplayName: 'Olivia P.',
    userProfilePicture: 'https://randomuser.me/api/portraits/women/5.jpg',
    type: 'need_ride',
    fromLocation: 'The Cellar',
    toLocation: 'University Terrace',
    departureTime: new Date(Date.now() + 90 * 60 * 1000),
    status: 'open',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 'demo-ride-6',
    userId: 'user-8',
    userDisplayName: 'Hannah B.',
    userProfilePicture: 'https://randomuser.me/api/portraits/women/6.jpg',
    type: 'offer_ride',
    fromLocation: 'Hokie House',
    toLocation: 'Collegiate Suites',
    departureTime: new Date(Date.now() + 30 * 60 * 1000),
    maxPassengers: 4,
    status: 'open',
    createdAt: new Date(Date.now() - 8 * 60 * 1000),
  },
];

const DEMO_POSTS: SocialPost[] = [
  {
    id: 'demo-post-1',
    userId: 'user-4',
    userDisplayName: 'Amanda R.',
    userProfilePicture: 'https://randomuser.me/api/portraits/women/10.jpg',
    type: 'safety_tip',
    content:
      'Pro tip: Always share your location with a friend before heading out! The SafeNight app makes this super easy.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'demo-post-2',
    userId: 'user-5',
    userDisplayName: 'Rachel T.',
    userProfilePicture: 'https://randomuser.me/api/portraits/women/11.jpg',
    type: 'venue_review',
    content:
      'Sharkey\'s on N Main St has great security and well-lit parking. Felt very safe there last night!',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: 'demo-post-3',
    userId: 'user-9',
    userDisplayName: 'Megan S.',
    userProfilePicture: 'https://randomuser.me/api/portraits/women/12.jpg',
    type: 'safety_tip',
    content:
      'The Milk Parlor is women-owned and has such a great vibe! Highly recommend for a chill night out. 🎶',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: 'demo-post-4',
    userId: 'user-10',
    userDisplayName: 'Taylor M.',
    userProfilePicture: 'https://randomuser.me/api/portraits/women/13.jpg',
    type: 'venue_review',
    content:
      'TOTS was packed tonight but security was on point. Felt safe even in the crowd!',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'demo-post-5',
    userId: 'user-11',
    userDisplayName: 'Chloe R.',
    userProfilePicture: 'https://randomuser.me/api/portraits/women/14.jpg',
    type: 'safety_tip',
    content:
      'Remember to track your drinks with the app! Knowing your BAC helps you make smart decisions. 🍷',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
];

export const useSocialStore = create<SocialState>((set, get) => ({
  // Auto-load demo data on initialization
  posts: DEMO_POSTS,
  rideRequests: DEMO_RIDE_REQUESTS,
  isLoading: false,
  error: null,
  isSimulating: false,

  // Load rides from API (preserves demo data if API returns empty)
  loadRides: async () => {
    set({ isLoading: true });
    try {
      const rides = await ridesApi.getOpenRideRequests();
      // Only update if we got actual data from the API
      // Otherwise keep the existing demo/simulated data
      if (rides.length > 0) {
        set({ rideRequests: rides, isLoading: false });
      } else {
        // API returned empty, keep existing data (demo mode)
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load rides:', error);
      // On error, keep existing demo data
      set({ isLoading: false });
    }
  },

  createRideRequest: async (
    userId,
    displayName,
    type,
    fromLocation,
    toLocation,
    departureTime,
    maxPassengers
  ) => {
    // Create via API
    const request = await ridesApi.createRideRequest(
      userId,
      displayName,
      type,
      fromLocation,
      toLocation,
      departureTime,
      maxPassengers
    );

    // Also create a social post for the ride request (local only for now)
    const post: SocialPost = {
      id: generateId(),
      userId,
      userDisplayName: displayName,
      type: 'ride_request',
      content:
        type === 'need_ride'
          ? `Looking for a ride from ${fromLocation} to ${toLocation}`
          : `Offering a ride from ${fromLocation} to ${toLocation}`,
      rideRequest: request,
      createdAt: new Date(),
    };

    set((state) => ({
      rideRequests: [request, ...state.rideRequests],
      posts: [post, ...state.posts],
    }));

    return request;
  },

  cancelRideRequest: async (requestId) => {
    await ridesApi.cancelRideRequestApi(requestId);
    set((state) => ({
      rideRequests: state.rideRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'cancelled' } : r
      ),
    }));
  },

  matchRideRequest: async (requestId, matchedUserId) => {
    await ridesApi.matchRideRequestApi(requestId, matchedUserId);
    set((state) => ({
      rideRequests: state.rideRequests.map((r) =>
        r.id === requestId
          ? { ...r, status: 'matched', matchedWith: matchedUserId }
          : r
      ),
    }));
  },

  completeRide: async (requestId) => {
    await ridesApi.completeRideRequestApi(requestId);
    set((state) => ({
      rideRequests: state.rideRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'completed' } : r
      ),
    }));
  },

  getOpenRideRequests: () => {
    return get().rideRequests.filter((r) => r.status === 'open');
  },

  getUserRideRequests: (userId) => {
    return get().rideRequests.filter((r) => r.userId === userId);
  },

  createPost: (postData) => {
    const post: SocialPost = {
      ...postData,
      id: generateId(),
      createdAt: new Date(),
    };

    set((state) => ({
      posts: [post, ...state.posts],
    }));

    return post;
  },

  deletePost: (postId) => {
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
    }));
  },

  clearError: () => set({ error: null }),

  // Load demo data (only for demo mode)
  loadDemoData: () => {
    set({
      posts: DEMO_POSTS,
      rideRequests: DEMO_RIDE_REQUESTS,
    });
  },

  // Clear all data (when switching from demo to real account)
  clearAllData: () => {
    set({
      posts: [],
      rideRequests: [],
    });
  },

  // Start live simulation - adds random content every few seconds
  startSimulation: () => {
    if (simulationIntervalId) return; // Already running

    set({ isSimulating: true });

    // Add new content every 5-10 seconds
    simulationIntervalId = setInterval(() => {
      const action = Math.random();

      if (action < 0.4) {
        // Add a new ride request
        const newRide = generateRandomRide();
        set((state) => ({
          rideRequests: [newRide, ...state.rideRequests].slice(0, 15), // Keep max 15
        }));
        console.log(`🚗 New ride: ${newRide.userDisplayName} - ${newRide.type}`);
      } else {
        // Add a new post
        const newPost = generateRandomPost();
        set((state) => ({
          posts: [newPost, ...state.posts].slice(0, 20), // Keep max 20
        }));
        console.log(`📝 New post: ${newPost.userDisplayName}`);
      }
    }, 5000 + Math.random() * 5000); // Random 5-10 seconds
  },

  // Stop simulation
  stopSimulation: () => {
    if (simulationIntervalId) {
      clearInterval(simulationIntervalId);
      simulationIntervalId = null;
    }
    set({ isSimulating: false });
  },
}));
