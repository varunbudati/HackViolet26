import { Drink, BACEstimate } from '../types';

/**
 * Calculate Blood Alcohol Content using the Widmark formula
 *
 * BAC = (Alcohol consumed in grams / (Body weight in grams × r)) × 100 - (metabolism rate × hours)
 *
 * Where:
 * - r = 0.55 for females, 0.68 for males (distribution ratio)
 * - metabolism rate = 0.015% per hour
 */

const METABOLISM_RATE = 0.015; // BAC reduction per hour
const ALCOHOL_DENSITY = 0.789; // g/mL
const ML_PER_OZ = 29.5735;
const GRAMS_PER_LB = 453.592;

interface BACCalculatorInput {
  drinks: Drink[];
  weightLbs: number;
  gender: 'female' | 'other';
  currentTime?: Date;
}

/**
 * Get the distribution ratio based on gender
 * Using female distribution ratio for safety-focused calculations
 */
const getDistributionRatio = (gender: 'female' | 'other'): number => {
  // Using female ratio (0.55) for all calculations as this app is designed for women's safety
  return 0.55;
};

/**
 * Calculate alcohol in grams from a drink
 */
export const calculateAlcoholGrams = (drink: Drink): number => {
  // Alcohol grams = volume (oz) × ml/oz × ABV × density (g/ml)
  return drink.estimatedOz * ML_PER_OZ * drink.estimatedABV * ALCOHOL_DENSITY;
};

/**
 * Calculate hours elapsed since drink was logged
 */
const hoursElapsed = (drinkTime: Date, currentTime: Date): number => {
  return (currentTime.getTime() - drinkTime.getTime()) / (1000 * 60 * 60);
};

/**
 * Calculate current BAC from a list of drinks
 */
export const calculateBAC = ({
  drinks,
  weightLbs,
  gender,
  currentTime = new Date(),
}: BACCalculatorInput): number => {
  if (drinks.length === 0) return 0;

  const r = getDistributionRatio(gender);
  const weightGrams = weightLbs * GRAMS_PER_LB;

  let totalBAC = 0;

  for (const drink of drinks) {
    const drinkTime = new Date(drink.loggedAt);
    const hours = hoursElapsed(drinkTime, currentTime);

    if (hours < 0) continue; // Future drink (shouldn't happen)

    const alcoholGrams = calculateAlcoholGrams(drink);

    // BAC from this drink (as percentage)
    const drinkBAC = (alcoholGrams / (weightGrams * r)) * 100;

    // Subtract metabolized amount
    const metabolized = METABOLISM_RATE * hours;
    const remainingBAC = Math.max(0, drinkBAC - metabolized);

    totalBAC += remainingBAC;
  }

  return Math.max(0, totalBAC);
};

/**
 * Estimate time to reach sober (BAC = 0)
 * Returns time in minutes
 */
export const estimateTimeToSober = (currentBAC: number): number => {
  if (currentBAC <= 0) return 0;
  // Time (hours) = BAC / metabolism rate
  const hours = currentBAC / METABOLISM_RATE;
  return Math.ceil(hours * 60); // Convert to minutes
};

/**
 * Estimate time to reach legal limit (0.08%)
 * Returns time in minutes, or 0 if already under limit
 */
export const estimateTimeToLegalLimit = (currentBAC: number): number => {
  const legalLimit = 0.08;
  if (currentBAC <= legalLimit) return 0;

  const bacToMetabolize = currentBAC - legalLimit;
  const hours = bacToMetabolize / METABOLISM_RATE;
  return Math.ceil(hours * 60);
};

/**
 * Get safety level based on BAC
 */
export const getSafetyLevel = (bac: number): BACEstimate['safetyLevel'] => {
  if (bac < 0.04) return 'safe';
  if (bac < 0.08) return 'caution';
  if (bac < 0.12) return 'warning';
  return 'danger';
};

/**
 * Get recommendation based on BAC level
 */
export const getRecommendation = (bac: number): string => {
  const level = getSafetyLevel(bac);

  switch (level) {
    case 'safe':
      return "You're doing great! Stay hydrated and continue to enjoy your evening responsibly.";
    case 'caution':
      return "You're approaching the legal limit. Consider slowing down, drinking water, and make sure you have a safe ride home planned.";
    case 'warning':
      return "You're above the legal limit. Please stop drinking alcohol, drink water, eat food if available, and do NOT drive. Consider texting your emergency contact.";
    case 'danger':
      return "Your BAC is dangerously high. Stop drinking immediately, stay with trusted friends, and seek medical attention if you feel unwell. Do not leave with anyone you don't know well.";
  }
};

/**
 * Get full BAC estimate with all details
 */
export const getFullBACEstimate = (input: BACCalculatorInput): BACEstimate => {
  const bac = calculateBAC(input);

  return {
    bac,
    timeToSober: estimateTimeToSober(bac),
    safetyLevel: getSafetyLevel(bac),
    recommendation: getRecommendation(bac),
  };
};

/**
 * Get BAC level color for UI
 */
export const getBACColor = (bac: number): string => {
  const level = getSafetyLevel(bac);

  switch (level) {
    case 'safe':
      return '#22c55e'; // Green
    case 'caution':
      return '#eab308'; // Yellow
    case 'warning':
      return '#f97316'; // Orange
    case 'danger':
      return '#ef4444'; // Red
  }
};

/**
 * Format BAC for display (e.g., "0.045%")
 */
export const formatBAC = (bac: number): string => {
  return `${bac.toFixed(3)}%`;
};

/**
 * Format time to sober for display
 */
export const formatTimeToSober = (minutes: number): string => {
  if (minutes === 0) return 'Sober';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
};

/**
 * Standard drink reference values
 */
export const STANDARD_DRINKS = {
  beer: { oz: 12, abv: 0.05 },
  lightBeer: { oz: 12, abv: 0.042 },
  ipa: { oz: 12, abv: 0.065 },
  wine: { oz: 5, abv: 0.12 },
  champagne: { oz: 5, abv: 0.12 },
  shot: { oz: 1.5, abv: 0.4 },
  cocktail: { oz: 4, abv: 0.15 },
  margarita: { oz: 6, abv: 0.13 },
  longIsland: { oz: 8, abv: 0.22 },
  martini: { oz: 3, abv: 0.3 },
};
