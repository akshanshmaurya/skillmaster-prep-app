import { ObjectId } from 'mongodb';

// User Profile for Interview Setup
export interface UserProfile {
  _id?: ObjectId;
  userId: string;
  role: 'swe' | 'senior-swe' | 'frontend' | 'backend' | 'fullstack' | 'devops' | 'ml-engineer';
  experienceLevel: 'fresher' | 'mid-level' | 'senior';
  targetCompany?: string;
  preferredLanguage: 'java' | 'python' | 'javascript' | 'c++' | 'c#' | 'go' | 'rust';
  interviewType: 'technical' | 'system-design' | 'behavioral' | 'mixed';
  createdAt: Date;
  updatedAt: Date;
}

// Question Model
export interface Question {
  _id?: ObjectId;
  id: string;
  title: string;
  description: string;
  type: 'dsa' | 'system-design' | 'behavioral' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  companies: string[];
  roles: string[];
  purpose?: 'technical' | 'coding' | 'system-design' | 'behavioral';
  source?: 'seed' | 'ai';
  testCases?: TestCase[];
  expectedAnswer?: string;
  hints?: string[];
  timeLimit?: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

// Interview Session Model
export interface InterviewSession {
  _id?: ObjectId;
  userId: string;
  profileId?: ObjectId;
  status: 'setup' | 'active' | 'paused' | 'completed' | 'cancelled';
  currentPhase: 'intro' | 'technical' | 'behavioral' | 'system-design' | 'questions';
  questionIds: string[];
  currentQuestionIndex: number;
  startTime?: Date;
  endTime?: Date;
  totalDuration?: number; // in seconds
  score?: InterviewScore;
  createdAt: Date;
  updatedAt: Date;
}

// Message Model (Interview Transcript)
export interface Message {
  _id?: ObjectId;
  sessionId: ObjectId;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
  questionId?: string;
  metadata?: {
    code?: string;
    language?: string;
    executionResult?: ExecutionResult;
    evaluation?: QuestionEvaluation;
  };
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  runtime?: number; // in ms
  memory?: number; // in MB
  testCasesPassed?: number;
  totalTestCases?: number;
}

export interface QuestionEvaluation {
  questionId: string;
  scores: {
    correctness: number; // 0-40
    efficiency: number; // 0-20
    clarity: number; // 0-20
    communication: number; // 0-10
    edgeCases: number; // 0-10
  };
  totalScore: number; // 0-100
  feedback: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    suggestions: string[];
  };
  timeSpent: number; // in seconds
  hintsUsed: number;
}

export interface InterviewScore {
  overall: number; // 0-100
  technical: number; // 0-100
  behavioral: number; // 0-100
  systemDesign: number; // 0-100
  communication: number; // 0-100
  problemSolving: number; // 0-100
  timeManagement: number; // 0-100
  confidence: number; // 0-100
  breakdown: {
    dsa: number;
    algorithms: number;
    dataStructures: number;
    systemDesign: number;
    behavioral: number;
    coding: number;
  };
  feedback: {
    overall: string;
    technical: string;
    behavioral: string;
    systemDesign: string;
    recommendations: string[];
  };
}

// Company Profile Model
export interface CompanyProfile {
  _id?: ObjectId;
  id: string;
  name: string;
  logo: string;
  color: string;
  focusAreas: string[];
  interviewStyle: 'technical-heavy' | 'behavioral-heavy' | 'balanced';
  questionTypes: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in minutes
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Progress Analytics Model
export interface ProgressAnalytics {
  _id?: ObjectId;
  userId: string;
  totalSessions: number;
  averageScore: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  strengths: string[];
  weaknesses: string[];
  topicBreakdown: {
    [topic: string]: {
      attempts: number;
      averageScore: number;
      lastAttempt: Date;
      improvement: number;
    };
  };
  timeSpent: number; // total in minutes
  lastSession?: Date;
  streak: number; // consecutive days
  createdAt: Date;
  updatedAt: Date;
}

// Question Evaluation Model
export interface QuestionEvaluationDoc {
  _id?: ObjectId;
  sessionId: ObjectId;
  questionId: string;
  scores: {
    correctness: number;
    efficiency: number;
    clarity: number;
    communication: number;
    edgeCases: number;
  };
  totalScore: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    suggestions: string[];
  };
  timeSpent: number; // in seconds
  hintsUsed: number;
  codeSubmitted?: string;
  language?: string;
  executionResult?: ExecutionResult;
  createdAt: Date;
}

// Request/Response Types
export interface CreateInterviewSessionRequest {
  profile: {
    role: string;
    experienceLevel: string;
    targetCompany?: string;
    preferredLanguage: string;
    interviewType: string;
  };
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string;
  code?: string;
  language?: string;
  timeSpent: number;
  hintsUsed: number;
}

export interface GetQuestionsRequest {
  role?: string;
  company?: string;
  difficulty?: string;
  type?: string;
  category?: string;
  limit?: number;
}

export interface InterviewSessionResponse {
  id: string;
  userId: string;
  status: string;
  currentPhase: string;
  questionIds: string[];
  currentQuestionIndex: number;
  startTime?: Date;
  endTime?: Date;
  totalDuration?: number;
  score?: InterviewScore;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionResponse {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  category: string;
  tags: string[];
  companies: string[];
  roles: string[];
  testCases?: TestCase[];
  expectedAnswer?: string;
  hints?: string[];
  timeLimit?: number;
}

export interface MessageResponse {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  timestamp: Date;
  questionId?: string;
  metadata?: any;
}
