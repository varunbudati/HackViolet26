// User Types
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface UserSettings {
  shareLocation: boolean;
  allowCheckIns: boolean;
  autoEscalate: boolean;
  darkMode: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string; // URL or base64 image data
  weight?: number; // in lbs for BAC calculation
  gender?: 'female' | 'other';
  emergencyContacts: EmergencyContact[];
  sosCodeWord?: string;
  settings: UserSettings;
  createdAt: Date;
}

// Night Plan Types
export interface Venue {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'bar' | 'club' | 'restaurant' | 'lounge' | 'other';
  crowdLevel?: 'low' | 'medium' | 'high';
  safetyRating?: number; // 1-5
  womenOwned?: boolean;
  hasSecurityStaff?: boolean;
}

export interface CheckIn {
  id: string;
  scheduledAt: Date;
  completedAt?: Date;
  status: 'pending' | 'completed' | 'missed';
  autoEscalated?: boolean;
}

export interface NightPlan {
  id: string;
  userId: string;
  title: string;
  departureTime: Date;
  returnTime: Date;
  venues: Venue[];
  transportation: 'rideshare' | 'designated_driver' | 'public_transit' | 'walking';
  checkIns: CheckIn[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

// Drink Tracking Types
export type AlcoholType = 'beer' | 'wine' | 'liquor' | 'cocktail' | 'shot' | 'other';

export interface Drink {
  id: string;
  userId: string;
  planId?: string;
  name: string;
  alcoholType: AlcoholType;
  estimatedOz: number;
  estimatedABV: number; // as decimal, e.g., 0.05 for 5%
  loggedAt: Date;
}

export interface BACEstimate {
  bac: number;
  timeToSober: number; // minutes
  safetyLevel: 'safe' | 'caution' | 'warning' | 'danger';
  recommendation: string;
}

// SOS Types
export type SOSTrigger = 'button' | 'code_word' | 'missed_checkin' | 'auto_escalate';

export interface SOSEvent {
  id: string;
  userId: string;
  trigger: SOSTrigger;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'active' | 'resolved' | 'false_alarm';
  contactsNotified: string[]; // contact IDs
  blockchainHash?: string;
  blockchainSignature?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

// Social Types
export type RideRequestType = 'need_ride' | 'offer_ride';

export interface RideRequest {
  id: string;
  userId: string;
  userDisplayName: string;
  userProfilePicture?: string; // Profile picture URL
  type: RideRequestType;
  fromLocation: string;
  toLocation: string;
  departureTime: Date;
  maxPassengers?: number;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  matchedWith?: string; // user ID
  createdAt: Date;
}

export interface SocialPost {
  id: string;
  userId: string;
  userDisplayName: string;
  userProfilePicture?: string; // Profile picture URL
  type: 'ride_request' | 'safety_tip' | 'venue_review';
  content: string;
  rideRequest?: RideRequest;
  venue?: Venue;
  createdAt: Date;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// API Response Types
export interface GeminiPlanResponse {
  venues: Array<{
    name: string;
    time?: string;
  }>;
  departureTime?: string;
  returnTime?: string;
  transportation?: string;
}

export interface GeminiDrinkResponse {
  name: string;
  alcoholType: AlcoholType;
  estimatedOz: number;
  estimatedABV: number;
}

// Map Types
export interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description?: string;
  type: 'venue' | 'friend' | 'user';
  crowdLevel?: 'low' | 'medium' | 'high';
}
