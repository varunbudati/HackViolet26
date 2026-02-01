import apiClient from './client';
import { RideRequest, RideRequestType } from '../../types';

// In-memory storage for demo mode (when API fails)
const demoRides: RideRequest[] = [];

const generateId = () => Math.random().toString(36).substring(2, 15);

// Check if API is configured
const isApiConfigured = (): boolean => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  return Boolean(apiUrl && apiUrl.length > 0);
};

/**
 * Get all open ride requests
 */
export const getOpenRideRequests = async (): Promise<RideRequest[]> => {
  if (!isApiConfigured()) {
    return demoRides.filter(r => r.status === 'open');
  }

  try {
    const response = await apiClient.get<RideRequest[]>('/api/rides');
    return response.data.map(r => ({
      ...r,
      departureTime: new Date(r.departureTime),
      createdAt: new Date(r.createdAt),
    }));
  } catch (error) {
    console.warn('API unavailable, using local storage for rides:', error);
    return demoRides.filter(r => r.status === 'open');
  }
};

/**
 * Get current user's ride requests
 */
export const getUserRideRequests = async (userId: string): Promise<RideRequest[]> => {
  if (!isApiConfigured()) {
    return demoRides.filter(r => r.userId === userId);
  }

  try {
    const response = await apiClient.get<RideRequest[]>('/api/rides/mine');
    return response.data.map(r => ({
      ...r,
      departureTime: new Date(r.departureTime),
      createdAt: new Date(r.createdAt),
    }));
  } catch (error) {
    console.warn('API unavailable, using local storage for user rides:', error);
    return demoRides.filter(r => r.userId === userId);
  }
};

/**
 * Create a new ride request
 */
export const createRideRequest = async (
  userId: string,
  userDisplayName: string,
  type: RideRequestType,
  fromLocation: string,
  toLocation: string,
  departureTime: Date,
  maxPassengers?: number
): Promise<RideRequest> => {
  const rideData = {
    userDisplayName,
    type,
    fromLocation,
    toLocation,
    departureTime: departureTime.toISOString(),
    maxPassengers,
  };

  if (!isApiConfigured()) {
    const ride: RideRequest = {
      id: generateId(),
      userId,
      userDisplayName,
      type,
      fromLocation,
      toLocation,
      departureTime,
      maxPassengers,
      status: 'open',
      createdAt: new Date(),
    };
    demoRides.unshift(ride);
    return ride;
  }

  try {
    const response = await apiClient.post<RideRequest>('/api/rides', rideData);
    return {
      ...response.data,
      departureTime: new Date(response.data.departureTime),
      createdAt: new Date(response.data.createdAt),
    };
  } catch (error) {
    console.warn('API unavailable, storing ride locally:', error);
    const ride: RideRequest = {
      id: generateId(),
      userId,
      userDisplayName,
      type,
      fromLocation,
      toLocation,
      departureTime,
      maxPassengers,
      status: 'open',
      createdAt: new Date(),
    };
    demoRides.unshift(ride);
    return ride;
  }
};

/**
 * Match with a ride request
 */
export const matchRideRequestApi = async (requestId: string, userId: string): Promise<void> => {
  if (!isApiConfigured()) {
    const ride = demoRides.find(r => r.id === requestId);
    if (ride) {
      ride.status = 'matched';
      ride.matchedWith = userId;
    }
    return;
  }

  try {
    await apiClient.put(`/api/rides/${requestId}/match`);
  } catch (error) {
    console.warn('API unavailable, matching ride locally:', error);
    const ride = demoRides.find(r => r.id === requestId);
    if (ride) {
      ride.status = 'matched';
      ride.matchedWith = userId;
    }
  }
};

/**
 * Cancel a ride request
 */
export const cancelRideRequestApi = async (requestId: string): Promise<void> => {
  if (!isApiConfigured()) {
    const ride = demoRides.find(r => r.id === requestId);
    if (ride) {
      ride.status = 'cancelled';
    }
    return;
  }

  try {
    await apiClient.put(`/api/rides/${requestId}/cancel`);
  } catch (error) {
    console.warn('API unavailable, cancelling ride locally:', error);
    const ride = demoRides.find(r => r.id === requestId);
    if (ride) {
      ride.status = 'cancelled';
    }
  }
};

/**
 * Complete a ride
 */
export const completeRideRequestApi = async (requestId: string): Promise<void> => {
  if (!isApiConfigured()) {
    const ride = demoRides.find(r => r.id === requestId);
    if (ride) {
      ride.status = 'completed';
    }
    return;
  }

  try {
    await apiClient.put(`/api/rides/${requestId}/complete`);
  } catch (error) {
    console.warn('API unavailable, completing ride locally:', error);
    const ride = demoRides.find(r => r.id === requestId);
    if (ride) {
      ride.status = 'completed';
    }
  }
};
