# SafeNight

A women-first mobile safety and social companion app designed for college women to plan nights out safely, track alcohol consumption, receive proactive safety notifications, access SOS features, and connect with trusted women nearby.

## Features

- **Night Plan & Safety Timeline** - Plan your night with natural language input, get reminder notifications, ride suggestions, and friend check-in requests
- **Drink Tracking & BAC Estimation** - Log drinks via text or voice, get real-time BAC estimates, drink pacing suggestions, and time-to-sobriety estimates
- **AI Safety Assistant** - Chat with an AI companion for venue recommendations, safety tips, and real-time questions like "What bars are chill right now?"
- **Interactive Nightlife Map** - View nearby venues with crowd density, friend locations (opt-in), and real-time data. **Cross-platform support** for both Mobile (Native Maps) and Web (Leaflet).
- **SOS Emergency Mode** - Trigger via button or voice code word, notify trusted contacts, share location, and log events immutably
- **Women-Only Social Board** - Connect with verified women for ride shares, find friends nearby, and discover events. Features a **Live Simulation Mode** for demos showing real-time posts, ride offers, and messaging.
- **Smart Check-Ins & Escalation** - Automated safety confirmations, missed check-in detection, and optional escalation to SOS

## Tech Stack

- **Framework**: React Native + Expo
- **Routing**: Expo Router (file-based)
- **Maps**: react-native-maps (Mobile), Leaflet (Web)
- **Language**: TypeScript
- **State Management**: Zustand
- **Backend**: Vultr (hosting, geo-spatial queries)
- **Database**: Snowflake (user profiles, drink history, analytics, AI-powered querying)
- **AI**: Google Gemini API (NLP, drink parsing, chat, recommendations)
- **Voice**: ElevenLabs API (speech-to-text, TTS, SOS code word detection)
- **Blockchain**: Solana (immutable SOS event logging)
- **Venue Data**: LineLeap API (cover prices, wait times)

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

   Edit `.env` and add your API keys (see [API Keys Setup](#api-keys-setup) below).

## Environment Variables

### Mobile App (`SafeNight/.env`)

```env
# Backend API (hosted on Vultr)
# Leave empty for demo mode (no backend required)
EXPO_PUBLIC_API_URL=http://your-vultr-server-ip:3000/api

# Gemini AI API
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# ElevenLabs Voice API
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Backend (`SafeNight/backend/.env`)

```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production

# Snowflake Database
SNOWFLAKE_ACCOUNT=your-account.region
SNOWFLAKE_USER=your-username
SNOWFLAKE_PASSWORD=your-password
SNOWFLAKE_DATABASE=SAFENIGHT_DB
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
```

## Running the App

### Mobile App (Demo Mode)

No backend required - the app works in demo mode without any configuration:

```bash
npm start
```

### Mobile App (With Backend)

1. Start the backend first (see Backend Setup)
2. Set `EXPO_PUBLIC_API_URL` in `.env`
3. Run the mobile app:

```bash
npm start
```

After running `npm start`, press:
- `a` to open on Android
- `i` to open on iOS
- `w` to open in web browser

## Demo Mode

The app runs in **demo mode** when API keys are not configured. Demo mode provides mock responses for all integrations, allowing you to explore the full UI and functionality without external service credentials.

### Live Social Simulation
The demo mode features a **Live Simulation** toggle in the Social tab. When enabled, it:
- Generates realistic ride requests and safety posts from simulated users
- Simulates incoming messages and conversations
- Uses realistic user profiles and locations
This allows for effective demonstration of the app's real-time capabilities without needing a large user base.

## Project Structure

```
SafeNight/
├── app/                    # Expo Router routes
│   ├── (tabs)/            # Main tab navigation
│   │   ├── index.tsx      # Home/Dashboard
│   │   ├── plan.tsx       # Night Plan
│   │   ├── map.tsx        # Venue Map
│   │   ├── social.tsx     # Social Board
│   │   └── profile.tsx    # Settings
│   ├── (auth)/            # Authentication screens
│   └── (modals)/          # Modal screens (SOS, Drink Log, Chat)
├── backend/                # Express.js API server
│   ├── src/
│   │   ├── index.ts       # Server entry point
│   │   ├── routes/        # API routes (auth, users)
│   │   ├── middleware/    # JWT auth middleware
│   │   └── services/      # Snowflake connection
│   ├── schema.sql         # Snowflake database schema
│   └── package.json       # Backend dependencies
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Theme and UI primitives
│   │   ├── safety/       # SOS Button, BAC Meter
│   │   ├── plan/         # Night planning components
│   │   └── map/          # Map components
│   ├── services/          # API integrations
│   │   └── api/          # Auth, Gemini, ElevenLabs, Solana
│   ├── stores/            # Zustand state stores
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript definitions
│   └── utils/             # BAC calculator, helpers
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

### Snowflake (Backend Database)
1. Create an account at [Snowflake](https://www.snowflake.com/)
2. Run the schema in `backend/schema.sql` to create tables
3. Add credentials to `backend/.env`

### Vultr (Backend Hosting)
1. Sign up at [Vultr](https://www.vultr.com/)
2. Deploy a Cloud Compute instance (Ubuntu 24.04, $5/mo)
3. SSH into the server and set up the backend (see Backend Deployment below)

### LineLeap (Venue Data)
1. Contact [LineLeap](https://www.lineleap.com/) for API access
2. Integration provides cover prices and wait times

## Backend Setup

### Local Development

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Snowflake credentials (or leave empty for demo mode)
npm run dev
```

The backend runs in demo mode when Snowflake credentials are not configured.

### Vultr Deployment

1. Deploy a VPS on [Vultr](https://my.vultr.com/) (Ubuntu 24.04, $5/mo plan)
2. SSH into your server:
   ```bash
   ssh root@YOUR_IP
   ```
3. Install Node.js and PM2:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs
   npm install -g pm2
   ```
4. Clone and deploy:
   ```bash
   git clone YOUR_REPO_URL
   cd SafeNight/backend
   npm install
   cp .env.example .env
   # Edit .env with your Snowflake credentials and JWT_SECRET
   pm2 start src/index.ts --name safenight-api
   pm2 save
   ```
5. Your API is now at `http://YOUR_IP:3000/api`
6. Update the mobile app's `.env`:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_IP:3000/api
   ```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create user, return JWT |
| POST | `/api/auth/signin` | Login, return JWT |
| POST | `/api/auth/signout` | Sign out |
| POST | `/api/auth/demo` | Get demo user token |
| GET | `/api/users/:id` | Get user profile |
| PATCH | `/api/users/:id` | Update profile |
| POST | `/api/users/:id/contacts` | Add emergency contact |
| DELETE | `/api/users/:id/contacts/:contactId` | Remove contact |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Built for HackViolet hackathon.
