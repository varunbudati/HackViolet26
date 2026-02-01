import { create } from 'zustand';
import { NightPlan, Venue, CheckIn } from '../types';
import { parseNightPlan } from '../services/api/gemini';

interface PlanState {
  currentPlan: NightPlan | null;
  plans: NightPlan[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createPlanFromText: (input: string, userId: string) => Promise<NightPlan>;
  createPlan: (plan: Omit<NightPlan, 'id' | 'createdAt'>) => void;
  updatePlan: (planId: string, updates: Partial<NightPlan>) => void;
  deletePlan: (planId: string) => void;
  setCurrentPlan: (plan: NightPlan | null) => void;
  addVenue: (planId: string, venue: Venue) => void;
  removeVenue: (planId: string, venueId: string) => void;
  addCheckIn: (planId: string, checkIn: CheckIn) => void;
  completeCheckIn: (planId: string, checkInId: string) => void;
  missCheckIn: (planId: string, checkInId: string) => void;
  completePlan: (planId: string) => void;
  clearError: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const usePlanStore = create<PlanState>((set, get) => ({
  currentPlan: null,
  plans: [],
  isLoading: false,
  error: null,

  createPlanFromText: async (input: string, userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const parsed = await parseNightPlan(input);

      // Convert parsed venues to proper Venue objects
      const venues: Venue[] = parsed.venues.map((v) => ({
        id: generateId(),
        name: v.name,
        address: '', // Would need geocoding in production
        latitude: 0,
        longitude: 0,
        type: 'bar' as const,
      }));

      // Parse times
      const now = new Date();
      let departureTime = now;
      let returnTime = new Date(now.getTime() + 5 * 60 * 60 * 1000); // Default 5 hours later

      if (parsed.departureTime) {
        departureTime = parseTimeString(parsed.departureTime, now);
      }

      if (parsed.returnTime) {
        returnTime = parseTimeString(parsed.returnTime, now);
        // If return time is before departure, assume next day
        if (returnTime <= departureTime) {
          returnTime = new Date(returnTime.getTime() + 24 * 60 * 60 * 1000);
        }
      }

      // Create check-ins every 2 hours
      const checkIns: CheckIn[] = [];
      const planDuration = returnTime.getTime() - departureTime.getTime();
      const checkInInterval = 2 * 60 * 60 * 1000; // 2 hours

      let checkInTime = departureTime.getTime() + checkInInterval;
      while (checkInTime < returnTime.getTime()) {
        checkIns.push({
          id: generateId(),
          scheduledAt: new Date(checkInTime),
          status: 'pending',
        });
        checkInTime += checkInInterval;
      }

      const plan: NightPlan = {
        id: generateId(),
        userId,
        title: `Night out - ${venues.map((v) => v.name).join(', ')}`,
        departureTime,
        returnTime,
        venues,
        transportation:
          (parsed.transportation as NightPlan['transportation']) || 'rideshare',
        checkIns,
        status: 'active',
        createdAt: new Date(),
      };

      set((state) => ({
        plans: [...state.plans, plan],
        currentPlan: plan,
        isLoading: false,
      }));

      return plan;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create plan',
        isLoading: false,
      });
      throw error;
    }
  },

  createPlan: (planData) => {
    const plan: NightPlan = {
      ...planData,
      id: generateId(),
      createdAt: new Date(),
    };

    set((state) => ({
      plans: [...state.plans, plan],
      currentPlan: plan,
    }));
  },

  updatePlan: (planId, updates) => {
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId ? { ...p, ...updates } : p
      ),
      currentPlan:
        state.currentPlan?.id === planId
          ? { ...state.currentPlan, ...updates }
          : state.currentPlan,
    }));
  },

  deletePlan: (planId) => {
    set((state) => ({
      plans: state.plans.filter((p) => p.id !== planId),
      currentPlan:
        state.currentPlan?.id === planId ? null : state.currentPlan,
    }));
  },

  setCurrentPlan: (plan) => {
    set({ currentPlan: plan });
  },

  addVenue: (planId, venue) => {
    console.log(`[PlanStore] Adding venue ${venue.name} (${venue.id}) to plan ${planId}`);
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId ? { ...p, venues: [...p.venues, venue] } : p
      ),
      currentPlan:
        state.currentPlan?.id === planId
          ? { ...state.currentPlan, venues: [...state.currentPlan.venues, venue] }
          : state.currentPlan,
    }));
  },

  removeVenue: (planId, venueId) => {
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId
          ? { ...p, venues: p.venues.filter((v) => v.id !== venueId) }
          : p
      ),
      currentPlan:
        state.currentPlan?.id === planId
          ? {
            ...state.currentPlan,
            venues: state.currentPlan.venues.filter((v) => v.id !== venueId),
          }
          : state.currentPlan,
    }));
  },

  addCheckIn: (planId, checkIn) => {
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId ? { ...p, checkIns: [...p.checkIns, checkIn] } : p
      ),
      currentPlan:
        state.currentPlan?.id === planId
          ? { ...state.currentPlan, checkIns: [...state.currentPlan.checkIns, checkIn] }
          : state.currentPlan,
    }));
  },

  completeCheckIn: (planId, checkInId) => {
    const updateCheckIn = (checkIns: CheckIn[]) =>
      checkIns.map((c) =>
        c.id === checkInId
          ? { ...c, status: 'completed' as const, completedAt: new Date() }
          : c
      );

    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId ? { ...p, checkIns: updateCheckIn(p.checkIns) } : p
      ),
      currentPlan:
        state.currentPlan?.id === planId
          ? { ...state.currentPlan, checkIns: updateCheckIn(state.currentPlan.checkIns) }
          : state.currentPlan,
    }));
  },

  missCheckIn: (planId, checkInId) => {
    const updateCheckIn = (checkIns: CheckIn[]) =>
      checkIns.map((c) =>
        c.id === checkInId ? { ...c, status: 'missed' as const } : c
      );

    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId ? { ...p, checkIns: updateCheckIn(p.checkIns) } : p
      ),
      currentPlan:
        state.currentPlan?.id === planId
          ? { ...state.currentPlan, checkIns: updateCheckIn(state.currentPlan.checkIns) }
          : state.currentPlan,
    }));
  },

  completePlan: (planId) => {
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId ? { ...p, status: 'completed' } : p
      ),
      currentPlan:
        state.currentPlan?.id === planId
          ? { ...state.currentPlan, status: 'completed' }
          : state.currentPlan,
    }));
  },

  clearError: () => set({ error: null }),
}));

// Helper function to parse time strings like "8:00 PM" or "20:00"
function parseTimeString(timeStr: string, baseDate: Date): Date {
  const result = new Date(baseDate);

  // Try to parse "8:00 PM" format
  const match12 = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
  if (match12) {
    let hours = parseInt(match12[1]);
    const minutes = parseInt(match12[2] || '0');
    const isPM = match12[3].toLowerCase() === 'pm';

    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  // Try to parse "20:00" format
  const match24 = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    result.setHours(parseInt(match24[1]), parseInt(match24[2]), 0, 0);
    return result;
  }

  return result;
}
