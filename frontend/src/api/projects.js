export const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const getHeaders = (token, isFormData = false) => {
  const headers = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

export const getProjects = async (token) => {
  const response = await fetch(`${API_URL}/projects`, { headers: getHeaders(token) });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch projects: ${response.status} ${text}`);
  }
  return response.json();
};

export const getProject = async (token, id) => {
  const response = await fetch(`${API_URL}/projects/${id}`, { headers: getHeaders(token) });
  if (!response.ok) throw new Error('Failed to fetch project');
  return response.json();
};

export const createProject = async (token, projectData) => {
  const response = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(projectData),
  });
  if (!response.ok) throw new Error('Failed to create project');
  return response.json();
};

export const updateProject = async (token, { id, ...projectData }) => {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(projectData),
  });
  if (!response.ok) throw new Error('Failed to update project');
  return response.json();
};

export const deleteProject = async (token, id) => {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to delete project');
  return response.json();
};
