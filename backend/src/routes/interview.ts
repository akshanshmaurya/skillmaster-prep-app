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

// Utility: timeout wrapper to prevent long AI waits
async function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      if (onTimeout) try { onTimeout(); } catch {}
      reject(new Error('AI generation timeout'));
    }, ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result as T;
  } catch (e) {
    clearTimeout(timeoutHandle!);
    throw e;
  }
}

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

// Local deterministic fallback generator when AI and DB are unavailable/empty
function generateLocalQuestions(opts: { role: string; interviewType: string; difficulty?: string; company?: string; count: number }) {
  const mapTypes: Record<string, string[]> = {
    technical: ['dsa', 'coding'],
    'system-design': ['system-design'],
    behavioral: ['behavioral'],
    mixed: ['dsa', 'coding', 'system-design', 'behavioral']
  };

  const library = {
    behavioral: [
      {
        title: 'Describe a challenging production incident you owned',
        description: 'Explain how you detected it, the stakeholders involved, the trade-offs you considered, and how you prevented it from happening again.',
        type: 'behavioral',
        difficulty: 'medium',
        category: 'communication',
        tags: ['ownership', 'leadership'],
        timeLimit: 10
      },
      {
        title: 'Tell me about a time you influenced without authority',
        description: 'Outline the context, the friction you faced, your approach to persuasion, and the measurable outcome.',
        type: 'behavioral',
        difficulty: 'medium',
        category: 'leadership',
        tags: ['influence', 'stakeholder-management'],
        timeLimit: 12
      },
      {
        title: 'Share an example of receiving tough feedback',
        description: 'Cover the situation, what you did to internalize the feedback, and how you changed your behavior afterwards.',
        type: 'behavioral',
        difficulty: 'medium',
        category: 'growth',
        tags: ['learning', 'self-awareness'],
        timeLimit: 10
      }
    ],
    'system-design': [
      {
        title: 'Design a rate limiter for an API gateway',
        description: 'Discuss functional requirements, quota policy, token bucket/leaky bucket mechanics, persistence, monitoring, and scaling strategy.',
        type: 'system-design',
        difficulty: 'medium',
        category: 'architecture',
        tags: ['design', 'scalability'],
        timeLimit: 25
      },
      {
        title: 'Design a real-time collaborative document editor',
        description: 'Cover requirements, collaborative editing, data consistency (OT/CRDT), storage, conflict resolution, and operational concerns.',
        type: 'system-design',
        difficulty: 'hard',
        category: 'collaboration',
        tags: ['real-time', 'consistency'],
        timeLimit: 30
      },
      {
        title: 'Design a video streaming platform like Twitch',
        description: 'Discuss ingest pipeline, transcoding, distribution, chat, storage, scaling, and observability.',
        type: 'system-design',
        difficulty: 'hard',
        category: 'media',
        tags: ['streaming', 'scalability'],
        timeLimit: 35
      }
    ],
    coding: [
      {
        title: 'Maximum Sum Subarray of Size K',
        description: 'Given an integer array nums and an integer k, find the maximum sum of any contiguous subarray of size k.',
        type: 'coding',
        difficulty: 'medium',
        category: 'arrays',
        tags: ['sliding-window'],
        timeLimit: 20,
        samples: [
          { input: 'nums=[2,5,1,8], k=3', expectedOutput: '14', explanation: '5+1+8' },
          { input: 'nums=[1,2,3,4], k=2', expectedOutput: '7', explanation: '3+4' }
        ],
        testCases: [
          { input: 'nums=[2,5,1,8], k=3', expectedOutput: '14' },
          { input: 'nums=[1,2,3,4], k=2', expectedOutput: '7' },
          { input: 'nums=[-1,-2,-3], k=2', expectedOutput: '-3' },
          { input: 'nums=[1], k=1', expectedOutput: '1' }
        ]
      },
      {
        title: 'Longest Substring Without Repeating Characters',
        description: 'Given a string s, return the length of the longest substring without repeating characters.',
        type: 'coding',
        difficulty: 'medium',
        category: 'strings',
        tags: ['sliding-window'],
        timeLimit: 25,
        samples: [
          { input: "s='abcabcbb'", expectedOutput: '3', explanation: "'abc'" },
          { input: "s='bbbbb'", expectedOutput: '1', explanation: "'b'" }
        ],
        testCases: [
          { input: "s='pwwkew'", expectedOutput: '3' },
          { input: "s=''", expectedOutput: '0' },
          { input: "s='dvdf'", expectedOutput: '3' }
        ]
      },
      {
        title: 'Top K Frequent Elements',
        description: 'Given an integer array nums and an integer k, return the k most frequent elements.',
        type: 'coding',
        difficulty: 'medium',
        category: 'hashing',
        tags: ['heap', 'bucket-sort'],
        timeLimit: 25,
        samples: [
          { input: 'nums=[1,1,1,2,2,3], k=2', expectedOutput: '[1,2]' },
          { input: 'nums=[1], k=1', expectedOutput: '[1]' }
        ],
        testCases: [
          { input: 'nums=[4,4,4,5,5,6], k=1', expectedOutput: '[4]' },
          { input: 'nums=[1,2,3,4,5], k=3', expectedOutput: '[1,2,3]' }
        ]
      },
      {
        title: 'Merge Intervals',
        description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.',
        type: 'coding',
        difficulty: 'medium',
        category: 'intervals',
        tags: ['sorting'],
        timeLimit: 25,
        samples: [
          { input: 'intervals=[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]' }
        ],
        testCases: [
          { input: 'intervals=[[1,4],[4,5]]', expectedOutput: '[[1,5]]' },
          { input: 'intervals=[[1,4],[0,4]]', expectedOutput: '[[0,4]]' }
        ]
      }
    ],
    dsa: [
      {
        title: 'Binary Tree Level Order Traversal',
        description: 'Given the root of a binary tree, return the level order traversal of its nodes’ values.',
        type: 'dsa',
        difficulty: 'medium',
        category: 'trees',
        tags: ['bfs'],
        timeLimit: 25,
        samples: [
          { input: 'root=[3,9,20,null,null,15,7]', expectedOutput: '[[3],[9,20],[15,7]]' }
        ],
        testCases: [
          { input: 'root=[1]', expectedOutput: '[[1]]' },
          { input: 'root=[]', expectedOutput: '[]' }
        ]
      },
      {
        title: 'Implement LRU Cache',
        description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
        type: 'dsa',
        difficulty: 'hard',
        category: 'design',
        tags: ['linked-list', 'hashmap'],
        timeLimit: 35,
        samples: [
          { input: 'LRUCache(2) -> put(1,1) -> put(2,2) -> get(1) -> put(3,3) -> get(2)', expectedOutput: '1, -1' }
        ],
        testCases: [
          { input: 'LRUCache(1) -> put(1,1) -> put(2,2) -> get(1) -> get(2)', expectedOutput: '-1, 2' }
        ]
      },
      {
        title: 'Number of Islands',
        description: 'Given a 2D grid map of 1s (land) and 0s (water), count the number of islands.',
        type: 'dsa',
        difficulty: 'medium',
        category: 'graphs',
        tags: ['dfs', 'bfs'],
        timeLimit: 25,
        samples: [
          { input: "grid=[[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]", expectedOutput: '3' }
        ],
        testCases: [
          { input: 'grid=[[1]]', expectedOutput: '1' },
          { input: 'grid=[[1,0],[0,1]]', expectedOutput: '2' }
        ]
      }
    ]
  } as const;

  const allowed = mapTypes[opts.interviewType] || ['dsa'];
  const items: any[] = [];
  const now = Date.now();
  const offsets: Partial<Record<keyof typeof library, number>> = {};

  const pickVariant = (typeKey: keyof typeof library, index: number) => {
    const pool = library[typeKey];
    if (offsets[typeKey] === undefined) {
      offsets[typeKey] = Math.floor(Math.random() * pool.length);
    }
    const offset = offsets[typeKey]!;
    const variant = pool[(offset + index) % pool.length];
    return JSON.parse(JSON.stringify(variant));
  };

  for (let i = 0; i < Math.max(1, opts.count); i++) {
    const t = allowed[i % allowed.length] as keyof typeof library;
    const id = `local-${t}-${now}-${i + 1}`;

    const libraryKey: keyof typeof library = library[t] ? t : 'coding';
    const base = pickVariant(libraryKey, i);

    items.push({
      ...base,
      id,
      source: 'local',
      difficulty: (opts.difficulty as any) || base.difficulty,
      companies: opts.company ? [opts.company] : base.companies || [],
      roles: base.roles?.length ? Array.from(new Set([opts.role, ...base.roles])) : [opts.role],
      samples: base.samples?.map((s: any) => ({ ...s })),
      testCases: base.testCases?.map((tc: any) => ({ ...tc }))
    });
  }

  return items;
}

