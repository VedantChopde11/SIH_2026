import { getHeaders, API_URL } from './projects';

export const getAuditLogs = async (token, projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/audit`, { headers: getHeaders(token) });
  if (!response.ok) throw new Error('Failed to fetch audit logs');
  return response.json();
};
