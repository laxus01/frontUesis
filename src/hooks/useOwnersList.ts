import { useState, useEffect, useCallback } from 'react';
import api from '../services/http';
import { useNotify } from '../services/notify';

export interface Owner {
  id: number;
  identification: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  issuedIn?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const useOwnersList = () => {
  const { error } = useNotify();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchOwners = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<Owner[]>('/owner');
      setOwners(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching owners:', err);
      error('Error al cargar la lista de propietarios');
      setOwners([]);
    } finally {
      setLoading(false);
    }
  }, [error]);

  const deleteOwner = useCallback(async (id: number) => {
    try {
      await api.delete(`/owner/${id}`);
      setOwners(prev => prev.filter(owner => owner.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting owner:', err);
      
      // Handle specific error for owners with related vehicles
      if (err?.response?.status === 409 && err?.response?.data?.error === 'OWNER_HAS_RELATED_VEHICLES') {
        const vehiclesCount = err.response.data.vehiclesCount || 0;
        return {
          success: false,
          error: 'OWNER_HAS_RELATED_VEHICLES',
          message: err.response.data.message,
          vehiclesCount
        };
      }
      
      // Handle other errors
      const errorMessage = err?.response?.data?.message || 'Error al eliminar el propietario';
      error(errorMessage);
      return { success: false, error: 'GENERIC_ERROR', message: errorMessage };
    }
  }, [error]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  return {
    owners,
    loading,
    fetchOwners,
    deleteOwner,
  };
};
