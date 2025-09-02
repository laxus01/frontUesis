import axios from 'axios';
import CatalogService from './catalog.service';

const API_URL = 'http://localhost:3000/auth/login';

export interface LoginResponse {
  token?: string;
  [key: string]: any;
}

const login = async (user: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(API_URL, {
      user,
      password,
    });
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
      // Persist company info for scoping subsequent requests
      const company = response.data?.user?.company;
      if (company) {
        try {
          localStorage.setItem('company', JSON.stringify(company));
          if (company.id != null) {
            localStorage.setItem('companyId', String(company.id));
          }
        } catch (e) {
          console.warn('Could not persist company info:', e);
        }
      }
      // Fetch catalogs right after successful login and cache them
      try {
        await CatalogService.fetchCatalogs(response.data.token);
      } catch (err) {
        // Non-fatal: login succeeded, but catalogs couldn't be prefetched
        console.warn('Catalog prefetch failed:', err);
      }
    }
    return response.data;
  } catch (error: any) {
    console.error('Login failed:', error?.response?.data || error?.message);
    throw error;
  }
};

export default {
  login,
};
