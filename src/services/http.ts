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

  // Add companyId header from storage
  try {
    let companyId: string | null = null;
    
    // First try to get companyId directly from localStorage
    companyId = localStorage.getItem('companyId');
    
    // If not found, try to extract from company object in localStorage
    if (!companyId) {
      const companyData = localStorage.getItem('company');
      if (companyData) {
        const company = JSON.parse(companyData);
        companyId = company?.id?.toString();
      }
    }
    
    // If still not found, try to extract from user object in localStorage
    if (!companyId) {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        companyId = user?.user?.company?.id?.toString();
      }
    }
    
    if (companyId) {
      config.headers = config.headers ?? {};
      config.headers.set('companyId', companyId);
    }
  } catch (error) {
    // ignore storage errors
    console.error('Error setting companyId header:', error);
  }

  return config;
});

export default api;
