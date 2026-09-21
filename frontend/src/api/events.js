const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getHeaders = (token, isFormData = false) => {
  const headers = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

export const fetchEvents = async (token, projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/events`, { headers: getHeaders(token) });
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
};

export const runMatchingEngine = async (token, projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/events/match-all`, {
    method: 'POST',
    headers: getHeaders(token)
  });
  if (!response.ok) throw new Error('Failed to run matching engine');
  return response.json();
};

export const getReviewEvents = async (token, projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/events/review`, { 
    headers: getHeaders(token),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Failed to fetch review events');
  return response.json();
};

export const submitReview = async (token, projectId, eventId, data) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/events/${eventId}/review`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to submit review');
  return response.json();
};

export const updateEvent = async (token, projectId, eventId, data) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/events/${eventId}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update event');
  }
  
  return response.json();
};

export const approveAllEvents = async (token, projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/events/approve-all`, {
    method: 'POST',
    headers: getHeaders(token)
  });
  if (!response.ok) throw new Error('Failed to bulk approve events');
  return response.json();
};
