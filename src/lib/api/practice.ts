const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

export type PracticeTopic = 'quant' | 'verbal' | 'aptitude' | 'reasoning' | 'games';
export type PracticeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type PracticeQuestion = {
  id: string;
  prompt: string;
  answerType: 'single-choice' | 'multiple-choice' | 'short-text';
  options?: string[];
  tags: string[];
  estimatedTime: number;
  order: number;
  difficulty: PracticeDifficulty;
};

export type PracticeSummary = {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  suggestions: string[];
};

export type PracticeResult = {
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
};

export type PracticeEvaluation = {
  sessionId: string;
  accuracy: number;
  score: number;
  summary: PracticeSummary;
  results: PracticeResult[];
};

export const practiceApi = {
  getTopics: async () => {
    const response = await fetch(`${API_BASE_URL}/practice/topics`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to load practice topics');
    }

    return response.json() as Promise<{
      topics: Array<{
        id: PracticeTopic;
        name: string;
        difficulties: PracticeDifficulty[];
      }>;
    }>;
  },

  generateSession: async (payload: {
    topic: PracticeTopic;
    difficulty: PracticeDifficulty;
    count?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/practice/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}
      throw new Error(json?.error || 'Failed to generate practice session');
    }

    return response.json() as Promise<{
      sessionId: string;
      topic: PracticeTopic;
      difficulty: PracticeDifficulty;
      status: string;
      questions: PracticeQuestion[];
    }>;
  },

  getSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/practice/sessions/${sessionId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to load practice session');
    }

    return response.json() as Promise<{
      sessionId: string;
      topic: PracticeTopic;
      difficulty: PracticeDifficulty;
      status: string;
      createdAt: string;
      updatedAt: string;
      questions: PracticeQuestion[];
      evaluation?: PracticeEvaluation;
    }>;
  },

  submitSession: async (sessionId: string, answers: Array<{ questionId: string; answer: string | string[] }>) => {
    const response = await fetch(`${API_BASE_URL}/practice/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers })
    });

    if (!response.ok) {
      const text = await response.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}
      throw new Error(json?.error || 'Failed to submit practice session');
    }

    return response.json() as Promise<PracticeEvaluation>;
  }
};
