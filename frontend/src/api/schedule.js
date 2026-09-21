const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getHeaders = (token, isFormData = false) => {
  const headers = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

export const uploadSchedule = async (token, projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/projects/${projectId}/schedule/upload`, {
    method: 'POST',
    headers: getHeaders(token, true),
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to upload schedule');
  }
  return response.json();
};

export const getSchedule = async (token, projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/schedule`, {
    headers: getHeaders(token)
  });
  if (!response.ok) throw new Error('Failed to fetch schedule');
  return response.json();
};
