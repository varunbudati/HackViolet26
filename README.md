# SafeNight

A women-first mobile safety and social companion app designed for college women to plan nights out safely, track alcohol consumption, receive proactive safety notifications, access SOS features, and connect with trusted women nearby.
<img width="590" height="1278" alt="Screenshot 2026-02-01 at 11 16 30 AM" src="https://github.com/user-attachments/assets/b665a629-82fc-47ff-8a66-4f6f411fde50" />
<img width="590" height="1278" alt="Screenshot 2026-02-01 at 11 16 47 AM" src="https://github.com/user-attachments/assets/758d6bbf-010c-4618-a58c-8ed98ed09438" />
<img width="590" height="1278" alt="Screenshot 2026-02-01 at 11 16 57 AM" src="https://github.com/user-attachments/assets/20b3d73e-7825-4333-9ddc-f1a1b8300fdf" />
<img width="590" height="1278" alt="Screenshot 2026-02-01 at 11 17 06 AM" src="https://github.com/user-attachments/assets/0dd2439d-325d-43c9-8203-a227ca7478ec" />
<img width="590" height="1278" alt="Screenshot 2026-02-01 at 11 17 20 AM" src="https://github.com/user-attachments/assets/73d1897d-4b8f-4532-b840-d2eeb54c0b41" />

## Features

- **Night Planning** - Plan your night out with natural language input, set safety check-in times, and share your itinerary with trusted contacts
- **Drink Tracking & BAC Estimation** - Log drinks via text or voice, real-time BAC calculations using the Widmark formula
- **Interactive Map** - View nearby venues with safety ratings, cover prices, and wait times
- **AI Safety Assistant** - Chat with an AI companion for safety tips, recommendations, and support
- **SOS Emergency System** - Quick-access emergency features with location sharing and immutable event logging
- **Women-Only Social Board** - Connect with verified women for ride shares and group meetups
- **Direct Messaging** - Chat privately with other verified women in your area
- **Ride Sharing** - Request or offer rides to/from venues with other users

## Tech Stack

- **Frontend:** React Native with Expo (SDK 54)
- **Backend:** Express.js with TypeScript
- **Database:** Snowflake
- **Routing:** Expo Router (file-based)
- **State Management:** Zustand
- **Authentication:** JWT
- **AI:** Google Gemini API
- **Voice:** ElevenLabs API
- **Blockchain:** Solana (SOS event logging)
- **Maps:** Leaflet (web), react-native-maps (native)

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

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Set up Snowflake database**
   - Create a Snowflake account at [snowflake.com](https://www.snowflake.com/)
   - Run the SQL commands in `backend/schema.sql` to create the database and tables

5. **Set up environment variables**

   Create `SafeNight/.env` for the frontend:
   ```env
   # Backend API URL
   EXPO_PUBLIC_API_URL=http://localhost:3000

   # Gemini AI API
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

   # ElevenLabs Voice API
   EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

   Create `SafeNight/backend/.env` for the backend:
   ```env
   # Server
   PORT=3000
   JWT_SECRET=your_secure_jwt_secret_here

   # Snowflake Configuration
   SNOWFLAKE_ACCOUNT=your_account_identifier
   SNOWFLAKE_USER=your_username
   SNOWFLAKE_PASSWORD=your_password
   SNOWFLAKE_ROLE=your_role
   SNOWFLAKE_WAREHOUSE=your_warehouse
   SNOWFLAKE_DATABASE=SAFENIGHT_DB
   SNOWFLAKE_SCHEMA=APP_DATA
   ```

## Running the App

You need to run both the backend and frontend servers.

**Terminal 1 - Start the backend:**
```bash
cd SafeNight/backend
npm run dev
```

**Terminal 2 - Start the frontend:**
```bash
cd SafeNight
npm start
```

After running `npm start`, press:
- `a` to open on Android
- `i` to open on iOS
- `w` to open in web browser

**Run on specific platforms:**
```bash
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

## Demo Mode

The app runs in **demo mode** when API keys are not configured. Demo mode provides mock responses for all API integrations, allowing you to explore the full UI and functionality without external service credentials.

## Project Structure

```
SafeNight/
├── app/                    # Expo Router routes
│   ├── (tabs)/            # Main tab navigation
│   ├── (auth)/            # Authentication screens
│   └── (modals)/          # Modal screens
├── backend/                # Express.js API server
│   ├── src/
│   │   ├── routes/        # API endpoints (auth, messages, rides, users)
│   │   ├── middleware/    # JWT auth middleware
│   │   └── services/      # Snowflake database service
│   ├── schema.sql         # Snowflake database schema
│   └── package.json       # Backend dependencies
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Theme and UI primitives
│   │   ├── safety/       # Safety features (SOS, BAC)
│   │   ├── plan/         # Night planning
│   │   └── map/          # Map components (Leaflet web, native maps)
│   ├── services/          # API integrations
│   │   └── api/          # Auth, messages, rides, Gemini, ElevenLabs, Solana
│   ├── stores/            # Zustand state stores
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript definitions
│   └── utils/             # Utility functions
├── assets/                 # Images and fonts
├── app.json               # Expo configuration
├── .env                   # Frontend environment variables
└── package.json           # Frontend dependencies
```

## API Keys Setup

### Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `SafeNight/.env` as `EXPO_PUBLIC_GEMINI_API_KEY`

### ElevenLabs API
1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Get your API key from the dashboard
3. Add to `SafeNight/.env` as `EXPO_PUBLIC_ELEVENLABS_API_KEY`

### Snowflake Database
1. Create an account at [Snowflake](https://www.snowflake.com/)
2. Note your account identifier (e.g., `XXXXXXX-YYYYYYY`)
3. Create a warehouse and role with appropriate permissions
4. Run the SQL commands in `backend/schema.sql` to set up the database
5. Add all Snowflake credentials to `SafeNight/backend/.env`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project was built for HackViolet hackathon.
