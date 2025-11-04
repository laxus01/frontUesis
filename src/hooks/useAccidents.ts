import { useState, useEffect } from 'react';
import http from '../services/http';
import { Accident, CreateAccidentPayload, UpdateAccidentPayload, AccidentFilters } from '../types/accident.types';

export const useAccidents = () => {
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener todos los accidentes con filtros opcionales
   */
  const fetchAccidents = async (filters?: AccidentFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId.toString());
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const url = `/accidents${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await http.get<Accident[]>(url);
      setAccidents(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar accidentes');
      console.error('Error fetching accidents:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener un accidente por ID
   */
  const fetchAccidentById = async (id: number): Promise<{ success: boolean; data?: Accident; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      const response = await http.get<Accident>(`/accidents/${id}`);
      return { success: true, data: response.data };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cargar accidente';
      setError(errorMsg);
      console.error('Error fetching accident:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener accidentes por vehículo
   */
  const fetchAccidentsByVehicle = async (vehicleId: number): Promise<{ success: boolean; data?: Accident[]; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      const response = await http.get<Accident[]>(`/accidents/vehicle/${vehicleId}`);
      return { success: true, data: response.data };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cargar accidentes del vehículo';
      setError(errorMsg);
      console.error('Error fetching accidents by vehicle:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crear un nuevo accidente
   */
  const createAccident = async (payload: CreateAccidentPayload): Promise<{ success: boolean; data?: Accident; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      const response = await http.post<Accident>('/accidents', payload);
      await fetchAccidents();
      return { success: true, data: response.data };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al crear accidente';
      setError(errorMsg);
      console.error('Error creating accident:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar un accidente existente
   */
  const updateAccident = async (id: number, payload: UpdateAccidentPayload): Promise<{ success: boolean; data?: Accident; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      const response = await http.patch<Accident>(`/accidents/${id}`, payload);
      await fetchAccidents();
      return { success: true, data: response.data };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar accidente';
      setError(errorMsg);
      console.error('Error updating accident:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Eliminar un accidente
   */
  const deleteAccident = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      await http.delete(`/accidents/${id}`);
      await fetchAccidents();
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar accidente';
      setError(errorMsg);
      console.error('Error deleting accident:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccidents();
  }, []);

  return {
    accidents,
    loading,
    error,
    fetchAccidents,
    fetchAccidentById,
    fetchAccidentsByVehicle,
    createAccident,
    updateAccident,
    deleteAccident
  };
};
