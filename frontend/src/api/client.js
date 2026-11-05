const API_BASE_URL = (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '')
  ? import.meta.env.VITE_API_URL
  : 'https://patient-fern-1718.fly.dev';

const BASE_URL = API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/api/v1` : '/api/v1';

export function getAuthToken() {
  return localStorage.getItem('ff_auth_token') || '';
}

export function setAuthToken(token) {
  localStorage.setItem('ff_auth_token', token);
}

/**
 * Sanitizes payload objects: converts empty strings to null for IDs, dates, and optional relations
 * so FastAPI / Pydantic validation and PostgreSQL foreign keys never reject them.
 */
function sanitizePayload(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizePayload);

  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === '') {
      // Empty strings for dates or foreign key IDs must be null
      if (
        key.endsWith('_id') || 
        key.endsWith('_date') || 
        key === 'date' || 
        key === 'due_date' || 
        key === 'target_date' || 
        key === 'start_date' || 
        key === 'end_date' ||
        key === 'next_payment_date' ||
        key === 'client_id' ||
        key === 'project_id' ||
        key === 'category_id' ||
        key === 'source_account_id' ||
        key === 'destination_account_id' ||
        key === 'account_id'
      ) {
        cleaned[key] = null;
      } else {
        cleaned[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizePayload(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Parses and normalizes error responses from backend into friendly readable strings
 */
function extractErrorMessage(errorData, fallbackText = 'An unexpected error occurred') {
  if (!errorData) return fallbackText;
  
  if (typeof errorData === 'string') return errorData;
  
  if (errorData.detail) {
    if (typeof errorData.detail === 'string') return errorData.detail;
    if (Array.isArray(errorData.detail)) {
      // FastAPI / Pydantic validation error list
      return errorData.detail
        .map((err) => {
          const field = err.loc ? err.loc[err.loc.length - 1] : '';
          return field ? `${field}: ${err.msg}` : err.msg;
        })
        .join('; ');
    }
  }
  
  if (errorData.message) return errorData.message;
  return fallbackText;
}

export async function fetchApi(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      errorDetail = extractErrorMessage(errorData, errorDetail);
    } catch (e) {
      // Non-json response
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  get: (url, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`${url}${qs}`, { method: 'GET' });
  },

  post: (url, data) => fetchApi(url, {
    method: 'POST',
    body: JSON.stringify(sanitizePayload(data))
  }),

  put: (url, data) => fetchApi(url, {
    method: 'PUT',
    body: JSON.stringify(sanitizePayload(data))
  }),

  delete: (url) => fetchApi(url, {
    method: 'DELETE'
  }),

  uploadFile: async (url, file, extraData = {}) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(extraData).forEach(([k, v]) => {
      if (v) formData.append(k, v);
    });

    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!response.ok) {
      let msg = 'Upload failed';
      try {
        const err = await response.json();
        msg = extractErrorMessage(err, msg);
      } catch (e) {}
      throw new Error(msg);
    }
    return response.json();
  },

  downloadBlob: async (url, filename) => {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  }
};
