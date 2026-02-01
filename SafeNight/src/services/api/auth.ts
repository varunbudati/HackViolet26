import apiClient, { setToken, clearToken } from './client';
import { User, EmergencyContact, UserSettings } from '../../types';

const DEFAULT_SETTINGS: UserSettings = {
  shareLocation: true,
  allowCheckIns: true,
  autoEscalate: false,
  darkMode: true,
};

// Demo user for when API is not configured or unavailable
const DEMO_USER: User = {
  id: 'demo-user-123',
  email: 'demo@safenight.app',
  displayName: 'Demo User',
  weight: 140,
  gender: 'female',
  emergencyContacts: [
    {
      id: 'ec-1',
      name: 'Mom',
      phone: '+1234567890',
      relationship: 'mother',
    },
    {
      id: 'ec-2',
      name: 'Best Friend',
      phone: '+1987654321',
      relationship: 'friend',
    },
  ],
  sosCodeWord: 'pineapple',
  settings: DEFAULT_SETTINGS,
  createdAt: new Date(),
};

// Check if we're in demo mode (no API URL configured)
const isDemoMode = !process.env.EXPO_PUBLIC_API_URL;

export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  if (isDemoMode) {
    // Demo mode - return mock user
    return { ...DEMO_USER, email, displayName };
  }

  const response = await apiClient.post('/api/auth/signup', {
    email,
    password,
    displayName,
  });

  await setToken(response.data.token);

  return {
    ...response.data.user,
    createdAt: new Date(response.data.user.createdAt),
  };
};

export const signIn = async (email: string, password: string): Promise<User> => {
  if (isDemoMode) {
    // Demo mode - return mock user
    return { ...DEMO_USER, email };
  }

  const response = await apiClient.post('/api/auth/signin', {
    email,
    password,
  });

  await setToken(response.data.token);

  return {
    ...response.data.user,
    createdAt: new Date(response.data.user.createdAt),
  };
};

export const signOut = async (): Promise<void> => {
  if (isDemoMode) {
    return;
  }

  try {
    await apiClient.post('/api/auth/signout');
  } catch (error) {
    // Ignore signout errors - clear token anyway
  }

  await clearToken();
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<void> => {
  if (isDemoMode) {
    return;
  }

  await apiClient.patch(`/api/users/${userId}`, updates);
};

export const addEmergencyContact = async (
  userId: string,
  contact: EmergencyContact
): Promise<void> => {
  if (isDemoMode) {
    return;
  }

  await apiClient.post(`/api/users/${userId}/contacts`, {
    name: contact.name,
    phone: contact.phone,
    relationship: contact.relationship,
  });
};

export const removeEmergencyContact = async (
  userId: string,
  contactId: string
): Promise<void> => {
  if (isDemoMode) {
    return;
  }

  await apiClient.delete(`/api/users/${userId}/contacts/${contactId}`);
};

export const getDemoUser = (): User => DEMO_USER;
