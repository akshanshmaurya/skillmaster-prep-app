const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

export type AssessmentTrack = 'soft-skills' | 'technical-skills';
export type AssessmentTopic =
  | 'quant'
  | 'verbal'
  | 'aptitude'
  | 'coding'
  | 'cloud'
  | 'dbms'
  | 'operating-systems'
  | 'networks'
  | 'system-design';
export type AssessmentDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  answerType: 'single-choice' | 'multiple-choice' | 'short-text';
  options?: string[];
  tags: string[];
  estimatedTime: number;
  order: number;
  difficulty: AssessmentDifficulty;
};

export type AssessmentSummary = {
  strengths: string[];
  opportunities: string[];
  improvements: string[];
  suggestions: string[];
};

export type AssessmentResult = {
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
};

export type AssessmentEvaluation = {
  sessionId: string;
  track: AssessmentTrack;
  topic: AssessmentTopic;
  difficulty: AssessmentDifficulty;
  accuracy: number;
  score: number;
  summary: AssessmentSummary;
  results: AssessmentResult[];
  createdAt: string;
};

export type AssessmentTrackDefinition = {
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

export const testsApi = {
  async getTracks() {
    const response = await fetch(`${API_BASE_URL}/tests/tracks`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to load assessment tracks');
    }

    return response.json() as Promise<{ tracks: AssessmentTrackDefinition[] }>;
  },

  async generateSession(payload: {
    track: AssessmentTrack;
    topic: AssessmentTopic;
    difficulty: AssessmentDifficulty;
    count?: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/tests/generate`, {
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
      throw new Error(json?.error || 'Failed to generate assessment session');
    }

    return response.json() as Promise<{
      sessionId: string;
      track: AssessmentTrack;
      topic: AssessmentTopic;
      difficulty: AssessmentDifficulty;
      status: string;
      questions: AssessmentQuestion[];
    }>;
  },

  async getSession(sessionId: string) {
    const response = await fetch(`${API_BASE_URL}/tests/sessions/${sessionId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to load assessment session');
    }

    return response.json() as Promise<{
      sessionId: string;
      track: AssessmentTrack;
      topic: AssessmentTopic;
      difficulty: AssessmentDifficulty;
      status: string;
      createdAt: string;
      updatedAt: string;
      questions: AssessmentQuestion[];
    }>;
  },

  async submitSession(sessionId: string, answers: Array<{ questionId: string; answer: string | string[] }>) {
    const response = await fetch(`${API_BASE_URL}/tests/sessions/${sessionId}/submit`, {
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
      throw new Error(json?.error || 'Failed to submit assessment session');
    }

    return response.json() as Promise<AssessmentEvaluation>;
  },

  async getHistory(limit?: number) {
    const url = new URL(`${API_BASE_URL}/tests/history`);
    if (typeof limit === 'number') {
      url.searchParams.set('limit', String(limit));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to load assessment history');
    }

    return response.json() as Promise<{
      history: Array<{
        sessionId: string;
        track: AssessmentTrack;
        topic: AssessmentTopic;
        difficulty: AssessmentDifficulty;
        score: number;
        accuracy: number;
        createdAt: string;
      }>;
    }>;
  }
};
