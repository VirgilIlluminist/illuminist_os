/**
 * api.client.ts — Base API client for NEVAEH AI OS
 * All frontend API calls go through this. Handles auth headers,
 * error normalization, and timeout.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';
const TIMEOUT  = 30000;

export interface APIError {
  message:    string;
  statusCode: number;
  code?:      string;
}

export class APIClientError extends Error {
  constructor(
    message:          string,
    public statusCode:number  = 500,
    public code?:     string,
  ) {
    super(message);
    this.name = 'APIClientError';
  }
}

async function request<T>(
  path:    string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const token = localStorage.getItem('nevaeh_auth_token');
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal:  controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new APIClientError(
        errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData.code,
      );
    }

    const data = await response.json();
    return data.data ?? data;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof APIClientError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new APIClientError('Request timed out', 408);
    }
    throw new APIClientError((err as Error).message || 'Network error', 0);
  }
}

export const api = {
  get:    <T>(path: string)                          => request<T>(path),
  post:   <T>(path: string, body: unknown)           => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)           => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)           => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)                          => request<T>(path, { method: 'DELETE' }),
};

export default api;
