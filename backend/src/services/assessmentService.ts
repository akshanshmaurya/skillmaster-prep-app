import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import {
  AssessmentSession,
  AssessmentQuestion,
  AssessmentQuestionWithMeta,
  AssessmentResponse,
  AssessmentTrack,
  AssessmentTopic,
  AssessmentDifficulty,
  AssessmentSummary,
  AssessmentHistoryItem
} from '../models/Assessment';
import { ASSESSMENT_QUESTION_BANK } from './assessmentQuestionBank';
import { GeminiAIService } from './geminiAI';
import { User } from '../models/User';

const COLLECTION_NAME = 'assessmentSessions';

export type AssessmentPreview = {
  track: AssessmentTrack;
  label: string;
  description: string;
  topics: Array<{
    id: AssessmentTopic;
    label: string;
    description: string;
    difficulties: AssessmentDifficulty[];
  }>;
};

type UserFacingQuestion = Pick<AssessmentQuestionWithMeta,
  'id' | 'prompt' | 'answerType' | 'options' | 'tags' | 'estimatedTime' | 'order'
> & { difficulty: AssessmentDifficulty };

type SubmitAnswerPayload = {
  questionId: string;
  answer: string | string[];
};

type AssessmentEvaluationResult = {
  sessionId: string;
  track: AssessmentTrack;
  topic: AssessmentTopic;
  difficulty: AssessmentDifficulty;
  accuracy: number;
  score: number;
  summary: AssessmentSummary;
  results: Array<{
    questionId: string;
    prompt: string;
    answerType: AssessmentQuestion['answerType'];
    options?: string[];
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    explanation: string;
    tags: string[];
    order: number;
  }>;
  createdAt: Date;
};

const TRACK_DEFINITIONS: AssessmentPreview[] = [
  {
    track: 'soft-skills',
    label: 'Soft Skills Aptitude',
    description: 'Blend of quantitative aptitude, verbal reasoning, and analytical puzzles to strengthen interview readiness.',
    topics: [
      {
        id: 'quant',
        label: 'Quantitative Aptitude',
        description: 'Speed maths, ratios, percentages, and core numeracy drills.',
        difficulties: ['beginner', 'intermediate', 'advanced']
      },
      {
        id: 'verbal',
        label: 'Verbal Ability',
        description: 'Vocabulary, grammar, tone detection, and paraphrasing mastery.',
        difficulties: ['beginner', 'intermediate', 'advanced']
      },
      {
        id: 'aptitude',
        label: 'Logical Aptitude',
        description: 'Series, direction sense, time & work, and critical thinking mixers.',
        difficulties: ['beginner', 'intermediate', 'advanced']
      }
    ]
  },
  {
    track: 'technical-skills',
    label: 'Technical Core Sprint',
    description: 'Coding, cloud, and CS fundamentals commonly probed by top product companies.',
    topics: [
      {
        id: 'coding',
        label: 'Coding Fundamentals',
        description: 'Data structures, algorithmic complexity, and system design patterns.',
        difficulties: ['beginner', 'intermediate', 'advanced']
      },
      {
        id: 'cloud',
        label: 'Cloud & DevOps',
        description: 'Cloud models, AWS basics, deployment patterns, and reliability.',
        difficulties: ['beginner', 'intermediate', 'advanced']
      },
      {
        id: 'dbms',
        label: 'Databases',
        description: 'Relational design, SQL, indexing, and transactions.',
        difficulties: ['beginner', 'intermediate', 'advanced']
      },
      {
        id: 'operating-systems',
        label: 'Operating Systems',
        description: 'Scheduling, memory management, and architecture concepts.',
        difficulties: ['beginner', 'intermediate', 'advanced']
      },
      {
        id: 'networks',
        label: 'Computer Networks',
        description: 'Protocol stacks, routing, performance, and scaling on the wire.',
        difficulties: ['beginner', 'intermediate', 'advanced']
      },
      {
        id: 'system-design',
        label: 'System Design',
        description: 'Scalability patterns, consistency, and real-world architecture trade-offs.',
        difficulties: ['beginner', 'intermediate', 'advanced']
      }
    ]
  }
];

const topicToTrack: Record<AssessmentTopic, AssessmentTrack> = {
  quant: 'soft-skills',
  verbal: 'soft-skills',
  aptitude: 'soft-skills',
  coding: 'technical-skills',
  cloud: 'technical-skills',
  dbms: 'technical-skills',
  'operating-systems': 'technical-skills',
  networks: 'technical-skills',
  'system-design': 'technical-skills'
};

function sanitizeQuestion(question: AssessmentQuestionWithMeta): UserFacingQuestion {
  const { id, prompt, answerType, options, tags, estimatedTime, order, difficulty } = question;
  return { id, prompt, answerType, options, tags, estimatedTime, order, difficulty };
}

