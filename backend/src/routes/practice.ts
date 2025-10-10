import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PracticeService } from '../services/practiceService';
import { PracticeDifficulty, PracticeTopic } from '../models/Practice';
import { GeminiAIService } from '../services/geminiAI';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

let geminiAI: GeminiAIService | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    geminiAI = new GeminiAIService();
    console.log('✅ Gemini AI (practice) initialised');
  } else {
    console.warn('⚠️ GEMINI_API_KEY not found. Practice AI feedback will use heuristics.');
  }
} catch (error) {
  console.warn('⚠️ Unable to initialise Gemini AI for practice:', error);
}

function authMiddleware(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const isValidTopic = (topic: any): topic is PracticeTopic =>
  ['quant', 'verbal', 'aptitude', 'reasoning', 'games'].includes(topic);

const isValidDifficulty = (difficulty: any): difficulty is PracticeDifficulty =>
  ['beginner', 'intermediate', 'advanced'].includes(difficulty);

router.get('/topics', authMiddleware, (_req, res) => {
  const data = PracticeService.listTopics();
  res.json(data);
});

router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { topic, difficulty, count } = req.body || {};

    if (!isValidTopic(topic)) {
      return res.status(400).json({ error: 'Invalid practice topic.' });
    }

    if (!isValidDifficulty(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level.' });
    }

    const userId = (req as any).userId as string;

    const { session, questionsForUser } = await PracticeService.createSession({
      userId,
      topic,
      difficulty,
      count: typeof count === 'number' ? count : 10,
      geminiAI
    });

    res.json({
      sessionId: session.sessionId,
      topic: session.topic,
      difficulty: session.difficulty,
      status: session.status,
      questions: questionsForUser
    });
  } catch (error: any) {
    console.error('Practice generation failed:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate practice questions.' });
  }
});

router.get('/sessions/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = (req as any).userId as string;

    const session = await PracticeService.getSession({ userId, sessionId });
    res.json(session);
  } catch (error: any) {
    console.error('Failed to fetch practice session:', error);
    res.status(error?.message?.includes('not found') ? 404 : 500).json({ error: error?.message || 'Failed to fetch session.' });
  }
});

router.post('/sessions/:sessionId/submit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = (req as any).userId as string;
    const { answers } = req.body || {};

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers must be an array.' });
    }

    const evaluation = await PracticeService.submitSession({
      userId,
      sessionId,
      answers,
      geminiAI
    });

    res.json(evaluation);
  } catch (error: any) {
    console.error('Failed to submit practice session:', error);
    res.status(error?.message?.includes('not found') ? 404 : 500).json({ error: error?.message || 'Failed to submit practice session.' });
  }
});

export default router;
