import { useState, useMemo, useCallback } from 'react';
import api from '../services/http';
import { useNotify } from '../services/notify';
import { OwnerLite } from '../owners/interfaces/owner.interface';

export const useOwnerForm = (onOwnerCreated: (owner: OwnerLite) => void, closeModal: () => void) => {
  const { success, error } = useNotify();
  const [submitting, setSubmitting] = useState(false);
  const [identification, setIdentification] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const canSubmit = useMemo(() => !!identification && !!name && !!phone, [identification, name, phone]);

  const resetForm = useCallback(() => {
    setIdentification('');
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
  }, []);

  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const payload = {
        identification: identification.replace(/[,.]/g, ''),
        name,
        phone,
        email,
        address,
      };
      const res = await api.post<OwnerLite>('/owner', payload);
      success('Propietario creado con éxito.');
      onOwnerCreated(res.data);
      resetForm();
      closeModal();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error creando propietario';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, identification, name, phone, email, address, success, error, onOwnerCreated, resetForm, closeModal]);

  return {
    submitting,
    identification,
    name,
    phone,
    email,
    address,
    canSubmit,
    setIdentification,
    setName,
    setPhone,
    setEmail,
    setAddress,
    onSubmit,
    resetForm,
  };
};
