import { ObjectId } from 'mongodb';
import { AssessmentTrack, AssessmentTopic } from './Assessment';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string; // hashed
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // User stats
  rank?: number;
  totalScore?: number;
  testsCompleted?: number;
  questionsSolved?: number;
  studyHours?: number;
  accuracy?: number;
  avgTime?: number;
  
  // Aggregated metrics for dashboard
  metrics?: {
    assessments?: {
      completed: number;
      avgScore: number; // 0-100
      avgAccuracy: number; // 0-1
    };
    practice?: {
      completed: number;
      avgScore: number; // 0-100
      avgAccuracy: number; // 0-1
    };
    interviews?: {
      completed: number;
      avgOverall: number; // 0-100
    };
    overall?: {
      testsCompleted: number;
      avgScore: number; // 0-100 across all activities
    };
  };
  
  // Latest per-topic test scores (populated by services)
  latestTestScores?: Record<string, {
    track: AssessmentTrack;
    topic: AssessmentTopic;
    score: number; // 0-100
    accuracy: number; // 0-1
    updatedAt: Date;
  }>;
  
  // User profile
  avatar?: string;
  bio?: string;
  college?: string;
  gradYear?: number;
  targetRole?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  location?: string;
  company?: string;
  isProfileComplete?: boolean;
  
  // Skills
  skills?: {
    skill: string;
    level: number;
    total: number;
    badge: string;
  }[];
  
  // Achievements
  achievements?: {
    name: string;
    icon: string;
    date: string;
    rarity: string;
  }[];
  
  // Activity data
  activityData?: {
    date: string;
    questions: number;
    hours: number;
  }[];

  // Optional study goals for insights
  goals?: {
    targetScore?: number; // 0-100
    weeklyHours?: number; // suggested weekly study hours
    targetDate?: Date; // optional target date for reaching goal
  };
}

export interface UserStats {
  rank: number;
  totalScore: number;
  testsCompleted: number;
  questionsSolved: number;
  studyHours: number;
  accuracy: number;
  avgTime: number;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ProfileCompletionInput {
  name: string;
  bio?: string;
  college?: string;
  gradYear?: number;
  targetRole?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  location?: string;
  company?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name?: string;
  rank?: number;
  totalScore?: number;
  testsCompleted?: number;
  questionsSolved?: number;
  studyHours?: number;
  accuracy?: number;
  avgTime?: number;
  avatar?: string;
  bio?: string;
  college?: string;
  gradYear?: number;
  targetRole?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  location?: string;
  company?: string;
  isProfileComplete?: boolean;
}

