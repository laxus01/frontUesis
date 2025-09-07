import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/http';
import { useNotify } from '../services/notify';
import { OwnerLite } from './useOwners';

interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  active: boolean;
  ownerId: number;
}

export const useVehicles = () => {
  const { success, error } = useNotify();
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(0);
  const [plate, setPlate] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [color, setColor] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);
  const [ownerId, setOwnerId] = useState<number>(0);

  // Owner search states
  const [ownerQuery, setOwnerQuery] = useState<string>('');
  const [ownerOptions, setOwnerOptions] = useState<OwnerLite[]>([]);
  const [ownerLoading, setOwnerLoading] = useState<boolean>(false);

  const disabledAll = useMemo(() => loading || submitting, [loading, submitting]);
  const canSubmit = useMemo(() => !!plate && !!brand && !!model && year > 0 && ownerId > 0, [plate, brand, model, year, ownerId]);

  const populateForm = useCallback((vehicle: Vehicle & { ownerName?: string }) => {
    setSelectedVehicleId(vehicle.id);
    setPlate(vehicle.plate);
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setYear(vehicle.year);
    setColor(vehicle.color);
    setActive(vehicle.active);
    setOwnerId(vehicle.ownerId);
    
    // Set owner query if owner name is provided
    if (vehicle.ownerName) {
      setOwnerQuery(vehicle.ownerName);
    }
  }, []);

  const resetForm = useCallback(() => {
    setSelectedVehicleId(0);
    setPlate('');
    setBrand('');
    setModel('');
    setYear(new Date().getFullYear());
    setColor('');
    setActive(true);
    setOwnerId(0);
    setOwnerQuery('');
  }, []);

  const getVehicleAndPopulate = useCallback(async (id: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get<Vehicle>(`/vehicles/${id}`);
      populateForm(res.data);
    } catch (e) {
      setSelectedVehicleId(0);
    } finally {
      setLoading(false);
    }
  }, [populateForm, loading]);

  // Effect for owner search
  useEffect(() => {
    const q = ownerQuery.trim();
    if (!q) {
      setOwnerOptions([]);
      return;
    }

    const handle = setTimeout(async () => {
      setOwnerLoading(true);
      try {
        const res = await api.get<OwnerLite[]>('/owner', { params: { name: q } });
        setOwnerOptions(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setOwnerOptions([]);
      } finally {
        setOwnerLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [ownerQuery]);

  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const payload = { plate, brand, model, year, color, active, ownerId };
      if (selectedVehicleId > 0) {
        await api.put(`/vehicles/${selectedVehicleId}`, payload);
        success('Vehículo actualizado exitosamente');
      } else {
        await api.post('/vehicles', payload);
        success('Vehículo creado exitosamente');
        resetForm();
      }
    } catch (err: any) {
      console.error('Error saving vehicle:', err);
      
      if (err?.response?.status === 409 && err?.response?.data?.error === 'PLATE_ALREADY_EXISTS') {
        const plate = err.response.data.plate;
        error(`La placa ${plate} ya existe en la base de datos`);
      } else if (err?.response?.data?.message) {
        error(err.response.data.message);
      } else {
        error('Error al guardar el vehículo. Intente nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, plate, brand, model, year, color, active, ownerId, selectedVehicleId, resetForm, success, error]);

  return {
    loading,
    submitting,
    selectedVehicleId,
    plate,
    brand,
    model,
    year,
    color,
    active,
    ownerId,
    ownerQuery,
    ownerOptions,
    ownerLoading,
    disabledAll,
    canSubmit,
    setPlate,
    setBrand,
    setModel,
    setYear,
    setColor,
    setActive,
    setOwnerId,
    setOwnerQuery,
    onSubmit,
    resetForm,
    populateForm,
    getVehicleAndPopulate,
  };
};
