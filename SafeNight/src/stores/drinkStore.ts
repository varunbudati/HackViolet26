import { create } from 'zustand';
import { Drink, BACEstimate, AlcoholType } from '../types';
import { parseDrink } from '../services/api/gemini';
import {
  getFullBACEstimate,
  formatBAC,
  formatTimeToSober,
  STANDARD_DRINKS,
} from '../utils/bac-calculator';

interface DrinkState {
  drinks: Drink[];
  currentBAC: BACEstimate | null;
  isLoading: boolean;
  error: string | null;

  // User profile for BAC calculation
  userWeight: number;
  userGender: 'female' | 'other';

  // Actions
  setUserProfile: (weight: number, gender: 'female' | 'other') => void;
  logDrinkFromText: (description: string, userId: string, planId?: string) => Promise<Drink>;
  logDrink: (drink: Omit<Drink, 'id' | 'loggedAt'>) => void;
  removeDrink: (drinkId: string) => void;
  clearDrinks: () => void;
  recalculateBAC: () => void;
  getDrinksForPlan: (planId: string) => Drink[];
  getTodaysDrinks: () => Drink[];
  clearError: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useDrinkStore = create<DrinkState>((set, get) => ({
  drinks: [],
  currentBAC: null,
  isLoading: false,
  error: null,
  userWeight: 140, // Default weight in lbs
  userGender: 'female',

  setUserProfile: (weight, gender) => {
    set({ userWeight: weight, userGender: gender });
    get().recalculateBAC();
  },

  logDrinkFromText: async (description, userId, planId) => {
    set({ isLoading: true, error: null });

    try {
      const parsed = await parseDrink(description);

      const drink: Drink = {
        id: generateId(),
        userId,
        planId,
        name: parsed.name,
        alcoholType: parsed.alcoholType,
        estimatedOz: parsed.estimatedOz,
        estimatedABV: parsed.estimatedABV,
        loggedAt: new Date(),
      };

      set((state) => ({
        drinks: [...state.drinks, drink],
        isLoading: false,
      }));

      // Recalculate BAC
      get().recalculateBAC();

      return drink;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to log drink',
        isLoading: false,
      });
      throw error;
    }
  },

  logDrink: (drinkData) => {
    const drink: Drink = {
      ...drinkData,
      id: generateId(),
      loggedAt: new Date(),
    };

    set((state) => ({
      drinks: [...state.drinks, drink],
    }));

    get().recalculateBAC();
  },

  removeDrink: (drinkId) => {
    set((state) => ({
      drinks: state.drinks.filter((d) => d.id !== drinkId),
    }));
    get().recalculateBAC();
  },

  clearDrinks: () => {
    set({ drinks: [], currentBAC: null });
  },

  recalculateBAC: () => {
    const { drinks, userWeight, userGender } = get();

    // Only include drinks from the last 12 hours
    const recentDrinks = drinks.filter((d) => {
      const hoursSince =
        (Date.now() - new Date(d.loggedAt).getTime()) / (1000 * 60 * 60);
      return hoursSince < 12;
    });

    if (recentDrinks.length === 0) {
      set({ currentBAC: null });
      return;
    }

    const bacEstimate = getFullBACEstimate({
      drinks: recentDrinks,
      weightLbs: userWeight,
      gender: userGender,
    });

    set({ currentBAC: bacEstimate });
  },

  getDrinksForPlan: (planId) => {
    return get().drinks.filter((d) => d.planId === planId);
  },

  getTodaysDrinks: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return get().drinks.filter((d) => {
      const drinkDate = new Date(d.loggedAt);
      drinkDate.setHours(0, 0, 0, 0);
      return drinkDate.getTime() === today.getTime();
    });
  },

  clearError: () => set({ error: null }),
}));

// Quick drink logging helpers
export const quickLogDrink = (
  type: keyof typeof STANDARD_DRINKS,
  userId: string,
  planId?: string
): Drink => {
  const standard = STANDARD_DRINKS[type];
  const drink: Drink = {
    id: Math.random().toString(36).substring(2, 15),
    userId,
    planId,
    name: type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1'),
    alcoholType: getAlcoholType(type),
    estimatedOz: standard.oz,
    estimatedABV: standard.abv,
    loggedAt: new Date(),
  };

  return drink;
};

function getAlcoholType(type: keyof typeof STANDARD_DRINKS): AlcoholType {
  const beerTypes = ['beer', 'lightBeer', 'ipa'];
  const wineTypes = ['wine', 'champagne'];
  const shotTypes = ['shot'];
  const cocktailTypes = ['cocktail', 'margarita', 'longIsland', 'martini'];

  if (beerTypes.includes(type)) return 'beer';
  if (wineTypes.includes(type)) return 'wine';
  if (shotTypes.includes(type)) return 'shot';
  if (cocktailTypes.includes(type)) return 'cocktail';
  return 'other';
}
