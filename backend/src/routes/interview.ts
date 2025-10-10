import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { 
  InterviewSession, 
  Question, 
  Message, 
  QuestionEvaluationDoc,
  UserProfile,
  CompanyProfile,
  ProgressAnalytics,
  CreateInterviewSessionRequest,
  SubmitAnswerRequest,
  GetQuestionsRequest,
  InterviewSessionResponse,
  QuestionResponse,
  MessageResponse
} from '../models/Interview';
import { ScoringService } from '../services/scoring';
import { GeminiAIService } from '../services/geminiAI';
import { CodeExecutionService } from '../services/codeExecution';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// Initialize services
let geminiAI: GeminiAIService | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    geminiAI = new GeminiAIService();
    console.log('✅ Gemini AI service initialized successfully');
  } else {
    console.warn('⚠️ GEMINI_API_KEY not found. AI features will be disabled.');
  }
} catch (error) {
  console.warn('⚠️ Gemini AI not available:', error);
}

  const codeExecutionService = new CodeExecutionService();

// Middleware to verify JWT
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

// Create or update user profile for interviews
router.post('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { role, experienceLevel, targetCompany, preferredLanguage, interviewType } = req.body;

    // Validation
    if (!role || !experienceLevel || !preferredLanguage || !interviewType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDatabase();
    const profilesCollection = db.collection<UserProfile>('user_profiles');

    // Check if profile exists
    const existingProfile = await profilesCollection.findOne({ userId });
    
    const profileData: Partial<UserProfile> = {
      role,
      experienceLevel,
      targetCompany,
      preferredLanguage,
      interviewType,
      updatedAt: new Date()
    };

    let profile: UserProfile;

    if (existingProfile) {
      // Update existing profile
      await profilesCollection.updateOne(
        { userId },
        { $set: profileData }
      );
      profile = { ...existingProfile, ...profileData } as UserProfile;
    } else {
      // Create new profile
      const newProfile: Omit<UserProfile, '_id'> = {
        userId,
        role,
        experienceLevel,
        targetCompany,
        preferredLanguage,
        interviewType,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await profilesCollection.insertOne(newProfile as UserProfile);
      profile = { ...newProfile, _id: result.insertedId } as UserProfile;
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      profile: {
        id: profile._id?.toString(),
        userId: profile.userId,
        role: profile.role,
        experienceLevel: profile.experienceLevel,
        targetCompany: profile.targetCompany,
        preferredLanguage: profile.preferredLanguage,
        interviewType: profile.interviewType
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const db = await getDatabase();
    const profilesCollection = db.collection<UserProfile>('user_profiles');

    const profile = await profilesCollection.findOne({ userId });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json({
      profile: {
        id: profile._id?.toString(),
        userId: profile.userId,
        role: profile.role,
        experienceLevel: profile.experienceLevel,
        targetCompany: profile.targetCompany,
        preferredLanguage: profile.preferredLanguage,
        interviewType: profile.interviewType
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new interview session
router.post('/sessions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { profile, questionCount = 5, difficulty }: CreateInterviewSessionRequest = req.body;

    const db = await getDatabase();
    const sessionsCollection = db.collection<InterviewSession>('interview_sessions');
    const questionsCollection = db.collection<Question>('questions');

  // Get questions based on profile with proper type mapping
  const questionFilters: any = {};
  if (profile.role) questionFilters.roles = { $in: [profile.role] };
  if (profile.targetCompany) questionFilters.companies = { $in: [profile.targetCompany] };
  if (difficulty) questionFilters.difficulty = difficulty;

  // interviewType (technical | system-design | behavioral | mixed)
  // question.type (dsa | system-design | behavioral | coding)
  const typeMap: Record<string, string[] | undefined> = {
    'technical': ['dsa', 'coding'],
    'system-design': ['system-design'],
    'behavioral': ['behavioral'],
    'mixed': undefined
  };

  const mappedTypes = typeMap[profile.interviewType];
  if (mappedTypes && mappedTypes.length === 1) {
    questionFilters.type = mappedTypes[0];
  } else if (mappedTypes && mappedTypes.length > 1) {
    questionFilters.type = { $in: mappedTypes };
  }

  // Deterministic selection: newest first within filters
  let questions = await questionsCollection
    .find(questionFilters)
    .sort({ updatedAt: -1 })
    .limit(questionCount)
    .toArray();

  // Fallback: if no questions found, relax type filter (mixed behavior)
  if (questions.length === 0) {
    const relaxedFilters = { ...questionFilters } as any;
    delete relaxedFilters.type;
    questions = await questionsCollection
      .find(relaxedFilters)
      .sort({ updatedAt: -1 })
      .limit(questionCount)
      .toArray();
  }

  // AI fallback: generate and persist questions if still none
  if (questions.length === 0) {
    try {
      if (!geminiAI) {
        return res.status(400).json({ error: 'No questions found for the given criteria' });
      }

      const aiQuestions = await geminiAI.generateStructuredQuestions({
        company: profile.targetCompany,
        role: profile.role,
        interviewType: profile.interviewType as any,
        difficulty: (difficulty as any) || 'medium',
        count: questionCount
      });

      if (aiQuestions.length > 0) {
        // Persist generated questions so they can be reused
        const insertResult = await questionsCollection.insertMany(
          aiQuestions.map(q => ({
            ...q,
            createdAt: new Date(),
            updatedAt: new Date()
          })) as any
        );
        // Use freshly generated questions directly (preserves order)
        questions = aiQuestions as any;
      }
    } catch (e) {
      console.error('AI question generation failed:', e);
    }
  }

  if (questions.length === 0) {
    return res.status(400).json({ error: 'No questions found for the given criteria' });
  }

    // Create new session
    const newSession: Omit<InterviewSession, '_id'> = {
      userId,
      status: 'setup',
      currentPhase: 'intro',
      questionIds: questions.map(q => q.id),
      currentQuestionIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await sessionsCollection.insertOne(newSession as InterviewSession);

    res.status(201).json({
      message: 'Interview session created successfully',
      session: {
        id: result.insertedId.toString(),
        userId: newSession.userId,
        status: newSession.status,
        currentPhase: newSession.currentPhase,
        questionIds: newSession.questionIds,
        currentQuestionIndex: newSession.currentQuestionIndex,
        createdAt: newSession.createdAt,
        updatedAt: newSession.updatedAt
      }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get interview session
router.get('/sessions/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).userId;

    const db = await getDatabase();
    const sessionsCollection = db.collection<InterviewSession>('interview_sessions');

    const session = await sessionsCollection.findOne({ 
      _id: new ObjectId(sessionId), 
      userId 
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json({
      session: {
        id: session._id?.toString(),
        userId: session.userId,
        status: session.status,
        currentPhase: session.currentPhase,
        questionIds: session.questionIds,
        currentQuestionIndex: session.currentQuestionIndex,
        startTime: session.startTime,
        endTime: session.endTime,
        totalDuration: session.totalDuration,
        score: session.score,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start interview session
router.post('/sessions/:sessionId/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).userId;

    const db = await getDatabase();
    const sessionsCollection = db.collection<InterviewSession>('interview_sessions');

    const result = await sessionsCollection.findOneAndUpdate(
      { _id: new ObjectId(sessionId), userId },
      { 
        $set: { 
          status: 'active',
          startTime: new Date(),
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json({
      message: 'Interview started successfully',
      session: {
        id: result._id?.toString(),
        status: result.status,
        startTime: result.startTime
      }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get questions
router.get('/questions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { role, company, difficulty, type, category, limit = 10 }: GetQuestionsRequest = req.query;

    const db = await getDatabase();
    const questionsCollection = db.collection<Question>('questions');

    const filters: any = {};
    if (role) filters.roles = { $in: [role] };
    if (company) filters.companies = { $in: [company] };
    if (difficulty) filters.difficulty = difficulty;
    if (type) filters.type = type;
    if (category) filters.category = category;

    const questions = await questionsCollection
      .find(filters)
      .limit(parseInt(limit.toString()))
      .toArray();

    res.status(200).json({
      questions: questions.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        type: q.type,
        difficulty: q.difficulty,
        category: q.category,
        tags: q.tags,
        companies: q.companies,
        roles: q.roles,
        testCases: q.testCases,
        expectedAnswer: q.expectedAnswer,
        hints: q.hints,
        timeLimit: q.timeLimit
      }))
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get AI interviewer response
router.post('/sessions/:sessionId/ai-response', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).userId;
    const { question, questionType, difficulty, company, role, candidateAnswer, currentPhase } = req.body;

    if (!geminiAI) {
      return res.status(503).json({ error: 'AI service not available' });
    }

    const db = await getDatabase();
    const sessionsCollection = db.collection<InterviewSession>('interview_sessions');
    const messagesCollection = db.collection<Message>('messages');

    // Verify session exists and belongs to user
    const session = await sessionsCollection.findOne({ 
      _id: new ObjectId(sessionId), 
      userId 
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get conversation history
    const messages = await messagesCollection
      .find({ sessionId: new ObjectId(sessionId) })
      .sort({ timestamp: 1 })
      .toArray();

    // Get last evaluation (personalization signal)
    const evaluationsCollection = db.collection<QuestionEvaluationDoc>('question_evaluations');
    const lastEval = await evaluationsCollection
      .find({ sessionId: new ObjectId(sessionId) })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Generate AI response
    const aiResponse = await geminiAI.generateInterviewerResponse({
      question,
      questionType,
      difficulty,
      company,
      role,
      candidateAnswer,
      conversationHistory,
      currentPhase,
      // personalization hints
      performance: lastEval[0]?.totalScore,
      strengths: lastEval[0]?.feedback?.strengths,
      weaknesses: lastEval[0]?.feedback?.weaknesses
    });

    // Save AI message
    const aiMessage: Omit<Message, '_id'> = {
      sessionId: new ObjectId(sessionId),
      role: 'interviewer',
      content: aiResponse,
      timestamp: new Date(),
      questionId: question
    };

    const messageResult = await messagesCollection.insertOne(aiMessage as Message);

    res.status(200).json({
      message: 'AI response generated successfully',
      response: {
        id: messageResult.insertedId.toString(),
        content: aiResponse,
        timestamp: aiMessage.timestamp
      }
    });
  } catch (error) {
    console.error('AI response error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Execute code
router.post('/execute-code', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code, language, testCases } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    const result = await codeExecutionService.executeCode(code, language, testCases);

    res.status(200).json({
      message: 'Code executed successfully',
      result
    });
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  // Submit answer
  router.post('/sessions/:sessionId/answer', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).userId;
    const { questionId, answer, code, language, timeSpent, hintsUsed }: SubmitAnswerRequest = req.body;

    const db = await getDatabase();
    const sessionsCollection = db.collection<InterviewSession>('interview_sessions');
    const messagesCollection = db.collection<Message>('messages');
    const evaluationsCollection = db.collection<QuestionEvaluationDoc>('question_evaluations');
    const questionsCollection = db.collection<Question>('questions');

    // Verify session exists and belongs to user
    const session = await sessionsCollection.findOne({ 
      _id: new ObjectId(sessionId), 
      userId 
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // If code submitted, execute against question test cases (target 5: 3 simple, 2 edge)
    let executionResult: any = undefined;
    if (code && language) {
      try {
        const q = await questionsCollection.findOne({ id: questionId });
        const testCases = q?.testCases && Array.isArray(q.testCases) ? q.testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput })) : undefined;
        executionResult = await codeExecutionService.executeCode(code, language, testCases);
      } catch (execErr) {
        executionResult = { success: false, error: 'Execution failed' };
      }
    }

    // Create message for the answer
    const message: Omit<Message, '_id'> = {
      sessionId: new ObjectId(sessionId),
      role: 'candidate',
      content: answer,
      timestamp: new Date(),
      questionId,
      metadata: {
        code,
        language,
        executionResult
      }
    };

    const messageResult = await messagesCollection.insertOne(message as Message);

    // Evaluate the answer
    const evaluation = ScoringService.evaluateQuestion(
      questionId,
      answer,
      code,
      language,
      executionResult,
      timeSpent,
      hintsUsed
    );

    // Get current question for AI feedback
    const currentQuestion = await questionsCollection.findOne({ id: questionId });

    // Generate AI feedback if available
    if (geminiAI) {
      try {
        const aiFeedback = await geminiAI.generateFeedback({
          question: currentQuestion?.description || '',
          questionType: currentQuestion?.type || 'behavioral',
          candidateAnswer: answer,
          code,
          language,
          difficulty: currentQuestion?.difficulty || 'medium',
          timeSpent
        });

        // Merge AI feedback with algorithmic evaluation
        evaluation.feedback = {
          strengths: [...evaluation.feedback.strengths, ...aiFeedback.strengths],
          weaknesses: [...evaluation.feedback.weaknesses, ...aiFeedback.weaknesses],
          improvements: [...evaluation.feedback.improvements, ...aiFeedback.improvements],
          suggestions: [...evaluation.feedback.suggestions, ...aiFeedback.suggestions]
        };
      } catch (error) {
        console.error('AI feedback generation failed:', error);
        // Continue with algorithmic evaluation only
      }
    }

    // Save evaluation
    const evaluationDoc: Omit<QuestionEvaluationDoc, '_id'> = {
      sessionId: new ObjectId(sessionId),
      questionId,
      scores: evaluation.scores,
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      timeSpent: evaluation.timeSpent,
      hintsUsed: evaluation.hintsUsed,
      codeSubmitted: code,
      language,
      executionResult: message.metadata?.executionResult,
      createdAt: new Date()
    };

    await evaluationsCollection.insertOne(evaluationDoc as QuestionEvaluationDoc);

    // Update session with evaluation metadata
    await messagesCollection.updateOne(
      { _id: messageResult.insertedId },
      { $set: { 'metadata.evaluation': evaluation } }
    );

    res.status(200).json({
      message: 'Answer submitted successfully',
      evaluation: {
        scores: evaluation.scores,
        totalScore: evaluation.totalScore,
        feedback: evaluation.feedback
      }
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session messages (transcript)
router.get('/sessions/:sessionId/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).userId;

    const db = await getDatabase();
    const sessionsCollection = db.collection<InterviewSession>('interview_sessions');
    const messagesCollection = db.collection<Message>('messages');

    // Verify session exists and belongs to user
    const session = await sessionsCollection.findOne({ 
      _id: new ObjectId(sessionId), 
      userId 
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = await messagesCollection
      .find({ sessionId: new ObjectId(sessionId) })
      .sort({ timestamp: 1 })
      .toArray();

    res.status(200).json({
      messages: messages.map(m => ({
        id: m._id?.toString(),
        sessionId: m.sessionId.toString(),
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        questionId: m.questionId,
        metadata: m.metadata
      }))
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete interview session
router.post('/sessions/:sessionId/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).userId;

    const db = await getDatabase();
    const sessionsCollection = db.collection<InterviewSession>('interview_sessions');
    const evaluationsCollection = db.collection<QuestionEvaluationDoc>('question_evaluations');

    // Get all evaluations for this session
    const evaluations = await evaluationsCollection
      .find({ sessionId: new ObjectId(sessionId) })
      .toArray();

    // Calculate overall score
    const questionEvaluations = evaluations.map(evaluation => ({
      questionId: evaluation.questionId,
      scores: evaluation.scores,
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      timeSpent: evaluation.timeSpent,
      hintsUsed: evaluation.hintsUsed
    }));

    const overallScore = ScoringService.calculateInterviewScore(questionEvaluations);

    // Update session
    const endTime = new Date();
    const session = await sessionsCollection.findOne({ _id: new ObjectId(sessionId) });
    const startTime = session?.startTime || endTime;
    const totalDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const result = await sessionsCollection.findOneAndUpdate(
      { _id: new ObjectId(sessionId), userId },
      { 
        $set: { 
          status: 'completed',
          endTime,
          totalDuration,
          score: overallScore,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json({
      message: 'Interview completed successfully',
      session: {
        id: result._id?.toString(),
        status: result.status,
        endTime: result.endTime,
        totalDuration: result.totalDuration,
        score: result.score
      }
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's interview history
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = 10, offset = 0 } = req.query;

    const db = await getDatabase();
    const sessionsCollection = db.collection<InterviewSession>('interview_sessions');

    const sessions = await sessionsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset.toString()))
      .limit(parseInt(limit.toString()))
      .toArray();

    res.status(200).json({
      sessions: sessions.map(session => ({
        id: session._id?.toString(),
        userId: session.userId,
        status: session.status,
        currentPhase: session.currentPhase,
        startTime: session.startTime,
        endTime: session.endTime,
        totalDuration: session.totalDuration,
        score: session.score,
        createdAt: session.createdAt
      }))
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get progress analytics
router.get('/analytics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const db = await getDatabase();
    const analyticsCollection = db.collection<ProgressAnalytics>('progress_analytics');
    const sessionsCollection = db.collection<InterviewSession>('interview_sessions');

    // Get or create analytics
    let analytics = await analyticsCollection.findOne({ userId });

    if (!analytics) {
      // Create default analytics
      const defaultAnalytics: Omit<ProgressAnalytics, '_id'> = {
        userId,
        totalSessions: 0,
        averageScore: 0,
        improvementTrend: 'stable',
        strengths: [],
        weaknesses: [],
        topicBreakdown: {},
        timeSpent: 0,
        streak: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await analyticsCollection.insertOne(defaultAnalytics as ProgressAnalytics);
      analytics = { ...defaultAnalytics, _id: result.insertedId } as ProgressAnalytics;
    }

    // Get recent sessions for additional data
    const recentSessions = await sessionsCollection
      .find({ userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    res.status(200).json({
      analytics: {
        id: analytics._id?.toString(),
        userId: analytics.userId,
        totalSessions: analytics.totalSessions,
        averageScore: analytics.averageScore,
        improvementTrend: analytics.improvementTrend,
        strengths: analytics.strengths,
        weaknesses: analytics.weaknesses,
        topicBreakdown: analytics.topicBreakdown,
        timeSpent: analytics.timeSpent,
        lastSession: analytics.lastSession,
        streak: analytics.streak
      },
      recentSessions: recentSessions.map(session => ({
        id: session._id?.toString(),
        status: session.status,
        score: session.score,
        createdAt: session.createdAt
      }))
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
