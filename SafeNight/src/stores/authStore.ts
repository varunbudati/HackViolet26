import { create } from 'zustand';
import { User, EmergencyContact } from '../types';
import * as authService from '../services/api/auth';
import { useSocialStore } from './socialStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  addEmergencyContact: (contact: EmergencyContact) => Promise<void>;
  removeEmergencyContact: (contactId: string) => Promise<void>;
  setSOSCodeWord: (codeWord: string) => Promise<void>;
  clearError: () => void;
  loadDemoUser: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  signUp: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signUp(email, password, displayName);
      set({ user, isAuthenticated: true, isLoading: false });
      // Clear demo data when real user signs up
      useSocialStore.getState().clearAllData();
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create account',
        isLoading: false,
      });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signIn(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
      // Clear demo data when real user signs in
      useSocialStore.getState().clearAllData();
    } catch (error: any) {
      set({
        error: error.message || 'Failed to sign in',
        isLoading: false,
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to sign out',
        isLoading: false,
      });
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return;

    try {
      await authService.updateUserProfile(user.id, updates);
      set({ user: { ...user, ...updates } });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update profile' });
    }
  },

  addEmergencyContact: async (contact: EmergencyContact) => {
    const { user } = get();
    if (!user) return;

    try {
      await authService.addEmergencyContact(user.id, contact);
      set({
        user: {
          ...user,
          emergencyContacts: [...user.emergencyContacts, contact],
        },
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to add contact' });
    }
  },

  removeEmergencyContact: async (contactId: string) => {
    const { user } = get();
    if (!user) return;

    const updatedContacts = user.emergencyContacts.filter(
      (c) => c.id !== contactId
    );

    try {
      await authService.updateUserProfile(user.id, {
        emergencyContacts: updatedContacts,
      });
      set({
        user: {
          ...user,
          emergencyContacts: updatedContacts,
        },
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to remove contact' });
    }
  },

  setSOSCodeWord: async (codeWord: string) => {
    const { user } = get();
    if (!user) return;

    try {
      await authService.updateUserProfile(user.id, { sosCodeWord: codeWord });
      set({
        user: {
          ...user,
          sosCodeWord: codeWord,
        },
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to set code word' });
    }
  },

  clearError: () => set({ error: null }),

  loadDemoUser: () => {
    const demoUser = authService.getDemoUser();
    set({ user: demoUser, isAuthenticated: true, isLoading: false });
    // Load demo data for social feed
    useSocialStore.getState().loadDemoData();
  },
}));
