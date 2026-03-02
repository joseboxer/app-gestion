import { useAuth } from './useAuth';
import { API_BASE } from '../config';

export function useApi() {
  const { getHeaders } = useAuth();

  async function api(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...getHeaders(),
      ...options.headers
    };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  }

  return {
    get: (path) => api(path),
    post: (path, body) => api(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
    postFormData: (path, formData) => api(path, { method: 'POST', body: formData }),
    patch: (path, body) => api(path, { method: 'PATCH', body: JSON.stringify(body) }),
    del: (path) => api(path, { method: 'DELETE' })
  };
}
