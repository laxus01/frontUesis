import { useState, useEffect, useCallback } from 'react';
import api from '../services/http';
import { useNotify } from '../services/notify';

export interface Vehicle {
  id: number;
  plate: string;
  model: string;
  internalNumber: string;
  mobileNumber?: string;
  engineNumber?: string;
  chassisNumber?: string;
  line?: string;
  entryDate?: string;
  createdAt?: string;
  make: {
    id: number;
    name: string;
  };
  insurer: {
    id: number;
    name: string;
  };
  communicationCompany: {
    id: number;
    name: string;
  };
  owner: {
    id: number;
    name: string;
    identification: string;
    email?: string;
    address?: string;
    phone?: string;
    createdAt?: string;
  };
  company: {
    id: number;
    nit: string;
    name: string;
    phone?: string;
    address?: string;
    createdAt?: string;
  };
}

export const useVehiclesList = () => {
  const { error } = useNotify();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<Vehicle[]>('/vehicles');
      setVehicles(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      error('Error al cargar la lista de vehículos');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [error]);

  const deleteVehicle = useCallback(async (id: number) => {
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting vehicle:', err);
      
      // Handle specific error cases if needed
      const errorMessage = err?.response?.data?.message || 'Error al eliminar el vehículo';
      error(errorMessage);
      return { success: false, error: 'GENERIC_ERROR', message: errorMessage };
    }
  }, [error]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    loading,
    fetchVehicles,
    deleteVehicle,
  };
};
