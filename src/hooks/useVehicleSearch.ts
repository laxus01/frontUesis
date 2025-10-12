import { useState } from 'react';
import api from '../services/http';
import { useNotify } from '../services/notify';

export interface Vehicle {
  id: number;
  plate: string;
  model: string;
  internalNumber: string;
  mobileNumber: string;
  makeId: number;
  insurerId: number;
  communicationCompanyId: number;
  ownerId: number;
  ownerName: string;
  make?: { id: number; name: string };
  insurer?: { id: number; name: string };
  communicationCompany?: { id: number; name: string };
  owner?: { id: number; name: string };
}

export const useVehicleSearch = () => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [results, setResults] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const { warning, error, success } = useNotify();

  const searchVehicles = async (plate?: string) => {
    const q = (plate || query).trim().toUpperCase();
    if (!q) {
      warning('Ingrese una placa para buscar');
      return [];
    }

    setLoading(true);
    try {
      const res = await api.get<any[]>('/vehicles', { params: { plate: q } });
      const data = Array.isArray(res.data) ? res.data : [];
      setResults(data);
      
      const plates = Array.from(new Set(
        data.map((v: any) => String(v?.plate || '').trim()).filter(Boolean)
      ));
      setOptions(plates);

      if (data.length === 0) {
        warning('No se encontraron vehículos con esa placa');
        setSelectedVehicle(null);
      } else if (data.length === 1) {
        // Auto-seleccionar si solo hay un resultado
        selectVehicle(data[0]);
        success('Vehículo encontrado y seleccionado');
      } else {
        success(`Se encontraron ${data.length} vehículos`);
      }

      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error buscando vehículo';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
      setOptions([]);
      setResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const selectVehicle = (vehicle: Vehicle | null) => {
    if (vehicle) {
      const selectedVehicleData: Vehicle = {
        id: Number(vehicle.id || 0),
        plate: String(vehicle.plate || '').toUpperCase(),
        model: String(vehicle.model || ''),
        internalNumber: String(vehicle.internalNumber || ''),
        mobileNumber: String(vehicle.mobileNumber || ''),
        makeId: Number(vehicle.make?.id || 0),
        insurerId: Number(vehicle.insurer?.id || 0),
        communicationCompanyId: Number(vehicle.communicationCompany?.id || 0),
        ownerId: Number(vehicle.owner?.id || 0),
        ownerName: String(vehicle.owner?.name || ''),
      };
      
      setSelectedVehicle(selectedVehicleData);
      setQuery(selectedVehicleData.plate);
    } else {
      setSelectedVehicle(null);
      setQuery('');
    }
  };

  const resetVehicle = () => {
    setSelectedVehicle(null);
    setQuery('');
    setOptions([]);
    setResults([]);
  };

  return {
    query,
    setQuery,
    options,
    results,
    loading,
    selectedVehicle,
    searchVehicles,
    selectVehicle,
    resetVehicle,
  };
};
