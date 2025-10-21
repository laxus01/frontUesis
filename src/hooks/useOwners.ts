import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/http';
import { useNotify } from '../services/notify';

export interface OwnerLite {
  id: number;
  identification: string;
  name: string;
}

interface Owner extends OwnerLite {
  phone: string;
  email: string;
  address: string;
}

import { formatNumber, unformatNumber } from '../utils/formatting';

export const useOwners = () => {
  const { success, error } = useNotify();
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number>(0);
  const [identification, setIdentification] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const [idQuery, setIdQuery] = useState<string>('');
  const [idOptions, setIdOptions] = useState<OwnerLite[]>([]);
  const [idLoading, setIdLoading] = useState<boolean>(false);

  const [nameQuery, setNameQuery] = useState<string>('');
  const [nameOptions, setNameOptions] = useState<OwnerLite[]>([]);
  const [nameLoading, setNameLoading] = useState<boolean>(false);

  const disabledAll = useMemo(() => loading || submitting, [loading, submitting]);
  const canSubmit = useMemo(() => !!identification && !!name && !!phone, [identification, name, phone]);

  const populateForm = useCallback((owner: Owner) => {
    setSelectedOwnerId(owner.id);
    setIdentification(owner.identification);
    setName(owner.name);
    setPhone(owner.phone || '');
    setEmail(owner.email || '');
    setAddress(owner.address || '');

    // Sync query fields
    setIdQuery(formatNumber(owner.identification));
    setNameQuery(owner.name);
  }, []);

  const resetForm = useCallback(() => {
    setSelectedOwnerId(0);
    setIdentification('');
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setIdQuery('');
    setNameQuery('');
  }, []);

  const getOwnerAndPopulate = useCallback(async (id: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get<Owner>(`/owner/${id}`);
      populateForm(res.data);
    } catch (e) {
      // Keep form fields as is, but reset selection
      setSelectedOwnerId(0);
    } finally {
      setLoading(false);
    }
  }, [populateForm, loading]);

  const handleOwnerSelection = useCallback((owner: OwnerLite | null) => {
    if (owner) {
      getOwnerAndPopulate(owner.id);
    } else {
      resetForm();
    }
  }, [getOwnerAndPopulate, resetForm]);

  // Effect for identification search
  useEffect(() => {
    const cleanQuery = idQuery.trim().replace(/[,.]/g, '');
    if (cleanQuery.length < 2) {
      setIdOptions([]);
      return;
    }

    const handle = setTimeout(async () => {
      setIdLoading(true);
      try {
        const res = await api.get<OwnerLite[]>('/owner', { params: { identification: cleanQuery } });
        setIdOptions(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setIdOptions([]);
      } finally {
        setIdLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [idQuery]);

  // Effect for name search
  useEffect(() => {
    const q = nameQuery.trim();
    if (!q) {
      setNameOptions([]);
      return;
    }

    const handle = setTimeout(async () => {
      setNameLoading(true);
      try {
        const res = await api.get<OwnerLite[]>('/owner', { params: { name: q } });
        setNameOptions(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setNameOptions([]);
      } finally {
        setNameLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [nameQuery]);

  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const payload = { identification: parseInt(unformatNumber(identification), 10), name, phone, email, address };
      if (selectedOwnerId > 0) {
        await api.put(`/owner/${selectedOwnerId}`, payload);
        success('Propietario actualizado exitosamente');
      } else {
        await api.post('/owner', payload);
        success('Propietario creado exitosamente');
        // Reset form after successful creation (only for new owners)
        resetForm();
      }
    } catch (err: any) {
      console.error('Error saving owner:', err);
      
      // Handle specific error cases
      if (err?.response?.status === 409 && err?.response?.data?.error === 'IDENTIFICATION_ALREADY_EXISTS') {
        const identification = err.response.data.identification;
        error(`La identificación ${identification} ya existe en la base de datos`);
      } else if (err?.response?.data?.message) {
        error(err.response.data.message);
      } else {
        error('Error al guardar el propietario. Intente nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, identification, name, phone, email, address, selectedOwnerId, resetForm, success, error]);

  return {
    loading,
    submitting,
    selectedOwnerId,
    identification,
    name,
    phone,
    email,
    address,
    disabledAll,
    canSubmit,
    idQuery,
    idOptions,
    idLoading,
    nameQuery,
    nameOptions,
    nameLoading,
    setIdentification,
    setName,
    setPhone,
    setEmail,
    setAddress,
    setIdQuery,
    setNameQuery,
    onSubmit,
    resetForm,
    handleOwnerSelection,
    populateForm,
    getOwnerAndPopulate,
  };
};
