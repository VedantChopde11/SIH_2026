const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getHeaders = (token, isFormData = false) => {
  const headers = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

export const uploadReport = async (token, projectId, file, uploaderName) => {
  const formData = new FormData();
  if (uploaderName) formData.append('uploaderName', uploaderName);
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/projects/${projectId}/reports/upload`, {
    method: 'POST',
    headers: getHeaders(token, true),
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload report');
  }
  
  return response.json();
};

export const fetchReports = async (token, projectId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/reports`, {
    headers: getHeaders(token)
  });
  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }
  return response.json();
};

export const retryReport = async (token, projectId, reportId) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/reports/${reportId}/retry`, {
    method: 'POST',
    headers: getHeaders(token)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to retry report processing');
  }
  
  return response.json();
};
