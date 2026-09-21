import { getHeaders, API_URL } from './projects';

export const getDocuments = async (token, projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/documents`, { headers: getHeaders(token) });
  if (!response.ok) throw new Error('Failed to fetch documents');
  return response.json();
};

export const uploadDocument = async (token, projectId, formData) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/documents`, { 
    method: 'POST',
    headers: getHeaders(token, true), // true indicates it's form data, so Content-Type is omitted
    body: formData
  });
  if (!response.ok) throw new Error('Failed to upload document');
  return response.json();
};
