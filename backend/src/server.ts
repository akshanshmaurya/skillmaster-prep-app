// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { testConnection } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import interviewRoutes from './routes/interview';
import practiceRoutes from './routes/practice';
import assessmentRoutes from './routes/assessment';
import dashboardRoutes from './routes/dashboard';
import insightsRoutes from './routes/insights';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/tests', assessmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/insights', insightsRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'PrepPro Backend API',
    version: '1.0.0',
    endpoints: {
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      user: {
        update: 'PATCH /api/user/update',
        stats: 'PATCH /api/user/stats',
        getUser: 'GET /api/user/:id'
      },
      interview: {
        profile: 'POST /api/interview/profile',
        getProfile: 'GET /api/interview/profile',
        createSession: 'POST /api/interview/sessions',
        getSession: 'GET /api/interview/sessions/:sessionId',
        startSession: 'POST /api/interview/sessions/:sessionId/start',
        getQuestions: 'GET /api/interview/questions',
        submitAnswer: 'POST /api/interview/sessions/:sessionId/answer',
        getMessages: 'GET /api/interview/sessions/:sessionId/messages',
        completeSession: 'POST /api/interview/sessions/:sessionId/complete',
        getHistory: 'GET /api/interview/history',
        getAnalytics: 'GET /api/interview/analytics'
      },
      practice: {
        listTopics: 'GET /api/practice/topics',
        generate: 'POST /api/practice/generate',
        getSession: 'GET /api/practice/sessions/:sessionId',
        submitSession: 'POST /api/practice/sessions/:sessionId/submit'
      },
      tests: {
        listTracks: 'GET /api/tests/tracks',
        generate: 'POST /api/tests/generate',
        getSession: 'GET /api/tests/sessions/:sessionId',
        submitSession: 'POST /api/tests/sessions/:sessionId/submit',
        history: 'GET /api/tests/history'
      }
    }
  });
});

// Start server
async function startServer() {
  try {
    // Test MongoDB connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Failed to connect to MongoDB. Please check your connection string.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
      console.log(`🔗 Frontend URL: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;