type NormalizedQuestion = Question & {
  samples?: Array<{ input: string; expectedOutput: string; explanation?: string }>;
};

function normalizeQuestion(
  raw: any,
  defaults: { role: string; difficulty?: string; company?: string }
): NormalizedQuestion {
  const now = new Date();
  const derivedId = raw?.id || raw?._id?.toString() || `generated-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  const normalizedType = (raw?.type || 'behavioral') as Question['type'];
  const normalizedDifficulty = (raw?.difficulty || defaults.difficulty || 'medium') as Question['difficulty'];
  const timeLimitValue = typeof raw?.timeLimit === 'number'
    ? raw.timeLimit
    : raw?.timeLimit
    ? parseInt(String(raw.timeLimit), 10)
    : undefined;

  const samplesArray = Array.isArray(raw?.samples)
    ? raw.samples.map((sample: any) => ({
        input: String(sample?.input ?? ''),
        expectedOutput: String(sample?.expectedOutput ?? ''),
        explanation: sample?.explanation ? String(sample.explanation) : undefined
      }))
    : undefined;

  const testCasesArray = Array.isArray(raw?.testCases)
    ? raw.testCases.map((tc: any) => ({
        input: String(tc?.input ?? ''),
        expectedOutput: String(tc?.expectedOutput ?? ''),
        explanation: tc?.explanation ? String(tc.explanation) : undefined
      }))
    : undefined;

  return {
    ...(raw as any),
    id: derivedId,
    title: raw?.title || 'Interview Question',
    description: raw?.description || '',
    type: normalizedType,
    difficulty: normalizedDifficulty,
    category: raw?.category || 'general',
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    companies:
      Array.isArray(raw?.companies) && raw.companies.length
        ? raw.companies
        : defaults.company
        ? [defaults.company]
        : [],
    roles:
      Array.isArray(raw?.roles) && raw.roles.length
        ? raw.roles
        : [defaults.role],
    testCases: testCasesArray,
    samples: samplesArray,
    timeLimit: Number.isFinite(timeLimitValue) ? Number(timeLimitValue) : undefined,
    source: raw?.source || 'seed',
    createdAt: raw?.createdAt ? new Date(raw.createdAt) : now,
    updatedAt: raw?.updatedAt ? new Date(raw.updatedAt) : now
  } as NormalizedQuestion;
}

function diversifyQuestionSet(
  source: any[],
  opts: { count: number; role: string; interviewType: string; difficulty?: string; company?: string }
): NormalizedQuestion[] {
  const defaults = { role: opts.role, difficulty: opts.difficulty, company: opts.company };
  const unique = new Map<string, NormalizedQuestion>();

  (source || []).forEach(raw => {
    const normalized = normalizeQuestion(raw, defaults);
    unique.set(normalized.id, normalized);
  });

  const buckets: Record<'behavioral' | 'system-design' | 'coding' | 'dsa' | 'other', NormalizedQuestion[]> = {
    behavioral: [],
    'system-design': [],
    coding: [],
    dsa: [],
    other: []
  };

  unique.forEach(question => {
    const bucketKey = question.type && buckets[question.type as keyof typeof buckets]
      ? (question.type as keyof typeof buckets)
      : 'other';
    buckets[bucketKey].push(question);
  });

  const missingTypes = new Set<string>();
  if (buckets.behavioral.length === 0) missingTypes.add('behavioral');
  if ((opts.interviewType === 'mixed' || opts.interviewType === 'system-design') && buckets['system-design'].length === 0) {
    missingTypes.add('system-design');
  }
  const wantsTechnical = opts.interviewType === 'mixed' || opts.interviewType === 'technical' || opts.interviewType === 'system-design';
  if (wantsTechnical && buckets.coding.length === 0) missingTypes.add('coding');
  if (wantsTechnical && buckets.dsa.length === 0) missingTypes.add('dsa');

  if (missingTypes.size) {
    const fallbackPool = generateLocalQuestions({
      role: opts.role,
      interviewType: 'mixed',
      difficulty: opts.difficulty as any,
      company: opts.company,
      count: Math.max(missingTypes.size * 2, opts.count)
    });

    for (const fallback of fallbackPool) {
      const normalized = normalizeQuestion(fallback, defaults);
      if (!unique.has(normalized.id)) {
        unique.set(normalized.id, normalized);
        const bucketKey = normalized.type && buckets[normalized.type as keyof typeof buckets]
          ? (normalized.type as keyof typeof buckets)
          : 'other';
        buckets[bucketKey].push(normalized);
      }
      if (missingTypes.delete(normalized.type)) {
        if (!missingTypes.size) {
          break;
        }
      }
    }
  }

  const sequence: NormalizedQuestion[] = [];
  const pushFrom = (typeKey: 'behavioral' | 'system-design' | 'coding' | 'dsa' | 'other') => {
    const bucket = buckets[typeKey];
    if (bucket && bucket.length) {
      const next = bucket.shift()!;
      sequence.push(next);
      return true;
    }
    return false;
  };

  const introPrioritySeed: Array<'behavioral' | 'system-design' | 'coding' | 'dsa'> = ['behavioral'];
  if (opts.interviewType !== 'behavioral') {
    introPrioritySeed.push('system-design');
  }
  if (wantsTechnical) {
    introPrioritySeed.push('coding', 'dsa');
  }
  const introPriority = Array.from(new Set(introPrioritySeed));

  introPriority.forEach(typeKey => {
    if (sequence.length < opts.count) {
      pushFrom(typeKey);
    }
  });

  const cycleOrder: Array<'behavioral' | 'system-design' | 'coding' | 'dsa'> = ['behavioral', 'system-design', 'coding', 'dsa'];
  let guard = 0;
  while (sequence.length < opts.count && guard < opts.count * cycleOrder.length) {
    const typeKey = cycleOrder[guard % cycleOrder.length];
    pushFrom(typeKey);
    const remainingBuckets = cycleOrder.some(type => buckets[type]?.length);
    if (!remainingBuckets) break;
    guard++;
  }

  if (sequence.length < opts.count && buckets.other.length) {
    while (sequence.length < opts.count && buckets.other.length) {
      sequence.push(buckets.other.shift()!);
    }
  }

  if (sequence.length < opts.count) {
    const missing = opts.count - sequence.length;
    const extras = generateLocalQuestions({
      role: opts.role,
      interviewType: opts.interviewType as any,
      difficulty: opts.difficulty as any,
      company: opts.company,
      count: missing
    });
    extras.forEach(extra => {
      const normalized = normalizeQuestion(extra, defaults);
      if (!sequence.some(q => q.id === normalized.id)) {
        sequence.push(normalized);
      }
    });
  }

  return sequence.slice(0, opts.count);
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

  // Prefer AI-generated questions first (with timeout + graceful fallback)
  let questions: any[] = [];
  if (geminiAI) {
    try {
      const aiQuestions = await withTimeout(
        geminiAI.generateStructuredQuestions({
        company: profile.targetCompany,
        role: profile.role,
        interviewType: profile.interviewType as any,
        difficulty: (difficulty as any) || 'medium',
        count: questionCount
      }),
        7000
      );
      if (aiQuestions && aiQuestions.length) {
        // Persist generated so they are queryable
        try {
          await questionsCollection.insertMany(
            aiQuestions.map(q => ({ ...q, createdAt: new Date(), updatedAt: new Date() })) as any,
            { ordered: false } as any
          );
        } catch (e) {
          // Ignore duplicate key or schema issues; continue with generated list
          console.warn('Non-fatal insertMany issue for AI questions:', (e as any)?.message);
        }
        // Diversify: ensure a mix of types (intro behavioral/system-design then technical)
        const byType = {
          behavioral: [] as any[],
          'system-design': [] as any[],
          coding: [] as any[],
          dsa: [] as any[]
        } as any;
        for (const q of aiQuestions as any[]) { (byType[q.type] || (byType[q.type] = [])).push(q); }
        const ordered: any[] = [];
        // intro types first
        ordered.push(...byType['behavioral'].slice(0,1));
        ordered.push(...byType['system-design'].slice(0,1));
        // then technical
        const remaining = aiQuestions.filter(q => !ordered.includes(q));
        ordered.push(...remaining);
        questions = ordered.slice(0, questionCount);
      }
    } catch (e) {
      console.error('AI question generation failed:', e);
    }
  }

  // Fallback to DB if AI unavailable or failed; exclude noisy seed like "Two Sum"
  if (questions.length === 0) {
    const questionFilters: any = { title: { $ne: 'Two Sum' } };
    if (profile.role) questionFilters.roles = { $in: [profile.role] };
    if (profile.targetCompany) questionFilters.companies = { $in: [profile.targetCompany] };
    if (difficulty) questionFilters.difficulty = difficulty;

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

    // Try strict filters first
    questions = await questionsCollection
      .find(questionFilters)
      .sort({ updatedAt: -1 })
      .limit(questionCount)
      .toArray();

    // Relax type if still empty
    if (questions.length === 0) {
      const relaxed = { ...questionFilters } as any;
      delete relaxed.type;
      questions = await questionsCollection
        .find(relaxed)
        .sort({ updatedAt: -1 })
        .limit(questionCount)
        .toArray();
    }
  }

  if (questions.length === 0) {
    // Final safety: generate local questions so API never fails
    questions = generateLocalQuestions({
      role: profile.role,
      interviewType: profile.interviewType as any,
      difficulty: difficulty as any,
      company: profile.targetCompany,
      count: questionCount
    });
  }

  // Normalize and diversify question set to simulate full interview flow
  questions = diversifyQuestionSet(questions, {
    count: questionCount,
    role: profile.role,
    interviewType: profile.interviewType,
    difficulty,
    company: profile.targetCompany
  });

  // Persist any newly generated questions (local or AI) for future reuse
  const newQuestionsToPersist = questions.filter(q => q.source && ['ai', 'local'].includes(q.source));
  if (newQuestionsToPersist.length) {
    try {
      await questionsCollection.insertMany(
        newQuestionsToPersist.map(q => ({
          ...q,
          createdAt: q.createdAt || new Date(),
          updatedAt: new Date()
        })) as any,
        { ordered: false } as any
      );
    } catch (e) {
      console.warn('Non-fatal question persistence issue:', (e as any)?.message);
    }
  }

    const questionSnapshots = questions.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      type: q.type,
      difficulty: q.difficulty,
      category: q.category,
      tags: q.tags,
      timeLimit: q.timeLimit
    }));

    // Create new session
    const newSession: Omit<InterviewSession, '_id'> = {
      userId,
      status: 'setup',
      currentPhase: 'intro',
      questionIds: questions.map(q => q.id),
      questionSnapshots,
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
        questionSnapshots: newSession.questionSnapshots,
        currentQuestionIndex: newSession.currentQuestionIndex,
        createdAt: newSession.createdAt,
        updatedAt: newSession.updatedAt
      },
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
        samples: (q as any).samples,
        timeLimit: q.timeLimit
      }))
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

    const session = await sessionsCollection.findOne({ _id: new ObjectId(sessionId) });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (String(session.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

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
        questionSnapshots: session.questionSnapshots,
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

    // First, ensure the session exists
    const existing = await sessionsCollection.findOne({ _id: new ObjectId(sessionId) });
    if (!existing) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result: any = await sessionsCollection.findOneAndUpdate(
      { _id: new ObjectId(sessionId) },
      { 
        $set: { 
          status: 'active',
          startTime: new Date(),
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' as any }
    );

    res.status(200).json({
      message: 'Interview started successfully',
      session: {
        id: (result as any)?.value?._id?.toString() || existing._id?.toString(),
        status: (result as any)?.value?.status || 'active',
        startTime: (result as any)?.value?.startTime || new Date()
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

    const filters: any = { title: { $ne: 'Two Sum' } };
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
        samples: (q as any).samples,
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
    const session = await sessionsCollection.findOne({ _id: new ObjectId(sessionId) });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (String(session.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

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
    const session = await sessionsCollection.findOne({ _id: new ObjectId(sessionId) });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (String(session.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

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

    // Ensure the session exists and belongs to the user
    const existingSession = await sessionsCollection.findOne({ _id: new ObjectId(sessionId) });
    if (!existingSession) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (String(existingSession.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

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

    const result: any = await sessionsCollection.findOneAndUpdate(
      { _id: new ObjectId(sessionId) },
      { 
        $set: { 
          status: 'completed',
          endTime,
          totalDuration,
          score: overallScore,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' as any }
    );

    if (!result || !result.value) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json({
      message: 'Interview completed successfully',
      session: {
        id: (result as any).value._id?.toString(),
        status: (result as any).value.status,
        endTime: (result as any).value.endTime,
        totalDuration: (result as any).value.totalDuration,
        score: (result as any).value.score
      }
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed interview results
router.get('/sessions/:sessionId/results', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).userId;

    const db = await getDatabase();
    const sessionsCollection = db.collection<InterviewSession>('interview_sessions');
    const evaluationsCollection = db.collection<QuestionEvaluationDoc>('question_evaluations');
    const questionsCollection = db.collection<Question>('questions');

    const session = await sessionsCollection.findOne({ _id: new ObjectId(sessionId) });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (String(session.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const evaluations = await evaluationsCollection
      .find({ sessionId: new ObjectId(sessionId) })
      .sort({ createdAt: 1 })
      .toArray();

    const evaluationSummaries = evaluations.map(evaluation => ({
      questionId: evaluation.questionId,
      scores: evaluation.scores,
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      timeSpent: evaluation.timeSpent,
      hintsUsed: evaluation.hintsUsed
    }));

    let score = session.score;
    if (!score) {
      score = ScoringService.calculateInterviewScore(evaluationSummaries as any);
      await sessionsCollection.updateOne(
        { _id: new ObjectId(sessionId) },
        { $set: { score, updatedAt: new Date() } }
      );
    }

    const questionIds = Array.from(new Set<string>([
      ...(session.questionIds || []),
      ...evaluations.map(e => e.questionId)
    ]));

    const questionDocs = await questionsCollection
      .find({ id: { $in: questionIds } })
      .toArray();

    const questionMap = new Map<string, any>();
    (session.questionSnapshots || []).forEach(snapshot => {
      questionMap.set(snapshot.id, snapshot);
    });
    questionDocs.forEach(doc => {
      questionMap.set(doc.id, {
        id: doc.id,
        title: doc.title,
        description: doc.description,
        type: doc.type,
        difficulty: doc.difficulty,
        category: doc.category,
        tags: doc.tags,
        timeLimit: doc.timeLimit,
        samples: (doc as any).samples,
        testCases: doc.testCases
      });
    });

    const evaluationDetails = evaluations.map(evaluation => ({
      id: evaluation._id?.toString(),
      questionId: evaluation.questionId,
      question: questionMap.get(evaluation.questionId) || null,
      scores: evaluation.scores,
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback,
      timeSpent: evaluation.timeSpent,
      hintsUsed: evaluation.hintsUsed,
      codeSubmitted: evaluation.codeSubmitted,
      language: evaluation.language,
      executionResult: evaluation.executionResult,
      createdAt: evaluation.createdAt
    }));

    res.status(200).json({
      session: {
        id: session._id?.toString(),
        userId: session.userId,
        status: session.status,
        currentPhase: session.currentPhase,
        questionIds: session.questionIds,
        questionSnapshots: session.questionSnapshots,
        currentQuestionIndex: session.currentQuestionIndex,
        startTime: session.startTime,
        endTime: session.endTime,
        totalDuration: session.totalDuration,
        score
      },
      score,
      evaluations: evaluationDetails
    });
  } catch (error) {
    console.error('Get results error:', error);
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

      const result = await analyticsCollection.insertOne(defaultAnalytics as any);
      analytics = { ...(defaultAnalytics as any), _id: result.insertedId } as any;
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
