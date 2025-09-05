import axios from 'axios';

// Prefer Vite runtime env (Docker compose sets VITE_API_URL). Fallback to localhost.
const VITE_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  'http://localhost:3000';

const api = axios.create({ baseURL: String(VITE_BASE).replace(/\/$/, '') });

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      const token: string | undefined = parsed?.token;
      if (token) {
        config.headers = config.headers ?? {};
        if (!('Authorization' in config.headers)) {
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
      }
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

export default api;
