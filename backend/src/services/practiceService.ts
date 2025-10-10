import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import {
  PracticeSession,
  PracticeQuestion,
  PracticeQuestionWithMeta,
  PracticeResponse,
  PracticeTopic,
  PracticeDifficulty,
  PracticeAIResponse
} from '../models/Practice';
import { PRACTICE_QUESTION_BANK } from './practiceQuestionBank';
import { GeminiAIService } from './geminiAI';

const COLLECTION_NAME = 'practiceSessions';

type UserFacingQuestion = Pick<PracticeQuestionWithMeta,
  'id' | 'prompt' | 'answerType' | 'options' | 'tags' | 'estimatedTime' | 'order'
> & {
  difficulty: PracticeDifficulty;
};

type SubmitAnswerPayload = {
  questionId: string;
  answer: string | string[];
};

type PracticeEvaluationResult = {
  sessionId: string;
  accuracy: number;
  score: number;
  summary: PracticeAIResponse;
  results: Array<{
    questionId: string;
    prompt: string;
    answerType: PracticeQuestion['answerType'];
    options?: string[];
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    explanation: string;
    tags: string[];
    order: number;
  }>;
};

const topicLabels: Record<PracticeTopic, string> = {
  quant: 'Quantitative Aptitude',
  verbal: 'Verbal Ability',
  aptitude: 'General Aptitude',
  reasoning: 'Logical Reasoning',
  games: 'Brain Games'
};

