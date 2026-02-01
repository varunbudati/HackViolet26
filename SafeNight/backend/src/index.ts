import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { connect as connectSnowflake } from './services/snowflake';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import messagesRoutes from './routes/messages';
import ridesRoutes from './routes/rides';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/rides', ridesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const startServer = async () => {
  try {
    // Connect to Snowflake
    await connectSnowflake();
    console.log('Connected to Snowflake');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    // Start server anyway for demo mode
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (Snowflake connection failed)`);
    });
  }
};

startServer();
