const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

export const getMetrics = async (token, projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/analytics/metrics`, {
    headers: getHeaders(token)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch metrics: ${text}`);
  }
  return response.json();
};

export const getProgress = async (token, projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/analytics/progress`, {
    headers: getHeaders(token)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch progress: ${text}`);
  }
  return response.json();
};

export const getAdvancedAnalytics = async (token, projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/analytics/advanced`, { headers: getHeaders(token) });
  if (!response.ok) throw new Error('Failed to fetch advanced analytics');
  return response.json();
};