function sanitizeQuestion(question: PracticeQuestionWithMeta): UserFacingQuestion {
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
  answerType: PracticeQuestion['answerType']
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
  answerType: PracticeQuestion['answerType']
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

function buildFallbackFeedback(
  topic: PracticeTopic,
  difficulty: PracticeDifficulty,
  accuracy: number,
  questionResults: Array<{ isCorrect: boolean; tags: string[]; prompt: string }>
): PracticeAIResponse {
  const incorrectTags = new Set<string>();
  const correctTags = new Set<string>();

  questionResults.forEach((result) => {
    const collection = result.isCorrect ? correctTags : incorrectTags;
    result.tags.forEach((tag) => collection.add(tag));
  });

  const strengths: string[] = [];
  if (accuracy >= 0.85) {
    strengths.push('Excellent accuracy—your fundamentals on this topic are interview ready.');
  } else if (accuracy >= 0.65) {
    strengths.push('Solid progress—most concepts are sticking, especially under time pressure.');
  } else if (accuracy >= 0.45) {
    strengths.push('You are building momentum; a few focused drills will boost confidence.');
  } else {
    strengths.push('Good effort starting this set—consistent practice will unlock major gains.');
  }

  if (correctTags.size) {
    strengths.push(`You handled ${Array.from(correctTags).slice(0, 2).join(', ')} questions well.`);
  }

  const weaknesses: string[] = [];
  if (incorrectTags.size) {
    weaknesses.push(`Concepts needing review: ${Array.from(incorrectTags).slice(0, 3).join(', ')}.`);
  } else {
    weaknesses.push('No glaring weak spots surfaced in this set.');
  }

  const improvements: string[] = [];
  if (incorrectTags.size) {
    improvements.push('Revisit theory notes and solved examples for the topics you missed.');
  }
  improvements.push('Simulate timed mini-quizzes to reinforce recall speed.');

  const suggestions: string[] = [
    `Schedule another ${topicLabels[topic]} practice in the next 48 hours to lock concepts in.`,
    `Track tricky questions in a log—write why the correct option works to deepen retention.`,
  ];

  if (difficulty === 'advanced') {
    suggestions.push('Blend in mock interviews to apply these concepts under realistic pressure.');
  }

  return { strengths, weaknesses, improvements, suggestions };
}

function sampleFallbackQuestions(
  topic: PracticeTopic,
  difficulty: PracticeDifficulty,
  count: number
): PracticeQuestion[] {
  const bank = PRACTICE_QUESTION_BANK[topic] || [];
  const primary = bank.filter((question) => question.difficulty === difficulty);
  const backup = bank.filter((question) => question.difficulty !== difficulty);
  const combined = [...primary, ...backup];

  if (!combined.length) {
    return [];
  }

  const questions: PracticeQuestion[] = [];
  let index = 0;
  while (questions.length < count) {
    const question = combined[index % combined.length];
    questions.push({ ...question, id: `${question.id}-${questions.length + 1}` });
    index += 1;
  }

  return questions.slice(0, count);
}

function mapAIQuestions(
  topic: PracticeTopic,
  difficulty: PracticeDifficulty,
  questions: Array<{
    id: string;
    prompt: string;
    answerType: PracticeQuestion['answerType'];
    options?: string[];
    correctAnswer: string | string[];
    explanation: string;
    tags: string[];
    estimatedTime: number;
  }>
): PracticeQuestion[] {
  return questions.map((question, index) => ({
    id: question.id || `${topic}-ai-${Date.now()}-${index + 1}`,
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

export class PracticeService {
  static async createSession(opts: {
    userId: string;
    topic: PracticeTopic;
    difficulty: PracticeDifficulty;
    count: number;
    geminiAI?: GeminiAIService | null;
  }): Promise<{ session: PracticeSession; questionsForUser: UserFacingQuestion[] }> {
    const { userId, topic, difficulty } = opts;
    const count = Math.max(1, Math.min(opts.count || 10, 20));

    const db = await getDatabase();
    const collection = db.collection<PracticeSession>(COLLECTION_NAME);

    let questions: PracticeQuestion[] = [];

    if (opts.geminiAI) {
      try {
        const aiQuestions = await opts.geminiAI.generatePracticeQuestions({
          topic,
          difficulty,
          count
        });
        if (aiQuestions?.length) {
          questions = mapAIQuestions(topic, difficulty, aiQuestions);
        }
      } catch (error) {
        console.warn('Falling back to curated practice bank:', error);
      }
    }

    if (!questions.length) {
      questions = sampleFallbackQuestions(topic, difficulty, count).map((question) => ({
        ...question,
        source: 'fallback'
      }));
    }

    if (!questions.length) {
      throw new Error('Unable to generate practice questions at this time.');
    }

    const orderedQuestions: PracticeQuestionWithMeta[] = questions.slice(0, count).map((question, index) => ({
      ...question,
      order: index
    }));

    const sessionObjectId = new ObjectId();
    const sessionId = sessionObjectId.toHexString();
    const now = new Date();

    const session: PracticeSession = {
      _id: sessionObjectId,
      sessionId,
      userId,
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

  static async submitSession(opts: {
    userId: string;
    sessionId: string;
    answers: SubmitAnswerPayload[];
    geminiAI?: GeminiAIService | null;
  }): Promise<PracticeEvaluationResult> {
    const { userId, sessionId, answers, geminiAI } = opts;

    const db = await getDatabase();
    const collection = db.collection<PracticeSession>(COLLECTION_NAME);

    const session = await collection.findOne({ sessionId, userId });
    if (!session) {
      throw new Error('Practice session not found.');
    }

    if (session.status === 'completed' && session.responses) {
      return this.buildEvaluationFromSession(session);
    }

    const responseMap = new Map<string, SubmitAnswerPayload>();
    answers.forEach((answer) => responseMap.set(answer.questionId, answer));

    const responses: PracticeResponse[] = session.questions.map((question) => {
      const payload = responseMap.get(question.id);
      const normalizedAnswer = normalizeUserAnswer(payload?.answer, question.answerType);
      const correctAnswer = question.answerType === 'multiple-choice'
        ? (Array.isArray(question.correctAnswer) ? sortAnswerArray(question.correctAnswer) : [])
        : question.correctAnswer;
      const userAnswerComparable = question.answerType === 'multiple-choice'
        ? (Array.isArray(normalizedAnswer) ? normalizedAnswer : [])
        : normalizedAnswer;
      const isCorrect = isAnswerCorrect(userAnswerComparable, correctAnswer, question.answerType);

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

    const fallbackSummary = buildFallbackFeedback(
      session.topic,
      session.difficulty,
      accuracy,
      session.questions.map((question, index) => ({
        isCorrect: responses[index]?.isCorrect || false,
        tags: question.tags,
        prompt: question.prompt
      }))
    );

    let summary: PracticeAIResponse = fallbackSummary;
    if (geminiAI) {
      try {
        const aiSummary = await geminiAI.generatePracticeFeedback({
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
        console.warn('Unable to fetch AI feedback for practice session:', error);
      }
    }

    const updatedSession: PracticeSession = {
      ...session,
      responses,
      score,
      accuracy,
      summary: {
        ...summary,
        totalQuestions,
        answeredQuestions: responses.filter((response) => response.userAnswer !== '' && !(Array.isArray(response.userAnswer) && !response.userAnswer.length)).length
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

    return this.buildEvaluationFromSession(updatedSession);
  }

  static async getSession(opts: {
    userId: string;
    sessionId: string;
  }): Promise<{
    sessionId: string;
    topic: PracticeTopic;
    difficulty: PracticeDifficulty;
    status: PracticeSession['status'];
    createdAt: Date;
    updatedAt: Date;
    questions: UserFacingQuestion[];
    evaluation?: PracticeEvaluationResult;
  }> {
    const db = await getDatabase();
    const collection = db.collection<PracticeSession>(COLLECTION_NAME);

    const session = await collection.findOne({ sessionId: opts.sessionId, userId: opts.userId });
    if (!session) {
      throw new Error('Practice session not found.');
    }

    const base = {
      sessionId: session.sessionId,
      topic: session.topic,
      difficulty: session.difficulty,
      status: session.status,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      questions: session.questions.map(sanitizeQuestion)
    };

    if (session.status === 'completed') {
      return {
        ...base,
        evaluation: this.buildEvaluationFromSession(session)
      };
    }

    return base;
  }

  static buildEvaluationFromSession(session: PracticeSession): PracticeEvaluationResult {
    const totalQuestions = session.questions.length || 1;
    const accuracy = session.accuracy ?? (session.score ?? 0) / 100;
    const score = session.score ?? Math.round(accuracy * 100);

    const summary = session.summary ? {
      strengths: session.summary.strengths,
      weaknesses: session.summary.weaknesses,
      improvements: session.summary.improvements,
      suggestions: session.summary.suggestions
    } : buildFallbackFeedback(
      session.topic,
      session.difficulty,
      accuracy,
      session.questions.map((question, index) => ({
        isCorrect: session.responses?.[index]?.isCorrect ?? false,
        tags: question.tags,
        prompt: question.prompt
      }))
    );

    const results = session.questions.map((question, index) => {
      const response = session.responses?.[index];
      return {
        questionId: question.id,
        prompt: question.prompt,
        answerType: question.answerType,
        options: question.options,
        userAnswer: response?.userAnswer ?? (question.answerType === 'multiple-choice' ? [] : ''),
        correctAnswer: question.correctAnswer,
        isCorrect: response?.isCorrect ?? false,
        explanation: question.explanation,
        tags: question.tags,
        order: question.order
      };
    });

    return {
      sessionId: session.sessionId,
      accuracy,
      score,
      summary,
      results
    };
  }

  static listTopics() {
    return {
      topics: Object.entries(topicLabels).map(([id, name]) => ({
        id: id as PracticeTopic,
        name,
        difficulties: ['beginner', 'intermediate', 'advanced'] as PracticeDifficulty[]
      }))
    };
  }
}
