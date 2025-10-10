import { ObjectId } from 'mongodb';

export type AssessmentTrack = 'soft-skills' | 'technical-skills';
export type SoftSkillTopic = 'quant' | 'verbal' | 'aptitude';
export type TechnicalSkillTopic = 'coding' | 'cloud' | 'dbms' | 'operating-systems' | 'networks' | 'system-design';
export type AssessmentTopic = SoftSkillTopic | TechnicalSkillTopic;
export type AssessmentDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type AssessmentAnswerType = 'single-choice' | 'multiple-choice' | 'short-text';

export interface AssessmentQuestion {
  id: string;
  track: AssessmentTrack;
  topic: AssessmentTopic;
  difficulty: AssessmentDifficulty;
  prompt: string;
  answerType: AssessmentAnswerType;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  tags: string[];
  source: 'ai' | 'fallback';
  estimatedTime: number;
}

export interface AssessmentQuestionWithMeta extends AssessmentQuestion {
  order: number;
}

export interface AssessmentResponse {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  score: number; // 0-1
}

export interface AssessmentSummary {
  strengths: string[];
  opportunities: string[];
  improvements: string[];
  suggestions: string[];
}

export interface AssessmentSession {
  _id?: ObjectId;
  sessionId: string;
  userId: string;
  track: AssessmentTrack;
  topic: AssessmentTopic;
  difficulty: AssessmentDifficulty;
  questions: AssessmentQuestionWithMeta[];
  responses?: AssessmentResponse[];
  score?: number;
  accuracy?: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed';
  summary?: AssessmentSummary & {
    totalQuestions: number;
    answeredQuestions: number;
  };
}

export interface AssessmentHistoryItem {
  sessionId: string;
  track: AssessmentTrack;
  topic: AssessmentTopic;
  difficulty: AssessmentDifficulty;
  score: number;
  accuracy: number;
  createdAt: Date;
}
