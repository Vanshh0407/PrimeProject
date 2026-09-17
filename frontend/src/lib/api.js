export function createApiClient(apiUrl, token, onUnauthorized) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Token ${token}` };

  async function request(path, options = {}) {
    const r = await fetch(`${apiUrl}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    if (r.status === 401) {
      onUnauthorized?.();
      throw new Error('Session expired, please log in again.');
    }
    const text = await r.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!r.ok) {
      const message = (data && (data.detail || data.non_field_errors?.[0])) || (typeof data === 'string' ? data : 'Request failed');
      throw new Error(message);
    }
    return data;
  }

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
    put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
    del: (path) => request(path, { method: 'DELETE' }),
  };
}