function normalizeString(value: string): string {
  return value?.toString().trim().toLowerCase();
}

function sortAnswerArray(values: string[]): string[] {
  return values.map((value) => value.trim()).sort((a, b) => a.localeCompare(b));
}

function normalizeUserAnswer(
  answer: string | string[] | undefined,
  answerType: AssessmentQuestion['answerType']
): string | string[] {
  if (answerType === 'multiple-choice') {
    if (Array.isArray(answer)) {
      return sortAnswerArray(answer);
    }
    if (typeof answer === 'string' && answer) {
      return sortAnswerArray(answer.split(',').map((value) => value.trim()));
    }
    return [];
  }

  if (typeof answer === 'string') {
    return answer.trim();
  }

  return '';
}

function isAnswerCorrect(
  userAnswer: string | string[],
  correctAnswer: string | string[],
  answerType: AssessmentQuestion['answerType']
): boolean {
  if (answerType === 'multiple-choice') {
    const expected = Array.isArray(correctAnswer) ? sortAnswerArray(correctAnswer) : [];
    const provided = Array.isArray(userAnswer) ? userAnswer : [];
    if (expected.length !== provided.length) {
      return false;
    }
    return expected.every((value, index) => normalizeString(value) === normalizeString(provided[index]));
  }

  if (typeof correctAnswer === 'string' && typeof userAnswer === 'string') {
    return normalizeString(correctAnswer) === normalizeString(userAnswer);
  }

  return false;
}

function buildFallbackSummary(
  track: AssessmentTrack,
  topic: AssessmentTopic,
  accuracy: number,
  results: Array<{ isCorrect: boolean; tags: string[] }>
): AssessmentSummary {
  const strengths: string[] = [];
  const opportunities: string[] = [];
  const improvements: string[] = [];
  const suggestions: string[] = [];

  if (accuracy >= 0.85) {
    strengths.push('Excellent accuracy—keep challenging yourself with mock interviews.');
  } else if (accuracy >= 0.65) {
    strengths.push('Solid fundamentals with room to polish edge scenarios.');
  } else {
    strengths.push('Good momentum—consistency will raise your comfort under pressure.');
  }

  const correctTags = new Set<string>();
  const missedTags = new Set<string>();
  results.forEach((result) => {
    const bucket = result.isCorrect ? correctTags : missedTags;
    result.tags.forEach((tag) => bucket.add(tag));
  });

  if (correctTags.size > 0) {
    strengths.push(`You handled ${Array.from(correctTags).slice(0, 2).join(', ')} questions confidently.`);
  }

  if (missedTags.size > 0) {
    opportunities.push(`Revisit ${Array.from(missedTags).slice(0, 3).join(', ')} to tighten your mastery.`);
    improvements.push('Schedule focused drills on missed sub-topics and summarise the correct approaches.');
  } else {
    opportunities.push('No obvious weak spots—move on to timed drills or mixed-topic sets.');
  }

  improvements.push('Note down why answers were right or wrong immediately after reviewing solutions.');

  suggestions.push('Book another mixed assessment in 3-4 days to benchmark improvement.');
  suggestions.push(track === 'soft-skills'
    ? 'Narrate reasoning aloud to strengthen communication and analytical clarity.'
    : 'Translate insights into mini-project tweaks or code kata sessions.');

  suggestions.push(`Compile a quick-reference sheet for ${topic} concepts and revisit before interviews.`);

  return { strengths, opportunities, improvements, suggestions };
}

function sampleFallbackQuestions(topic: AssessmentTopic, difficulty: AssessmentDifficulty, count: number): AssessmentQuestion[] {
  const bank = ASSESSMENT_QUESTION_BANK[topic] || [];
  const primary = bank.filter((question) => question.difficulty === difficulty);
  const secondary = bank.filter((question) => question.difficulty !== difficulty);
  const pool = [...primary, ...secondary];

  if (!pool.length) {
    return [];
  }

  const questions: AssessmentQuestion[] = [];
  let index = 0;
  while (questions.length < count) {
    const question = pool[index % pool.length];
    questions.push({ ...question, id: `${question.id}-${questions.length + 1}` });
    index += 1;
  }

  return questions.slice(0, count);
}

function mapAIQuestions(
  track: AssessmentTrack,
  topic: AssessmentTopic,
  difficulty: AssessmentDifficulty,
  questions: Array<{
    id: string;
    prompt: string;
    answerType: AssessmentQuestion['answerType'];
    options?: string[];
    correctAnswer: string | string[];
    explanation: string;
    tags: string[];
    estimatedTime: number;
  }>
): AssessmentQuestion[] {
  return questions.map((question, index) => ({
    id: question.id || `${topic}-ai-${Date.now()}-${index + 1}`,
    track,
    topic,
    difficulty,
    prompt: question.prompt,
    answerType: question.answerType,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    tags: question.tags,
    estimatedTime: question.estimatedTime,
    source: 'ai'
  }));
}

function toObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch (error) {
    console.warn('Invalid ObjectId for user', id, error);
    return null;
  }
}

export class AssessmentService {
  static getTracks(): AssessmentPreview[] {
    return TRACK_DEFINITIONS;
  }

  static validateTopic(track: AssessmentTrack, topic: AssessmentTopic): void {
    if (topicToTrack[topic] !== track) {
      throw new Error('Topic does not belong to selected track');
    }
  }

  static async createSession(opts: {
    userId: string;
    track: AssessmentTrack;
    topic: AssessmentTopic;
    difficulty: AssessmentDifficulty;
    count: number;
    geminiAI?: GeminiAIService | null;
  }): Promise<{ session: AssessmentSession; questionsForUser: UserFacingQuestion[] }> {
    const { userId, track, topic, difficulty } = opts;
    AssessmentService.validateTopic(track, topic);
    const count = Math.max(1, Math.min(opts.count || 12, 20));

    const db = await getDatabase();
    const collection = db.collection<AssessmentSession>(COLLECTION_NAME);

    let questions: AssessmentQuestion[] = [];

    if (opts.geminiAI) {
      try {
        const aiQuestions = await opts.geminiAI.generateAssessmentQuestions({
          track,
          topic,
          difficulty,
          count
        });
        if (aiQuestions?.length) {
          questions = mapAIQuestions(track, topic, difficulty, aiQuestions);
        }
      } catch (error) {
        console.warn('Falling back to curated assessment bank:', error);
      }
    }

    if (!questions.length) {
      questions = sampleFallbackQuestions(topic, difficulty, count);
    }

    if (!questions.length) {
      throw new Error('Unable to generate assessment questions at this time.');
    }

    const orderedQuestions: AssessmentQuestionWithMeta[] = questions.slice(0, count).map((question, index) => ({
      ...question,
      order: index
    }));

    const sessionObjectId = new ObjectId();
    const sessionId = sessionObjectId.toHexString();
    const now = new Date();

    const session: AssessmentSession = {
      _id: sessionObjectId,
      sessionId,
      userId,
      track,
      topic,
      difficulty,
      questions: orderedQuestions,
      createdAt: now,
      updatedAt: now,
      status: 'active'
    };

    await collection.insertOne(session);

    return {
      session,
      questionsForUser: orderedQuestions.map(sanitizeQuestion)
    };
  }

  static async getSession(opts: { userId: string; sessionId: string }): Promise<AssessmentSession | null> {
    const db = await getDatabase();
    const collection = db.collection<AssessmentSession>(COLLECTION_NAME);
    return collection.findOne({ sessionId: opts.sessionId, userId: opts.userId });
  }

  static async getHistory(opts: { userId: string; limit?: number }): Promise<AssessmentHistoryItem[]> {
    const db = await getDatabase();
    const collection = db.collection<AssessmentSession>(COLLECTION_NAME);
    const cursor = collection
      .find({ userId: opts.userId, status: 'completed' })
      .sort({ updatedAt: -1 })
      .limit(Math.max(1, Math.min(opts.limit ?? 15, 50)));

    const sessions = await cursor.toArray();
    return sessions.map((session) => ({
      sessionId: session.sessionId,
      track: session.track,
      topic: session.topic,
      difficulty: session.difficulty,
      score: session.score ?? 0,
      accuracy: session.accuracy ?? 0,
      createdAt: session.updatedAt ?? session.createdAt
    }));
  }

