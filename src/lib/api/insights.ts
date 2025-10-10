const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const insightsApi = {
  async getOverview() {
    const res = await fetch(`${API_BASE_URL}/insights/overview`, { headers: getAuthHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load insights overview');
    return res.json();
  }
};
