# SafeNight

A women-first mobile safety and social companion app designed for college women to plan nights out safely, track alcohol consumption, receive proactive safety notifications, access SOS features, and connect with trusted women nearby.

## Features

- **Night Planning** - Plan your night out with natural language input, set safety check-in times, and share your itinerary with trusted contacts
- **Drink Tracking & BAC Estimation** - Log drinks via text or voice, real-time BAC calculations using the Widmark formula
- **Interactive Map** - View nearby venues with safety ratings, cover prices, and wait times
- **AI Safety Assistant** - Chat with an AI companion for safety tips, recommendations, and support
- **SOS Emergency System** - Quick-access emergency features with location sharing and immutable event logging
- **Women-Only Social Board** - Connect with verified women for ride shares and group meetups

## Tech Stack

- **Framework:** React Native with Expo
- **Routing:** Expo Router (file-based)
- **Language:** TypeScript
- **State Management:** Zustand
- **Backend:** Firebase (Auth, Firestore)
- **AI:** Google Gemini API
- **Voice:** ElevenLabs API
- **Blockchain:** Solana (SOS event logging)

## Prerequisites

- Node.js v16 or higher
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- (Optional) Xcode for iOS development
- (Optional) Android Studio for Android development

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SafeNight
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```env
   # Gemini AI API
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

   # ElevenLabs Voice API
   EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

   # Firebase Configuration
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## Running the App

```bash
# Start the development server
npm start

# Run on specific platforms
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

After running `npm start`, press:
- `a` to open on Android
- `i` to open on iOS
- `w` to open in web browser

## Demo Mode

The app runs in **demo mode** when API keys are not configured. Demo mode provides mock responses for all API integrations, allowing you to explore the full UI and functionality without external service credentials.

## Project Structure

```
SafeNight/
├── app/                    # Expo Router routes
│   ├── (tabs)/            # Main tab navigation
│   ├── (auth)/            # Authentication screens
│   └── (modals)/          # Modal screens
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Theme and UI primitives
│   │   ├── safety/       # Safety features (SOS, BAC)
│   │   ├── plan/         # Night planning
│   │   └── map/          # Map components
│   ├── services/          # API integrations
│   │   ├── api/          # Gemini, ElevenLabs, Solana
│   │   └── firebase/     # Firebase config & auth
│   ├── stores/            # Zustand state stores
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript definitions
│   └── utils/             # Utility functions
├── assets/                 # Images and fonts
├── app.json               # Expo configuration
├── .env.example           # Environment template
└── package.json           # Dependencies
```

## API Keys Setup

### Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env` as `EXPO_PUBLIC_GEMINI_API_KEY`

### ElevenLabs API
1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Get your API key from the dashboard
3. Add to `.env` as `EXPO_PUBLIC_ELEVENLABS_API_KEY`

### Firebase
1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Get your web app configuration
5. Add all Firebase config values to `.env`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project was built for HackViolet hackathon.
