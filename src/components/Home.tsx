import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon, Home as HomeIcon } from '@mui/icons-material';
import api from '../services/http';
import { useNotify } from '../services/notify';

interface CompanyInfo {
  id?: number | string;
  name?: string;
  nit?: string;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  [key: string]: any;
}

const Home: React.FC = () => {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contractual: '',
    contractualExpires: null as Dayjs | null,
    extraContractual: '',
    extraContractualExpires: null as Dayjs | null
  });
  const { success, error } = useNotify();

  useEffect(() => {
    // Intenta leer 'company' directo
    const rawCompany = localStorage.getItem('company');
    if (rawCompany) {
      try {
        const c = JSON.parse(rawCompany);
        setCompany(c || null);
        initializeFormData(c);
        return;
      } catch {}
    }
    // Fallback: extraer desde 'user'
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        const c = u?.user?.company || null;
        setCompany(c || null);
        initializeFormData(c);
      } catch {
        setCompany(null);
      }
    }
  }, []);

  const initializeFormData = (companyData: CompanyInfo | null) => {
    if (companyData) {
      setFormData({
        contractual: companyData.contractual || '',
        contractualExpires: companyData.contractualExpires ? dayjs(companyData.contractualExpires) : null,
        extraContractual: companyData.extracontractual || companyData.extraContractual || '',
        extraContractualExpires: companyData.extraContractualExpires ? dayjs(companyData.extraContractualExpires) : null
      });
    }
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    initializeFormData(company);
  };

  const handleInputChange = (field: string, value: string | Dayjs | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!company?.id) {
      error('No se encontró el ID de la empresa');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        contractual: formData.contractual,
        contractualExpires: formData.contractualExpires ? dayjs(formData.contractualExpires).format('YYYY-MM-DD') : null,
        extraContractual: formData.extraContractual,
        extraContractualExpires: formData.extraContractualExpires ? dayjs(formData.extraContractualExpires).format('YYYY-MM-DD') : null
      };
      const response = await api.put(`/company/${company.id}`, payload);
      
      // Update local state
      const updatedCompany = { 
        ...company, 
        contractual: formData.contractual,
        contractualExpires: formData.contractualExpires ? dayjs(formData.contractualExpires).format('YYYY-MM-DD') : '',
        extraContractual: formData.extraContractual,
        extraContractualExpires: formData.extraContractualExpires ? dayjs(formData.extraContractualExpires).format('YYYY-MM-DD') : ''
      };
      setCompany(updatedCompany);
      
      // Update localStorage
      localStorage.setItem('company', JSON.stringify(updatedCompany));
      
      success('Información de seguros actualizada correctamente');
      setEditMode(false);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error al actualizar la información');
    } finally {
      setLoading(false);
    }
  };

  const Field: React.FC<{ label: string; value?: any }> = ({ label, value }) => (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value ? String(value) : '-'}</Typography>
    </Stack>
  );

  return (
    <Box maxWidth={900} mx="auto" p={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <HomeIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
          Inicio
        </Typography>
      </Box>
      <Box sx={{ height: 3, width: 100, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />
      
      {company && (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Información de la empresa
              </Typography>
              <Stack spacing={1}>
                <Field label="Nombre" value={company.name || company.razonSocial} />
                <Field label="NIT" value={company.nit || company.taxId} />
                <Field label="Dirección" value={company.address || company.direccion} />
                <Field label="Teléfono" value={company.phone || company.telefono} />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Seguros
                </Typography>
                {!editMode ? (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={handleEditClick}
                    size="small"
                    variant="outlined"
                  >
                    Editar
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<CloseIcon />}
                      onClick={handleCancelEdit}
                      size="small"
                      variant="outlined"
                    >
                      Cancelar
                    </Button>
                    <Button
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      size="small"
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </Box>
                )}
              </Box>
              
              {!editMode ? (
                <Stack spacing={1}>
                  <Field label="Contractual" value={company.contractual} />
                  <Field label="Contractual vence" value={company.contractualExpires ? dayjs(company.contractualExpires).format('YYYY-MM-DD') : '-'} />
                  <Field label="Extracontractual" value={company.extracontractual || company.extraContractual} />
                  <Field label="Extracontractual vence" value={company.extraContractualExpires ? dayjs(company.extraContractualExpires).format('YYYY-MM-DD') : '-'} />
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Contractual"
                        value={formData.contractual}
                        onChange={(e) => handleInputChange('contractual', e.target.value)}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <DatePicker
                        label="Contractual vence"
                        value={formData.contractualExpires}
                        onChange={(v) => handleInputChange('contractualExpires', v)}
                        format="YYYY-MM-DD"
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Box>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Extracontractual"
                        value={formData.extraContractual}
                        onChange={(e) => handleInputChange('extraContractual', e.target.value)}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <DatePicker
                        label="Extracontractual vence"
                        value={formData.extraContractualExpires}
                        onChange={(v) => handleInputChange('extraContractualExpires', v)}
                        format="YYYY-MM-DD"
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Box>
                  </Stack>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
};

export default Home;
