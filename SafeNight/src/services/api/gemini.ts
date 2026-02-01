import axios from 'axios';
import {
  GeminiPlanResponse,
  GeminiDrinkResponse,
  AlcoholType,
  BACEstimate,
  Drink,
  ChatMessage,
  Venue,
} from '../../types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const isDemoMode = !GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

const getDemoResponse = (prompt: string): string => {
  const p = prompt.toLowerCase();

  // Check for structured JSON responses FIRST (before general topic checks)
  // These prompts expect JSON output, not conversational text
  // Use VERY specific patterns to avoid matching chat assistant prompts

  // Only match parseNightPlan - must have both specific markers
  if (p.includes('parse this night plan') && p.includes('return only this json')) {
    return JSON.stringify({
      venues: [
        { name: 'The Rooftop Bar', time: '8:00 PM' },
        { name: 'Luna Lounge', time: '10:30 PM' },
      ],
      departureTime: '7:30 PM',
      returnTime: '1:00 AM',
      transportation: 'rideshare',
    });
  }

  // Only match parseDrink - must have the specific JSON instruction
  if (p.includes('you are analyzing drinks') && p.includes('only respond with the json')) {
    return JSON.stringify({
      name: 'Margarita',
      alcoholType: 'cocktail',
      estimatedOz: 6,
      estimatedABV: 0.13,
    });
  }

  // Only match matchFriends - must have the specific pattern
  if (p.includes('helping match users for safe group activities') && p.includes('return only a json array')) {
    return JSON.stringify(['match-1', 'match-2', 'match-3']);
  }

  // For chat assistant prompts, extract just the user message for keyword matching
  // The system prompt contains keywords like "venue" and "drink" that would always match
  let textToCheck = p;
  if (p.includes('you are safenight ai') && p.includes('user:')) {
    // Extract just the user message from the chat prompt
    const userIndex = p.lastIndexOf('user:');
    const endIndex = p.lastIndexOf('respond as the helpful safenight assistant');
    if (userIndex !== -1 && endIndex !== -1 && endIndex > userIndex) {
      textToCheck = p.substring(userIndex + 5, endIndex).trim();
    } else if (userIndex !== -1) {
      textToCheck = p.substring(userIndex + 5).trim();
    }
  }

  // General conversational responses (for chat assistant)
  if (textToCheck.includes('venue') || textToCheck.includes('bar') || textToCheck.includes('recommend') || textToCheck.includes('safe nearby') || textToCheck.includes('find me')) {
    return 'Based on your preferences, I recommend checking out The Rooftop Bar on Main Street - it has great reviews for safety, well-lit parking, and a friendly atmosphere. Luna Lounge is also popular among women and has dedicated security staff.';
  }

  if (textToCheck.includes('ride') || textToCheck.includes('uber') || textToCheck.includes('taxi') || textToCheck.includes('wait')) {
    return "When waiting for a ride, stay inside a venue or in a well-lit area. Verify the license plate and driver's name before getting in. Share your trip status with a friend through the SafeNight app.";
  }

  if (textToCheck.includes('scared') || textToCheck.includes('follow') || textToCheck.includes('unsafe') || textToCheck.includes('danger')) {
    return "If you feel unsafe, head to the nearest open business or public area with people. You can use the SOS button on the home screen to alert your contacts instantly. If you are in immediate danger, call 911.";
  }

  if (textToCheck.includes('friend') || textToCheck.includes('group') || textToCheck.includes('alone') || textToCheck.includes('buddy')) {
    return "It's always safer to stay in pairs or groups (buddy system). If you must separate, agree on a meeting spot and time. Use the 'Check-In' feature to keep each other updated.";
  }

  if (textToCheck.includes('water') || textToCheck.includes('hydrat') || textToCheck.includes('sober')) {
    return "Alternating alcoholic drinks with water helps you stay hydrated and pace yourself. Never leave your drink unattended. If you suspect your drink was spiked, seek help immediately.";
  }

  if (textToCheck.includes('bac') || textToCheck.includes('blood alcohol') || textToCheck.includes('how drunk') || textToCheck.includes("what's my")) {
    return "To check your BAC, go to the Drinks tab and log what you've had tonight. I'll calculate your estimated blood alcohol level based on your drinks, weight, and time. Remember, the legal limit is 0.08%.";
  }

  if (textToCheck.includes('drink') || textToCheck.includes('alcohol') || textToCheck.includes('tracking')) {
    return "You can track your drinks in the Drinks tab. Just tap 'Add Drink' and describe what you're having - I'll estimate the alcohol content and keep track of your intake throughout the night.";
  }

  if (textToCheck.includes('safety') || textToCheck.includes('tip') || textToCheck.includes('safe')) {
    return "Stay with your group, keep your phone charged, and share your location with trusted friends. Never leave drinks unattended, and trust your instincts - if something feels off, leave.";
  }

  if (textToCheck.includes('sos') || textToCheck.includes('emergency') || textToCheck.includes('help')) {
    return "The SOS button on the home screen instantly alerts your emergency contacts with your location. You can also shake your phone to trigger it discreetly. For immediate danger, always call 911.";
  }

  if (textToCheck.includes('plan') || textToCheck.includes('evening') || textToCheck.includes('tonight') || textToCheck.includes('going out')) {
    return "I can help you plan your night! Tell me where you want to go and when, and I'll create a timeline with safety check-ins. You can also invite friends to join your plan.";
  }

  return 'I\'m here to help you stay safe tonight! I can help you plan your evening, track drinks, find safe venues, or assist in an emergency. What would you like to know?';
};

