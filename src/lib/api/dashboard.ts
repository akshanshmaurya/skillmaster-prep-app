const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const dashboardApi = {
  async getSummary() {
    const res = await fetch(`${API_BASE_URL}/dashboard/summary`, { headers: getAuthHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load dashboard');
    return res.json();
  },
  async getLeaderboard(limit = 20) {
    const res = await fetch(`${API_BASE_URL}/dashboard/leaderboard?limit=${limit}`, { headers: getAuthHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load leaderboard');
    return res.json();
  }
};
