import { useState, useEffect, useCallback } from 'react';
import api from '../services/http';
import { useNotify } from '../services/notify';
import { Driver } from '../components/modals/DriverFormModal';

export const useDriversList = () => {
  const { error } = useNotify();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<Driver[]>('/drivers');
      setDrivers(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching drivers:', err);
      error('Error al cargar la lista de conductores');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [error]);

  const deleteDriver = useCallback(async (id: number) => {
    try {
      await api.delete(`/drivers/${id}`);
      setDrivers(prev => prev.filter(driver => driver.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting driver:', err);
      
      const errorData = err?.response?.data;
      const errorCode = errorData?.error;
      const errorMessage = errorData?.message || 'Error al eliminar el conductor';
      
      // Don't show notification for specific errors that will be handled by the component
      if (errorCode !== 'DRIVER_NOT_FOUND' && errorCode !== 'DRIVER_HAS_ASSIGNED_VEHICLES') {
        error(errorMessage);
      }
      
      return { 
        success: false, 
        error: errorCode || 'GENERIC_ERROR', 
        message: errorMessage,
        data: errorData
      };
    }
  }, [error]);

  const updateDriver = useCallback(async (id: number, updates: Partial<Driver>) => {
    try {
      const response = await api.put(`/drivers/${id}`, updates);
      setDrivers(prev => prev.map(driver => 
        driver.id === id ? { ...driver, ...response.data } : driver
      ));
      return { success: true, data: response.data };
    } catch (err: any) {
      console.error('Error updating driver:', err);
      
      const errorMessage = err?.response?.data?.message || 'Error al actualizar el conductor';
      error(errorMessage);
      return { success: false, error: 'GENERIC_ERROR', message: errorMessage };
    }
  }, [error]);

  const toggleDriverState = useCallback(async (id: number, reason: string) => {
    try {
      const response = await api.patch(`/drivers/${id}/toggle-state`, { reason });
      
      // Debug: Log the response to see what we're getting
      console.log('Toggle state response:', response.data);
      
      // Update the driver state more robustly
      setDrivers(prev => prev.map(driver => {
        if (driver.id === id) {
          // If the response contains the full driver object, use it
          if (response.data.id) {
            return { ...driver, ...response.data };
          }
          // Otherwise, just update the state field
          const newState = response.data.state !== undefined ? response.data.state : (driver.state === 1 ? 0 : 1);
          console.log(`Updating driver ${id} from state ${driver.state} to ${newState}`);
          return { ...driver, state: newState };
        }
        return driver;
      }));
      
      return { success: true, data: response.data };
    } catch (err: any) {
      console.error('Error toggling driver state:', err);
      
      const errorMessage = err?.response?.data?.message || 'Error al cambiar el estado del conductor';
      error(errorMessage);
      return { success: false, error: 'GENERIC_ERROR', message: errorMessage };
    }
  }, [error]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return {
    drivers,
    loading,
    fetchDrivers,
    deleteDriver,
    updateDriver,
    toggleDriverState
  };
};
