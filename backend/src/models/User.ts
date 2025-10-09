import { ObjectId } from 'mongodb';

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

