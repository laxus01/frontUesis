import { useState, useEffect, useCallback } from 'react';
import { useNotify } from '../../services/notify';
import { Vehicle } from '../interfaces/vehicle.interface';
import { vehicleService } from '../services/vehicle.service';

export const useVehiclesList = () => {
    const { error } = useNotify();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchVehicles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await vehicleService.getAll();
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
            await vehicleService.delete(id);
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

    const toggleVehicleState = useCallback(async (id: number, reason: string) => {
        try {
            const response = await vehicleService.toggleState(id, reason);

            // Update the vehicle in the local state with the new data
            setVehicles(prev => prev.map(vehicle =>
                vehicle.id === id ? response.data.vehicle : vehicle
            ));

            return { success: true, data: response.data };
        } catch (err: any) {
            console.error('Error toggling vehicle state:', err);

            const errorMessage = err?.response?.data?.message || 'Error al cambiar el estado del vehículo';
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
        toggleVehicleState,
    };
};
