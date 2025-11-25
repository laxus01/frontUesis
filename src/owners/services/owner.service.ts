import api from '../../services/http';
import { Owner, OwnerLite } from '../interfaces/owner.interface';

export const ownerService = {
    getAll: async () => {
        return api.get<Owner[]>('/owner');
    },

    getById: async (id: number) => {
        return api.get<Owner>(`/owner/${id}`);
    },

    create: async (data: any) => {
        return api.post('/owner', data);
    },

    update: async (id: number, data: any) => {
        return api.put(`/owner/${id}`, data);
    },

    delete: async (id: number) => {
        return api.delete(`/owner/${id}`);
    },

    search: async (params: { identification?: string; name?: string }) => {
        return api.get<OwnerLite[]>('/owner', { params });
    }
};