  static async submitSession(opts: {
    userId: string;
    sessionId: string;
    answers: SubmitAnswerPayload[];
    geminiAI?: GeminiAIService | null;
  }): Promise<AssessmentEvaluationResult> {
    const { userId, sessionId, answers, geminiAI } = opts;

    const db = await getDatabase();
    const collection = db.collection<AssessmentSession>(COLLECTION_NAME);

    const session = await collection.findOne({ sessionId, userId });
    if (!session) {
      throw new Error('Assessment session not found.');
    }

    if (session.status === 'completed' && session.responses) {
      return AssessmentService.buildEvaluationFromSession(session);
    }

    const responseMap = new Map<string, SubmitAnswerPayload>();
    answers.forEach((answer) => responseMap.set(answer.questionId, answer));

    const responses: AssessmentResponse[] = session.questions.map((question) => {
      const payload = responseMap.get(question.id);
      const normalizedAnswer = normalizeUserAnswer(payload?.answer, question.answerType);
      const expectedAnswer = question.answerType === 'multiple-choice'
        ? (Array.isArray(question.correctAnswer) ? sortAnswerArray(question.correctAnswer) : [])
        : question.correctAnswer;
      const providedComparable = question.answerType === 'multiple-choice'
        ? (Array.isArray(normalizedAnswer) ? normalizedAnswer : [])
        : normalizedAnswer;
      const isCorrect = isAnswerCorrect(providedComparable, expectedAnswer, question.answerType);

      return {
        questionId: question.id,
        userAnswer: normalizedAnswer,
        isCorrect,
        score: isCorrect ? 1 : 0
      };
    });

    const totalQuestions = responses.length || 1;
    const totalScore = responses.reduce((sum, response) => sum + response.score, 0);
    const accuracy = totalScore / totalQuestions;
    const score = Math.round(accuracy * 100);

    const fallbackSummary = buildFallbackSummary(
      session.track,
      session.topic,
      accuracy,
      session.questions.map((question, index) => ({
        isCorrect: responses[index]?.isCorrect ?? false,
        tags: question.tags
      }))
    );

    let summary: AssessmentSummary = fallbackSummary;
    if (geminiAI) {
      try {
        const aiSummary = await geminiAI.generateAssessmentFeedback({
          track: session.track,
          topic: session.topic,
          difficulty: session.difficulty,
          accuracy,
          results: session.questions.map((question, index) => ({
            prompt: question.prompt,
            userAnswer: responses[index]?.userAnswer ?? '',
            correctAnswer: question.correctAnswer,
            isCorrect: responses[index]?.isCorrect ?? false,
            explanation: question.explanation
          }))
        });
        if (aiSummary) {
          summary = aiSummary;
        }
      } catch (error) {
        console.warn('Unable to fetch AI feedback for assessment session:', error);
      }
    }

    const updatedSession: AssessmentSession = {
      ...session,
      responses,
      score,
      accuracy,
      summary: {
        ...summary,
        totalQuestions,
        answeredQuestions: responses.filter((response) => {
          if (typeof response.userAnswer === 'string') {
            return response.userAnswer.trim().length > 0;
          }
          return Array.isArray(response.userAnswer) && response.userAnswer.length > 0;
        }).length
      },
      status: 'completed',
      updatedAt: new Date()
    };

    await collection.updateOne(
      { _id: session._id },
      {
        $set: {
          responses: updatedSession.responses,
          score: updatedSession.score,
          accuracy: updatedSession.accuracy,
          summary: updatedSession.summary,
          status: updatedSession.status,
          updatedAt: updatedSession.updatedAt
        }
      }
    );

    await AssessmentService.updateUserPerformance({
      userId,
      topic: session.topic,
      track: session.track,
      score,
      accuracy,
      createdAt: updatedSession.updatedAt
    });

    return AssessmentService.buildEvaluationFromSession(updatedSession);
  }

  private static buildEvaluationFromSession(session: AssessmentSession): AssessmentEvaluationResult {
    const summary = session.summary || {
      strengths: [],
      opportunities: [],
      improvements: [],
      suggestions: [],
      totalQuestions: session.questions.length,
      answeredQuestions: session.questions.length
    };

    return {
      sessionId: session.sessionId,
      track: session.track,
      topic: session.topic,
      difficulty: session.difficulty,
      accuracy: session.accuracy ?? 0,
      score: session.score ?? 0,
      summary: {
        strengths: summary.strengths,
        opportunities: summary.opportunities,
        improvements: summary.improvements,
        suggestions: summary.suggestions
      },
      results: session.questions.map((question, index) => ({
        questionId: question.id,
        prompt: question.prompt,
        answerType: question.answerType,
        options: question.options,
        userAnswer: session.responses?.[index]?.userAnswer ?? '',
        correctAnswer: question.correctAnswer,
        isCorrect: session.responses?.[index]?.isCorrect ?? false,
        explanation: question.explanation,
        tags: question.tags,
        order: question.order
      })),
      createdAt: session.createdAt
    };
  }

  private static async updateUserPerformance(opts: {
    userId: string;
    track: AssessmentTrack;
    topic: AssessmentTopic;
    score: number;
    accuracy: number;
    createdAt: Date;
  }): Promise<void> {
    const db = await getDatabase();
    const users = db.collection<User>('users');
    const objectId = toObjectId(opts.userId);

    if (!objectId) {
      return;
    }

    const performanceField = `latestTestScores.${opts.topic}`;

    await users.updateOne(
      { _id: objectId },
      {
        $set: {
          [performanceField]: {
            track: opts.track,
            topic: opts.topic,
            score: opts.score,
            accuracy: opts.accuracy,
            updatedAt: opts.createdAt
          }
        },
        $inc: {
          testsCompleted: 1,
          totalScore: opts.score
        }
      },
      { upsert: false }
    );
  }
}
