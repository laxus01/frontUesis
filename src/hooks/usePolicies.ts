import { useState, useCallback } from 'react';
import api from '../services/http';
import { useNotify } from '../services/notify';
import type { Policy, CreatePolicyPayload, UpdatePolicyPayload, Insurer } from '../types/policy.types';

export const usePolicies = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(false);
  const { success, error } = useNotify();

  // Obtener todas las pólizas
  const fetchPolicies = useCallback(async (insurerId?: number) => {
    setLoading(true);
    try {
      const url = insurerId ? `/policies?insurerId=${insurerId}` : '/policies';
      const response = await api.get<Policy[]>(url);
      setPolicies(response.data);
      return response.data;
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error al cargar las pólizas');
      return [];
    } finally {
      setLoading(false);
    }
  }, [error]);

  // Obtener todas las aseguradoras
  const fetchInsurers = useCallback(async () => {
    try {
      const response = await api.get<Insurer[]>('/insurer');
      setInsurers(response.data);
      return response.data;
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error al cargar las aseguradoras');
      return [];
    }
  }, [error]);

  // Crear una nueva póliza
  const createPolicy = useCallback(async (payload: CreatePolicyPayload) => {
    setLoading(true);
    try {
      const response = await api.post<Policy>('/policies', payload);
      setPolicies(prev => [...prev, response.data]);
      success('Póliza creada exitosamente');
      return { success: true, data: response.data };
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error al crear la póliza');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [success, error]);

  // Actualizar una póliza
  const updatePolicy = useCallback(async (id: number, payload: UpdatePolicyPayload) => {
    setLoading(true);
    try {
      const response = await api.patch<Policy>(`/policies/${id}`, payload);
      setPolicies(prev => prev.map(p => p.id === id ? response.data : p));
      success('Póliza actualizada exitosamente');
      return { success: true, data: response.data };
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error al actualizar la póliza');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [success, error]);

  // Eliminar una póliza
  const deletePolicy = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await api.delete(`/policies/${id}`);
      setPolicies(prev => prev.filter(p => p.id !== id));
      success('Póliza eliminada exitosamente');
      return { success: true };
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error al eliminar la póliza');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [success, error]);

  // Cambiar estado de una póliza
  const togglePolicyStatus = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await api.patch<Policy>(`/policies/${id}/toggle-status`);
      setPolicies(prev => prev.map(p => p.id === id ? response.data : p));
      success('Estado de la póliza actualizado');
      return { success: true, data: response.data };
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error al cambiar el estado');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [success, error]);

  return {
    policies,
    insurers,
    loading,
    fetchPolicies,
    fetchInsurers,
    createPolicy,
    updatePolicy,
    deletePolicy,
    togglePolicyStatus
  };
};