const callGemini = async (prompt: string): Promise<string> => {
  if (isDemoMode) {
    // Return demo responses based on prompt content
    return getDemoResponse(prompt);
  }

  try {
    const response = await axios.post<GeminiResponse>(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    return response.data.candidates[0]?.content?.parts[0]?.text || '';
  } catch (error) {
    console.warn('Gemini API error (Rate Limit or Network). Falling back to simulated response.', error);
    // Fallback to demo response so the app doesn't crash during Hackathon
    return getDemoResponse(prompt);
  }
};



export const parseNightPlan = async (input: string): Promise<GeminiPlanResponse> => {
  const prompt = `Parse this night plan for a safety app. User is in Blacksburg, VA.

Input: "${input}"

Return ONLY this JSON (no markdown):
{"venues":[{"name":"venue","time":"8:00 PM"}],"departureTime":"7:30 PM","returnTime":"1:00 AM","transportation":"rideshare"}`;

  const response = await callGemini(prompt);

  try {
    // Clean up the response if it contains markdown code blocks
    const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse plan JSON:', error, response);

    // Try to extract partial data from truncated JSON
    const result: GeminiPlanResponse = { venues: [] };

    // Extract venues using regex
    const venueMatches = response.matchAll(/"name"\s*:\s*"([^"]+)"/g);
    const timeMatches = [...response.matchAll(/"time"\s*:\s*"([^"]+)"/g)];
    let i = 0;
    for (const match of venueMatches) {
      result.venues.push({
        name: match[1],
        time: timeMatches[i]?.[1] || '9:00 PM',
      });
      i++;
    }

    // Extract other fields
    const deptMatch = response.match(/"departureTime"\s*:\s*"([^"]+)"/);
    if (deptMatch) result.departureTime = deptMatch[1];

    const retMatch = response.match(/"returnTime"\s*:\s*"([^"]+)"/);
    if (retMatch) result.returnTime = retMatch[1];

    const transMatch = response.match(/"transportation"\s*:\s*"([^"]+)"/);
    if (transMatch) result.transportation = transMatch[1];

    return result;
  }
};

export const parseDrink = async (description: string): Promise<GeminiDrinkResponse> => {
  const prompt = `You are analyzing drinks for a safety app that tracks alcohol consumption. Please parse this drink description.

Input: "${description}"

Return a JSON object with:
{
  "name": "drink name",
  "alcoholType": "beer|wine|liquor|cocktail|shot|other",
  "estimatedOz": number (fluid ounces of the drink),
  "estimatedABV": number (alcohol by volume as decimal, e.g., 0.05 for 5%)
}

Common references:
- Beer: ~12oz, 5% ABV
- Wine: ~5oz, 12% ABV
- Shot: ~1.5oz, 40% ABV
- Cocktail: ~6oz, 10-15% ABV
- Margarita: ~6oz, 13% ABV
- Long Island: ~8oz, 22% ABV

Only respond with the JSON, no other text.`;

  const response = await callGemini(prompt);

  try {
    return JSON.parse(response);
  } catch {
    // Default fallback
    return {
      name: description,
      alcoholType: 'other',
      estimatedOz: 4,
      estimatedABV: 0.1,
    };
  }
};

