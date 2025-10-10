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

router.get('/summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const db = await getDatabase();

    const usersCollection = db.collection<User>('users');
    const assessmentsCollection = db.collection<AssessmentSession>('assessmentSessions');
    const practiceCollection = db.collection<PracticeSession>('practiceSessions');
    const interviewCollection = db.collection<InterviewSession>('interview_sessions');

    const [user, assessmentAgg, practiceAgg, interviewAgg, leaderboardAgg] = await Promise.all([
      usersCollection.findOne({ _id: new ObjectId(userId) }),
      assessmentsCollection.aggregate([
        { $match: { userId, status: 'completed' } },
        { $group: { _id: null, count: { $sum: 1 }, avgScore: { $avg: '$score' }, avgAccuracy: { $avg: '$accuracy' } } }
      ]).toArray(),
      practiceCollection.aggregate([
        { $match: { userId, status: 'completed' } },
        { $group: { _id: null, count: { $sum: 1 }, avgScore: { $avg: '$score' }, avgAccuracy: { $avg: '$accuracy' } } }
      ]).toArray(),
      interviewCollection.aggregate([
        { $match: { userId, status: 'completed' } },
        { $group: { _id: null, count: { $sum: 1 }, avgOverall: { $avg: '$score.overall' } } }
      ]).toArray(),
      usersCollection.aggregate([
        { $addFields: { leaderboardScore: { $ifNull: ['$totalScore', 0] } } },
        { $sort: { leaderboardScore: -1, testsCompleted: -1 } },
        { $project: { _id: 1 } }
      ]).toArray()
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const assessment = assessmentAgg[0] || { count: 0, avgScore: 0, avgAccuracy: 0 };
    const practice = practiceAgg[0] || { count: 0, avgScore: 0, avgAccuracy: 0 };
    const interview = interviewAgg[0] || { count: 0, avgOverall: 0 };

    const rank = (() => {
      const index = leaderboardAgg.findIndex(doc => String(doc._id) === String(user._id));
      return index >= 0 ? index + 1 : undefined;
    })();

  const testsCompleted = user.testsCompleted || 0;
    const avgScoreAcross = (() => {
      const buckets: number[] = [];
      if (assessment.avgScore) buckets.push(assessment.avgScore);
      if (practice.avgScore) buckets.push(practice.avgScore);
      if (interview.avgOverall) buckets.push(interview.avgOverall);
      if (buckets.length === 0) return 0;
      return Math.round(buckets.reduce((a, b) => a + b, 0) / buckets.length);
    })();

    // Recent history: last 5 of each
    const [recentAssessments, recentPractice, recentInterviews] = await Promise.all([
      assessmentsCollection.find({ userId, status: 'completed' }).sort({ updatedAt: -1 }).limit(5).toArray(),
      practiceCollection.find({ userId, status: 'completed' }).sort({ updatedAt: -1 }).limit(5).toArray(),
      interviewCollection.find({ userId, status: 'completed' }).sort({ updatedAt: -1 }).limit(5).toArray(),
    ]);

    res.json({
      user: {
        id: user._id?.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      stats: {
        rank: rank ?? user.rank ?? null,
        totalScore: user.totalScore ?? 0,
        testsCompleted: user.testsCompleted ?? 0,
        questionsSolved: user.questionsSolved ?? 0,
        studyHours: user.studyHours ?? 0,
        accuracy: user.accuracy ?? 0,
        avgTime: user.avgTime ?? 0,
      },
      metrics: {
        assessments: { completed: assessment.count || 0, avgScore: Math.round(assessment.avgScore || 0), avgAccuracy: assessment.avgAccuracy || 0 },
        practice: { completed: practice.count || 0, avgScore: Math.round(practice.avgScore || 0), avgAccuracy: practice.avgAccuracy || 0 },
        interviews: { completed: interview.count || 0, avgOverall: Math.round(interview.avgOverall || 0) },
        overall: { testsCompleted, avgScore: avgScoreAcross }
      },
      latestTestScores: user.latestTestScores || {},
      recent: {
        assessments: recentAssessments.map(a => ({ id: a.sessionId, topic: a.topic, score: a.score, accuracy: a.accuracy, at: a.updatedAt || a.createdAt })),
        practice: recentPractice.map(p => ({ id: p.sessionId, topic: p.topic, score: p.score, accuracy: p.accuracy, at: p.updatedAt || p.createdAt })),
        interviews: recentInterviews.map(i => ({ id: i._id?.toString(), overall: i.score?.overall ?? 0, at: i.updatedAt || i.createdAt }))
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leaderboard top N and user rank
router.get('/leaderboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    const top = await usersCollection
      .find({}, { projection: { email: 1, name: 1, avatar: 1, totalScore: 1, testsCompleted: 1 } })
      .sort({ totalScore: -1, testsCompleted: -1 })
      .limit(parseInt(limit.toString()))
      .toArray();

    res.json({
      top: top.map((u, idx) => ({
        id: u._id?.toString(),
        name: u.name || u.email.split('@')[0],
        avatar: u.avatar,
        rank: idx + 1,
        totalScore: u.totalScore ?? 0,
        testsCompleted: u.testsCompleted ?? 0
      }))
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
