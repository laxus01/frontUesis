import api from '../../services/http';
import { Vehicle } from '../interfaces/vehicle.interface';

export const vehicleService = {
    getAll: async () => {
        return api.get<Vehicle[]>('/vehicles');
    },

    getById: async (id: number) => {
        return api.get<Vehicle>(`/vehicles/${id}`);
    },

    create: async (data: any) => {
        return api.post('/vehicles', data);
    },

    update: async (id: number, data: any) => {
        return api.put(`/vehicles/${id}`, data);
    },

    delete: async (id: number) => {
        return api.delete(`/vehicles/${id}`);
    },

    toggleState: async (id: number, reason: string) => {
        return api.patch(`/vehicles/${id}/toggle-state`, { reason });
    }
};
