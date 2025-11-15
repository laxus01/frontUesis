import { useState, useEffect } from 'react';
import http from '../services/http';
import { SystemUser, CreateUserPayload, UpdateUserPayload } from '../types/user.types';

export const useUsers = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener todos los usuarios
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await http.get<SystemUser[]>('/users');
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crear un nuevo usuario
   */
  const createUser = async (payload: CreateUserPayload): Promise<{ success: boolean; data?: SystemUser; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      const response = await http.post<SystemUser>('/users', payload);
      // Recargar la lista completa para obtener todos los datos del servidor
      await fetchUsers();
      return { success: true, data: response.data };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al crear usuario';
      setError(errorMsg);
      console.error('Error creating user:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar un usuario existente (incluye cambio de contraseña si se proporciona)
   */
  const updateUser = async (id: number, payload: UpdateUserPayload): Promise<{ success: boolean; data?: SystemUser; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      const response = await http.put<SystemUser>(`/users/${id}`, payload);
      // Recargar la lista completa para obtener todos los datos actualizados del servidor
      await fetchUsers();
      return { success: true, data: response.data };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar usuario';
      setError(errorMsg);
      console.error('Error updating user:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Eliminar un usuario
   */
  const deleteUser = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      await http.delete(`/users/${id}`);
      // Recargar la lista completa después de eliminar
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar usuario';
      setError(errorMsg);
      console.error('Error deleting user:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
};
