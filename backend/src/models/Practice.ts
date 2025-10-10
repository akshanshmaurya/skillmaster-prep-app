import { ObjectId } from 'mongodb';

export type PracticeTopic = 'quant' | 'verbal' | 'aptitude' | 'reasoning' | 'games';
export type PracticeDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type PracticeAnswerType = 'single-choice' | 'multiple-choice' | 'short-text';

export interface PracticeQuestion {
  id: string;
  topic: PracticeTopic;
  difficulty: PracticeDifficulty;
  prompt: string;
  answerType: PracticeAnswerType;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  tags: string[];
  source: 'ai' | 'curated' | 'fallback';
  estimatedTime: number; // minutes
}

export interface PracticeQuestionWithMeta extends PracticeQuestion {
  order: number;
}

export interface PracticeResponse {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  score: number; // 0-1 per question
  feedback?: PracticeAIResponse;
}

export interface PracticeAIResponse {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  suggestions: string[];
}

export interface PracticeSession {
  _id?: ObjectId;
  sessionId: string;
  userId: string;
  topic: PracticeTopic;
  difficulty: PracticeDifficulty;
  questions: PracticeQuestionWithMeta[];
  responses?: PracticeResponse[];
  score?: number;
  accuracy?: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed';
  summary?: PracticeAIResponse & {
    totalQuestions: number;
    answeredQuestions: number;
  };
}
