import axios from 'axios';

// Prefer Vite runtime env (Docker compose sets VITE_API_URL). Fallback to localhost.
const VITE_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  'https://backuesis-production.up.railway.app';

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
    // First try to get companyId directly from sessionStorage
    let companyId = sessionStorage.getItem('companyId');
    
    // If not found, try to extract from company object in sessionStorage
    if (!companyId) {
      const companyData = sessionStorage.getItem('company');
      if (companyData) {
        const company = JSON.parse(companyData);
        companyId = company?.id?.toString();
      }
    }
    
    // If still not found, try localStorage
    if (!companyId) {
      companyId = localStorage.getItem('companyId');
    }
    
    // If still not found, try to extract from company object in localStorage
    if (!companyId) {
      const companyData = localStorage.getItem('company');
      if (companyData) {
        const company = JSON.parse(companyData);
        companyId = company?.id?.toString();
      }
    }
    
    if (companyId) {
      config.headers = config.headers ?? {};
      if (!('companyId' in config.headers)) {
        (config.headers as any).companyId = companyId;
      }
    }
  } catch (error) {
    // ignore storage errors
  }

  return config;
});

export default api;
