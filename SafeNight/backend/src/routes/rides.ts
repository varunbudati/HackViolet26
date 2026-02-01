import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import {
  isConnected,
  createRideRequest,
  getOpenRideRequests,
  getUserRideRequests,
  matchRideRequest,
  cancelRideRequest,
  completeRideRequest,
  SnowflakeRideRequest,
} from '../services/snowflake';

const router = Router();

// In-memory storage for demo mode
interface DemoRideRequest {
  id: string;
  userId: string;
  userDisplayName: string;
  type: 'need_ride' | 'offer_ride';
  fromLocation: string;
  toLocation: string;
  departureTime: Date;
  maxPassengers?: number;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  matchedWith?: string;
  createdAt: Date;
}

const demoRides: DemoRideRequest[] = [];

// Helper to convert Snowflake result to API response
const formatRide = (ride: SnowflakeRideRequest | DemoRideRequest) => {
  if ('ID' in ride) {
    // Snowflake format
    return {
      id: ride.ID,
      userId: ride.USER_ID,
      userDisplayName: ride.USER_DISPLAY_NAME,
      type: ride.TYPE,
      fromLocation: ride.FROM_LOCATION,
      toLocation: ride.TO_LOCATION,
      departureTime: ride.DEPARTURE_TIME,
      maxPassengers: ride.MAX_PASSENGERS,
      status: ride.STATUS,
      matchedWith: ride.MATCHED_WITH,
      createdAt: ride.CREATED_AT,
    };
  }
  // Demo format
  return ride;
};

// GET /api/rides - Get all open ride requests
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isConnected()) {
      // Demo mode
      const openRides = demoRides.filter(r => r.status === 'open');
      res.json(openRides);
      return;
    }

    const rides = await getOpenRideRequests();
    res.json(rides.map(formatRide));
  } catch (error) {
    console.error('Failed to get rides:', error);
    res.status(500).json({ error: 'Failed to get rides' });
  }
});

// GET /api/rides/mine - Get current user's ride requests
router.get('/mine', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!isConnected()) {
      // Demo mode
      const myRides = demoRides.filter(r => r.userId === userId);
      res.json(myRides);
      return;
    }

    const rides = await getUserRideRequests(userId);
    res.json(rides.map(formatRide));
  } catch (error) {
    console.error('Failed to get user rides:', error);
    res.status(500).json({ error: 'Failed to get user rides' });
  }
});

// POST /api/rides - Create a new ride request
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userDisplayName, type, fromLocation, toLocation, departureTime, maxPassengers } = req.body;

    if (!userDisplayName || !type || !fromLocation || !toLocation || !departureTime) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const id = uuidv4();
    const parsedDepartureTime = new Date(departureTime);

    if (!isConnected()) {
      // Demo mode
      const ride: DemoRideRequest = {
        id,
        userId,
        userDisplayName,
        type,
        fromLocation,
        toLocation,
        departureTime: parsedDepartureTime,
        maxPassengers,
        status: 'open',
        createdAt: new Date(),
      };
      demoRides.unshift(ride);
      res.status(201).json(ride);
      return;
    }

    await createRideRequest(id, userId, userDisplayName, type, fromLocation, toLocation, parsedDepartureTime, maxPassengers);
    
    res.status(201).json({
      id,
      userId,
      userDisplayName,
      type,
      fromLocation,
      toLocation,
      departureTime: parsedDepartureTime,
      maxPassengers,
      status: 'open',
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to create ride:', error);
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

// PUT /api/rides/:id/match - Match with a ride request
router.put('/:id/match', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    if (!isConnected()) {
      // Demo mode
      const ride = demoRides.find(r => r.id === id);
      if (ride) {
        ride.status = 'matched';
        ride.matchedWith = userId;
      }
      res.json({ success: true });
      return;
    }

    await matchRideRequest(id, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to match ride:', error);
    res.status(500).json({ error: 'Failed to match ride' });
  }
});

// PUT /api/rides/:id/cancel - Cancel a ride request
router.put('/:id/cancel', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isConnected()) {
      // Demo mode
      const ride = demoRides.find(r => r.id === id);
      if (ride) {
        ride.status = 'cancelled';
      }
      res.json({ success: true });
      return;
    }

    await cancelRideRequest(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel ride:', error);
    res.status(500).json({ error: 'Failed to cancel ride' });
  }
});

// PUT /api/rides/:id/complete - Complete a ride
router.put('/:id/complete', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isConnected()) {
      // Demo mode
      const ride = demoRides.find(r => r.id === id);
      if (ride) {
        ride.status = 'completed';
      }
      res.json({ success: true });
      return;
    }

    await completeRideRequest(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to complete ride:', error);
    res.status(500).json({ error: 'Failed to complete ride' });
  }
});

export default router;
