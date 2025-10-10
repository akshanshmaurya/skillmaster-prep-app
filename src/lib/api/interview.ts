const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
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

// User Profile API
export const interviewProfileApi = {
  // Create or update user profile
  updateProfile: async (profile: {
    role: string;
    experienceLevel: string;
    targetCompany?: string;
    preferredLanguage: string;
    interviewType: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/interview/profile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    return response.json();
  },

  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/interview/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get profile');
    }

    return response.json();
  },
};

// Interview Sessions API
export const interviewSessionApi = {
  // Create new interview session
  createSession: async (data: {
    profile: {
      role: string;
      experienceLevel: string;
      targetCompany?: string;
      preferredLanguage: string;
      interviewType: string;
    };
    questionCount?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/interview/sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const text = await response.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch {}

    if (!response.ok) {
      const serverMsg = json?.error || json?.message;
      throw new Error(serverMsg || `Failed to create session (${response.status})`);
    }

    return json;
  },

  // Get interview session
  getSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/interview/sessions/${sessionId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get session');
    }

    return response.json();
  },

  // Start interview session
  startSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/interview/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to start session');
    }

    return response.json();
  },

  // Complete interview session
  completeSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/interview/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to complete session');
    }

    return response.json();
  },

  // Get user's interview history
  getHistory: async (limit = 10, offset = 0) => {
    const response = await fetch(`${API_BASE_URL}/interview/history?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get history');
    }

    return response.json();
  },
};

// Questions API
export const questionsApi = {
  // Get questions with filters
  getQuestions: async (filters: {
    role?: string;
    company?: string;
    difficulty?: string;
    type?: string;
    category?: string;
    limit?: number;
  } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });

    const response = await fetch(`${API_BASE_URL}/interview/questions?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get questions');
    }

    return response.json();
  },
};

// Code Execution API
export const codeExecutionApi = {
  // Execute code
  executeCode: async (data: {
    code: string;
    language: string;
    testCases?: Array<{ input: string; expectedOutput: string }>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/interview/execute-code`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to execute code');
    }

    return response.json();
  },
};

// Messages API
export const messagesApi = {
  // Get AI interviewer response
  getAIResponse: async (sessionId: string, data: {
    question: string;
    questionType: string;
    difficulty: string;
    company: string;
    role: string;
    candidateAnswer?: string;
    currentPhase: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/interview/sessions/${sessionId}/ai-response`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    return response.json();
  },

  // Submit answer
  submitAnswer: async (sessionId: string, data: {
    questionId: string;
    answer: string;
    code?: string;
    language?: string;
    timeSpent: number;
    hintsUsed: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/interview/sessions/${sessionId}/answer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const text = await response.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!response.ok) {
      const serverMsg = json?.error || json?.message;
      throw new Error(serverMsg || `Failed to submit answer (${response.status})`);
    }
    return json;
  },

  // Get session messages (transcript)
  getMessages: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/interview/sessions/${sessionId}/messages`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get messages');
    }

    return response.json();
  },
};

// Analytics API
export const analyticsApi = {
  // Get progress analytics
  getAnalytics: async () => {
    const response = await fetch(`${API_BASE_URL}/interview/analytics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get analytics');
    }

    return response.json();
  },
};
