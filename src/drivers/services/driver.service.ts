import api from '../../services/http';
import { Driver } from '../interfaces/driver.interface';

export const driverService = {
  getAll: async () => {
    return api.get<Driver[]>('/drivers');
  },

  getById: async (id: number) => {
    return api.get<Driver>(`/drivers/${id}`);
  },

  create: async (data: any) => {
    return api.post('/drivers', data);
  },

  update: async (id: number, data: any) => {
    return api.put(`/drivers/${id}`, data);
  },

  delete: async (id: number) => {
    return api.delete(`/drivers/${id}`);
  },

  toggleState: async (id: number, reason: string) => {
    return api.patch(`/drivers/${id}/toggle-state`, { reason });
  }
};
