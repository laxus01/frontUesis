import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  MenuItem,
  Stack,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Add as AddIcon, Edit as EditIcon, Security as SecurityIcon, Business as BusinessIcon } from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { usePolicies } from '../hooks/usePolicies';
import { useNotify } from '../services/notify';
import CatalogService from '../services/catalog.service';
import DataTable from '../components/common/DataTable';
import type { TableColumn, TableAction } from '../components/common/DataTable';
import type { Policy, CreatePolicyPayload, UpdatePolicyPayload, Insurer } from '../types/policy.types';

// Componente para selector de aseguradora con opción de crear nueva
type WithInsurerSelectorProps = {
  value: string;
  options: Insurer[];
  onChange: (id: string) => void;
  onNewItemCreated: (newItem: Insurer) => void;
  disabled?: boolean;
};

function WithInsurerSelector({ value, options, onChange, onNewItemCreated, disabled }: WithInsurerSelectorProps) {
  const { warning, error, success } = useNotify();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      warning('Ingrese un nombre válido');
      return;
    }
    setSaving(true);
    try {
      const created = await CatalogService.createInsurer(trimmed);
      onChange(created.id.toString());
      onNewItemCreated(created as Insurer);
      setOpen(false);
      setName('');
      success('Aseguradora creada');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'No se pudo crear la aseguradora';
      error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControl fullWidth required disabled={disabled}>
          <InputLabel id="insurer-select-label">Aseguradora</InputLabel>
          <Select
            labelId="insurer-select-label"
            label="Aseguradora"
            value={value || ''}
            displayEmpty
            onChange={(e) => onChange(e.target.value as string)}
          >
            {options?.map((o) => (
              <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
            )) || []}
          </Select>
        </FormControl>
        <Tooltip title="Agregar aseguradora">
          <span>
            <IconButton 
              color="primary" 
              onClick={() => setOpen(true)} 
              disabled={disabled}
              aria-label="Agregar aseguradora"
            >
              <BusinessIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Agregar Aseguradora</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de la aseguradora"
            type="text"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreate();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving || !name.trim()}
          >
            {saving ? 'Guardando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const Policies: React.FC = () => {
  const { policies, insurers, loading, fetchPolicies, fetchInsurers, createPolicy, updatePolicy } = usePolicies();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  
  const [formData, setFormData] = useState({
    insurerId: '',
    contractual: '',
    contractualExpires: null as Dayjs | null,
    extraContractual: '',
    extraContractualExpires: null as Dayjs | null
  });

  useEffect(() => {
    fetchPolicies();
    fetchInsurers();
  }, [fetchPolicies, fetchInsurers]);

  const handleOpenDialog = (policy?: Policy) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData({
        insurerId: policy.insurerId.toString(),
        contractual: policy.contractual,
        contractualExpires: dayjs(policy.contractualExpires),
        extraContractual: policy.extraContractual,
        extraContractualExpires: dayjs(policy.extraContractualExpires)
      });
    } else {
      setEditingPolicy(null);
      setFormData({
        insurerId: '',
        contractual: '',
        contractualExpires: null,
        extraContractual: '',
        extraContractualExpires: null
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPolicy(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.insurerId || !formData.contractual || !formData.contractualExpires || 
        !formData.extraContractual || !formData.extraContractualExpires) {
      return;
    }

    const payload: CreatePolicyPayload | UpdatePolicyPayload = {
      insurerId: parseInt(formData.insurerId),
      contractual: formData.contractual,
      contractualExpires: formData.contractualExpires.format('YYYY-MM-DD'),
      extraContractual: formData.extraContractual,
      extraContractualExpires: formData.extraContractualExpires.format('YYYY-MM-DD')
    };

    let result;
    if (editingPolicy) {
      result = await updatePolicy(editingPolicy.id, payload);
    } else {
      result = await createPolicy(payload as CreatePolicyPayload);
    }

    if (result.success) {
      handleCloseDialog();
      // Refrescar la tabla después de crear/actualizar
      await fetchPolicies();
    }
  };


  const columns: TableColumn<Policy>[] = [
    {
      id: 'id',
      label: 'ID',
      sortable: true,
      minWidth: 80
    },
    {
      id: 'insurer',
      label: 'Aseguradora',
      sortable: true,
      render: (value, policy) => policy.insurer?.name || '-'
    },
    {
      id: 'contractual',
      label: 'Contractual',
      sortable: true
    },
    {
      id: 'contractualExpires',
      label: 'Vence Contractual',
      sortable: true,
      render: (value, policy) => dayjs(policy.contractualExpires).format('YYYY-MM-DD')
    },
    {
      id: 'extraContractual',
      label: 'Extracontractual',
      sortable: true
    },
    {
      id: 'extraContractualExpires',
      label: 'Vence Extracontractual',
      sortable: true,
      render: (value, policy) => dayjs(policy.extraContractualExpires).format('YYYY-MM-DD')
    },
    {
      id: 'state',
      label: 'Estado',
      sortable: true,
      render: (value, policy) => (
        <Chip
          label={policy.state === 1 ? 'Activo' : 'Inactivo'}
          color={policy.state === 1 ? 'success' : 'error'}
          size="small"
        />
      )
    }
  ];

  const actions: TableAction<Policy>[] = [
    {
      label: 'Editar',
      icon: <EditIcon />,
      color: 'primary',
      onClick: (policy) => handleOpenDialog(policy),
      show: (policy) => policy.state === 1
    }
  ];

  const isFormValid = formData.insurerId && formData.contractual && formData.contractualExpires && 
                      formData.extraContractual && formData.extraContractualExpires;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <SecurityIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
          Gestión de Polizas
        </Typography>
      </Box>
      <Box sx={{ height: 3, width: 100, bgcolor: 'primary.main', borderRadius: 1, mb: 3 }} />

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Seguro
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={policies}
        actions={actions}
        loading={loading}
        searchPlaceholder="Buscar seguros..."
      />

      {/* Dialog para crear/editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPolicy ? 'Editar Seguro' : 'Nuevo Seguro'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <WithInsurerSelector
              value={formData.insurerId}
              options={insurers}
              onChange={(id) => handleInputChange('insurerId', id)}
              onNewItemCreated={(newItem) => {
                // La lista se actualizará automáticamente al refrescar
                fetchInsurers();
              }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Contractual"
                value={formData.contractual}
                onChange={(e) => handleInputChange('contractual', e.target.value)}
                required
              />
              <DatePicker
                label="Vence Contractual"
                value={formData.contractualExpires}
                onChange={(value) => handleInputChange('contractualExpires', value)}
                format="YYYY-MM-DD"
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Extracontractual"
                value={formData.extraContractual}
                onChange={(e) => handleInputChange('extraContractual', e.target.value)}
                required
              />
              <DatePicker
                label="Vence Extracontractual"
                value={formData.extraContractualExpires}
                onChange={(value) => handleInputChange('extraContractualExpires', value)}
                format="YYYY-MM-DD"
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!isFormValid || loading}
          >
            {editingPolicy ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Policies;
