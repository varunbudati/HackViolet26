import { create } from 'zustand';
import { RideRequest, SocialPost, RideRequestType } from '../types';
import * as ridesApi from '../services/api/rides';

interface SocialState {
  posts: SocialPost[];
  rideRequests: RideRequest[];
  isLoading: boolean;
  error: string | null;

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
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Demo data for social feed
const DEMO_RIDE_REQUESTS: RideRequest[] = [
  {
    id: 'demo-ride-1',
    userId: 'user-1',
    userDisplayName: 'Sarah M.',
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
    type: 'need_ride',
    fromLocation: 'TOTS',
    toLocation: 'The Edge Apartments',
    departureTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    status: 'open',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
  },
];

const DEMO_POSTS: SocialPost[] = [
  {
    id: 'demo-post-1',
    userId: 'user-4',
    userDisplayName: 'Amanda R.',
    type: 'safety_tip',
    content:
      'Pro tip: Always share your location with a friend before heading out! The SafeNight app makes this super easy.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'demo-post-2',
    userId: 'user-5',
    userDisplayName: 'Rachel T.',
    type: 'venue_review',
    content:
      'Sharkey\'s on N Main St has great security and well-lit parking. Felt very safe there last night!',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
];

export const useSocialStore = create<SocialState>((set, get) => ({
  posts: [],
  rideRequests: [],
  isLoading: false,
  error: null,

  // Load rides from API
  loadRides: async () => {
    set({ isLoading: true });
    try {
      const rides = await ridesApi.getOpenRideRequests();
      set({ rideRequests: rides, isLoading: false });
    } catch (error) {
      console.error('Failed to load rides:', error);
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
}));
