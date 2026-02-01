import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { generateToken } from '../middleware/auth';
import {
  isConnected,
  getUserByEmail,
  createUser,
  getEmergencyContacts,
} from '../services/snowflake';

const router = Router();

// Demo user for when Snowflake is not configured
const DEMO_USER = {
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
  settings: {
    shareLocation: true,
    allowCheckIns: true,
    autoEscalate: false,
    darkMode: true,
  },
  createdAt: new Date().toISOString(),
};

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'Email, password, and displayName are required' });
      return;
    }

    // If Snowflake not connected, return demo user
    if (!isConnected()) {
      const token = generateToken({ userId: DEMO_USER.id, email });
      res.json({
        token,
        user: { ...DEMO_USER, email, displayName },
      });
      return;
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await createUser(userId, email, passwordHash, displayName);

    const token = generateToken({ userId, email });

    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        displayName,
        emergencyContacts: [],
        settings: {
          shareLocation: true,
          allowCheckIns: true,
          autoEscalate: false,
          darkMode: true,
        },
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req: Request, res: Response) => {
  try {
    console.log('Signin request body:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing fields - email:', !!email, 'password:', !!password);
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // If Snowflake not connected, return demo user
    if (!isConnected()) {
      console.log('Snowflake not connected, using demo user');
      const token = generateToken({ userId: DEMO_USER.id, email });
      res.json({
        token,
        user: { ...DEMO_USER, email },
      });
      return;
    }

    // Find user by email
    const user = await getUserByEmail(email);
    console.log('User lookup result:', user ? 'found' : 'not found', 'for email:', email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.PASSWORD_HASH);
    console.log('Password validation:', validPassword ? 'valid' : 'invalid');
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Get emergency contacts
    const contacts = await getEmergencyContacts(user.ID);

    const token = generateToken({ userId: user.ID, email: user.EMAIL });

    res.json({
      token,
      user: {
        id: user.ID,
        email: user.EMAIL,
        displayName: user.DISPLAY_NAME,
        weight: user.WEIGHT,
        gender: user.GENDER,
        sosCodeWord: user.SOS_CODE_WORD,
        emergencyContacts: contacts.map((c) => ({
          id: c.ID,
          name: c.NAME,
          phone: c.PHONE,
          relationship: c.RELATIONSHIP,
        })),
        settings: user.SETTINGS || {
          shareLocation: true,
          allowCheckIns: true,
          autoEscalate: false,
          darkMode: true,
        },
        createdAt: user.CREATED_AT,
      },
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// POST /api/auth/signout
router.post('/signout', (req: Request, res: Response) => {
  // JWT tokens are stateless, so signout is handled client-side
  // This endpoint exists for API consistency
  res.json({ message: 'Signed out successfully' });
});

// POST /api/auth/demo
router.post('/demo', (req: Request, res: Response) => {
  const token = generateToken({ userId: DEMO_USER.id, email: DEMO_USER.email });
  res.json({
    token,
    user: DEMO_USER,
  });
});

export default router;
