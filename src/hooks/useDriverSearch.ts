import { useState } from 'react';
import api from '../services/http';
import { useNotify } from '../services/notify';
import { formatNumber } from '../utils/formatting';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

export interface Driver {
  id: number;
  identification: string;
  issuedIn: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  license: string;
  category: string;
  expiresOn: Dayjs | null;
  bloodType: string;
  photo: string;
  epsId: number;
  arlId: number;
}

export const useDriverSearch = () => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const { warning, error, success } = useNotify();

  const searchDrivers = async (identification?: string) => {
    const q = (identification || query).trim().replace(/[,.]/g, '');
    if (!q) {
      warning('Ingrese una identificación para buscar');
      return [];
    }

    setLoading(true);
    try {
      const res = await api.get<any[]>('/drivers', { params: { identification: q } });
      const data = Array.isArray(res.data) ? res.data : [];
      const drivers = data.map(d => ({
        ...d,
        name: `${d.firstName} ${d.lastName}`.trim(),
        expiresOn: d.expiresOn ? dayjs(String(d.expiresOn).slice(0, 10)) : null
      }));

      setOptions(drivers);

      if (drivers.length === 0) {
        warning('No se encontraron conductores con esa identificación');
        setSelectedDriver(null);
      } else if (drivers.length === 1) {
        // Auto-seleccionar si solo hay un resultado
        selectDriver(drivers[0]);
        success('Conductor encontrado y seleccionado');
      } else {
        success(`Se encontraron ${drivers.length} conductores`);
      }

      return drivers;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error buscando conductor';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
      setOptions([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const selectDriver = (driver: Driver | null) => {
    if (driver) {
      setSelectedDriver({
        ...driver,
        identification: formatNumber(driver.identification),
        license: formatNumber(String(driver.license || '')),
      });
      setQuery(formatNumber(driver.identification));
    } else {
      setSelectedDriver(null);
      setQuery('');
    }
  };

  const resetDriver = () => {
    setSelectedDriver(null);
    setQuery('');
    setOptions([]);
  };

  return {
    query,
    setQuery,
    options,
    loading,
    selectedDriver,
    searchDrivers,
    selectDriver,
    resetDriver,
  };
};