export const estimateBAC = async (
  drinks: Drink[],
  weightLbs: number,
  gender: 'female' | 'male' | 'other'
): Promise<BACEstimate> => {
  // Use Widmark formula locally for accuracy
  // BAC = (Alcohol consumed in grams / (Body weight in grams × r)) × 100
  // r = 0.55 for females, 0.68 for males

  const rFactor = gender === 'male' ? 0.68 : 0.55;
  const weightGrams = weightLbs * 453.592;

  // Calculate total alcohol consumed in grams
  let totalAlcoholGrams = 0;
  const now = new Date();

  for (const drink of drinks) {
    const drinkTime = new Date(drink.loggedAt);
    const hoursAgo = (now.getTime() - drinkTime.getTime()) / (1000 * 60 * 60);

    // Alcohol grams = oz × 29.5735 (ml/oz) × ABV × 0.789 (g/ml of alcohol)
    const alcoholGrams = drink.estimatedOz * 29.5735 * drink.estimatedABV * 0.789;

    // Account for metabolism (~0.015% per hour)
    const metabolized = hoursAgo * 0.015;
    const remainingBAC = Math.max(0, (alcoholGrams / (weightGrams * rFactor)) * 100 - metabolized);

    totalAlcoholGrams += remainingBAC;
  }

  const bac = Math.max(0, totalAlcoholGrams);

  // Calculate time to sober (metabolizing at 0.015% per hour)
  const timeToSober = Math.ceil((bac / 0.015) * 60); // in minutes

  let safetyLevel: BACEstimate['safetyLevel'];
  let recommendation: string;

  if (bac < 0.04) {
    safetyLevel = 'safe';
    recommendation = 'You\'re doing great! Stay hydrated and enjoy your evening.';
  } else if (bac < 0.08) {
    safetyLevel = 'caution';
    recommendation = 'You\'re approaching the legal limit. Consider slowing down, drinking water, and making sure you have a safe ride home.';
  } else if (bac < 0.12) {
    safetyLevel = 'warning';
    recommendation = 'You\'re above the legal limit. Please stop drinking, drink water, eat food, and absolutely do not drive. Consider calling your emergency contact.';
  } else {
    safetyLevel = 'danger';
    recommendation = 'Your BAC is dangerously high. Please stop drinking immediately, stay with trusted friends, and consider getting medical attention if you feel unwell.';
  }

  return { bac, timeToSober, safetyLevel, recommendation };
};

export const chatWithAssistant = async (
  message: string,
  history: ChatMessage[],
  context?: { currentVenue?: Venue; currentBAC?: number }
): Promise<string> => {
  const historyText = history
    .slice(-5) // Last 5 messages for context
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const contextInfo = context
    ? `Current context:
- Location: ${context.currentVenue?.name || 'Unknown'}
- BAC Level: ${context.currentBAC?.toFixed(3) || 'Not tracked'}`
    : '';

  const prompt = `You are SafeNight AI, a friendly and helpful safety assistant for women on nights out. You provide:
- Venue recommendations with safety in mind
- Safety tips for going out
- Drink tracking guidance
- Emergency assistance information
- Emotional support and companionship

IMPORTANT RULES:
1. Do NOT use markdown bolding (don't use ** or *) in your response. Plain text only.
2. Keep responses VERY concise and short (under 3 sentences when possible).
3. If no location is specified, ASSUME the user is in Blacksburg, VA (Virginia Tech area).
4. Be warm, supportive, and prioritize the user's safety.

${contextInfo}

Previous conversation:
${historyText}

User: ${message}

Respond as the helpful SafeNight assistant:`;

  return await callGemini(prompt);
};

export const matchFriends = async (
  userPreferences: string,
  potentialMatches: Array<{ id: string; bio: string; interests: string[] }>
): Promise<string[]> => {
  const prompt = `You are helping match users for safe group activities. Based on the user's preferences and the potential matches, return the IDs of the 3 best matches.

User preferences: ${userPreferences}

Potential matches:
${potentialMatches.map((m) => `ID: ${m.id}, Bio: ${m.bio}, Interests: ${m.interests.join(', ')}`).join('\n')}

Return only a JSON array of IDs, e.g., ["id1", "id2", "id3"]`;

  const response = await callGemini(prompt);

  try {
    return JSON.parse(response);
  } catch {
    return potentialMatches.slice(0, 3).map((m) => m.id);
  }
};
