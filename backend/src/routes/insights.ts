import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { User } from '../models/User';
import { AssessmentSession } from '../models/Assessment';
import { PracticeSession } from '../models/Practice';
import { InterviewSession } from '../models/Interview';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

function authMiddleware(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    (req as any).userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

router.get('/overview', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const db = await getDatabase();

    const users = db.collection<User>('users');
    const assessments = db.collection<AssessmentSession>('assessmentSessions');
    const practices = db.collection<PracticeSession>('practiceSessions');
    const interviews = db.collection<InterviewSession>('interview_sessions');

    const [user, assessmentHist] = await Promise.all([
      users.findOne({ _id: new ObjectId(userId) }),
      assessments
        .find({ userId, status: 'completed' }, { projection: { score: 1, accuracy: 1, topic: 1, updatedAt: 1, createdAt: 1 } })
        .sort({ updatedAt: -1 })
        .limit(20)
        .toArray()
    ]);

    const history = assessmentHist || [];

    const latest = history[0];
    const previous = history[1];
    const latestScore = latest?.score ?? 0;
    const improvement = previous ? (latestScore - (previous.score ?? 0)) : 0;
    const velocity = previous ? (((latestScore - (previous.score ?? 0)) / Math.max(1, previous.score ?? 1)) * 100) : 0;
    const avgScore = history.length ? Math.round(history.reduce((s, h) => s + (h.score ?? 0), 0) / history.length) : 0;
    const avgAcc = history.length ? (history.reduce((s, h) => s + (h.accuracy ?? 0), 0) / history.length) : 0;

    const targetScore = user?.goals?.targetScore ?? 0;
    const weeklyHours = user?.goals?.weeklyHours ?? 0;
    const predictedScore = Math.min(100, Math.max(0, Math.round(avgScore + Math.max(0, improvement * 1.5))));

    const progressSeries = history
      .slice()
      .reverse()
      .map((h, idx) => ({
        label: new Date(h.updatedAt || h.createdAt || new Date()).toISOString(),
        score: Math.round(h.score ?? 0),
        testsTaken: idx + 1,
        hoursStudied: Math.max(0, Math.round((h.accuracy ?? 0) * 20))
      }));

    // Skill heatmap (topic-based averages)
    const byTopic = new Map<string, { total: number; count: number }>();
    history.forEach(h => {
      const key = h.topic || 'unknown';
      const obj = byTopic.get(key) || { total: 0, count: 0 };
      obj.total += (h.score ?? 0);
      obj.count += 1;
      byTopic.set(key, obj);
    });
    const skillHeatmap = Array.from(byTopic.entries()).map(([topic, { total, count }]) => ({
      topic,
      score: count ? Math.round(total / count) : 0
    }));

    // Simple weaknesses: bottom topics by score
    const weaknesses = skillHeatmap
      .slice()
      .sort((a, b) => a.score - b.score)
      .slice(0, 4)
      .map(w => ({
        area: w.topic,
        currentScore: w.score,
        attempts: history.filter(h => h.topic === w.topic).length,
        avgScore: w.score,
        improvement: 0,
        recommendation: `Practice more on ${w.topic} with focused drills`
      }));

    res.json({
      overview: {
        latestScore,
        improvement,
        velocity: Math.round(velocity),
        predictedScore,
        averageScore: avgScore,
        averageAccuracy: avgAcc
      },
      goals: { targetScore, weeklyHours },
      progressSeries,
      skillHeatmap,
      weaknesses
    });
  } catch (error) {
    console.error('Insights overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
