import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CarCrash as AccidentIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { useAccidents } from '../hooks/useAccidents';
import { useAuth } from '../hooks/useAuth';
import { Accident, CreateAccidentPayload, UpdateAccidentPayload } from '../types/accident.types';
import { useSnackbar } from '../components/SnackbarProvider';
import DataTable, { TableColumn, TableAction } from '../components/common/DataTable';
import http from '../services/http';

dayjs.locale('es');

interface VehicleOption {
  id: number;
  plate: string;
  model: string;
  make?: string;
}

const Accidents: React.FC = () => {
  const { accidents, loading, createAccident, updateAccident, deleteAccident } = useAccidents();
  const { canManageData } = useAuth();
  const { success: showSuccess, error: showError } = useSnackbar();

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editingAccident, setEditingAccident] = useState<Accident | null>(null);
  const [selectedAccident, setSelectedAccident] = useState<Accident | null>(null);
  const [viewingAccident, setViewingAccident] = useState<Accident | null>(null);

  // Vehicle search states
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);

  const [formData, setFormData] = useState<CreateAccidentPayload>({
    vehicleId: 0,
    accidentDate: dayjs().format('YYYY-MM-DD'),
    detail: ''
  });

  const [accidentDate, setAccidentDate] = useState<Dayjs | null>(dayjs());

  // Columnas de la tabla
  const columns: TableColumn<Accident>[] = [
    {
      id: 'accidentDate',
      label: 'Fecha',
      sortable: true,
      render: (_value, row) => new Date(row.accidentDate).toLocaleDateString('es-ES')
    },
    {
      id: 'vehicle',
      label: 'Placa',
      sortable: false,
      render: (_value, row) => (
        <strong>{row.vehicle?.plate || '-'}</strong>
      )
    },
    {
      id: 'model',
      label: 'Modelo',
      sortable: false,
      render: (_value, row) => row.vehicle?.model || '-'
    },
    {
      id: 'make',
      label: 'Marca',
      sortable: false,
      render: (_value, row) => row.vehicle?.make?.name || '-'
    },
    {
      id: 'owner',
      label: 'Propietario',
      sortable: false,
      render: (_value, row) => {
        const owner = row.vehicle?.owner;
        if (!owner || !owner.name) return '-';
        return owner.name;
      }
    }
  ];

  // Acciones de la tabla
  const actions: TableAction<Accident>[] = [
    {
      label: 'Ver Detalle',
      icon: <VisibilityIcon />,
      color: 'info',
      onClick: handleViewDetail
    },
    ...(canManageData() ? [
      {
        label: 'Editar',
        icon: <EditIcon />,
        color: 'primary',
        onClick: handleEdit
      },
      {
        label: 'Eliminar',
        icon: <DeleteIcon />,
        color: 'error',
        onClick: handleDeleteClick
      }
    ] as TableAction<Accident>[] : [])
  ];

  function handleEdit(accident: Accident) {
    setEditingAccident(accident);
    setFormData({
      vehicleId: accident.vehicleId,
      accidentDate: accident.accidentDate,
      detail: accident.detail
    });
    setAccidentDate(dayjs(accident.accidentDate));
    
    // Set selected vehicle
    if (accident.vehicle) {
      setSelectedVehicle({
        id: accident.vehicle.id,
        plate: accident.vehicle.plate,
        model: accident.vehicle.model,
        make: accident.vehicle.make?.name
      });
      setVehicleQuery(accident.vehicle.plate);
    }
    
    setOpenDialog(true);
  }

  function handleViewDetail(accident: Accident) {
    setViewingAccident(accident);
    setOpenDetailDialog(true);
  }

  function handleDeleteClick(accident: Accident) {
    setSelectedAccident(accident);
    setOpenDeleteDialog(true);
  }

  const handleOpenCreate = () => {
    setEditingAccident(null);
    setFormData({
      vehicleId: 0,
      accidentDate: dayjs().format('YYYY-MM-DD'),
      detail: ''
    });
    setAccidentDate(dayjs());
    setSelectedVehicle(null);
    setVehicleQuery('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAccident(null);
    setSelectedVehicle(null);
    setVehicleQuery('');
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedAccident(null);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setViewingAccident(null);
  };

  // Search vehicles
  const searchVehicles = async (query: string) => {
    if (!query || query.length < 2) {
      setVehicleOptions([]);
      return;
    }

    try {
      setVehicleLoading(true);
      const response = await http.get<any[]>(`/vehicles`, {
        params: { plate: query }
      });
      
      const vehicles: VehicleOption[] = response.data.map((v: any) => ({
        id: v.id,
        plate: v.plate,
        model: v.model,
        make: v.make?.name
      }));
      
      setVehicleOptions(vehicles);
    } catch (error) {
      console.error('Error searching vehicles:', error);
      setVehicleOptions([]);
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleVehicleInputChange = (_event: any, value: string) => {
    setVehicleQuery(value);
    searchVehicles(value);
  };

  const handleVehicleChange = (_event: any, value: VehicleOption | null) => {
    setSelectedVehicle(value);
    setFormData(prev => ({
      ...prev,
      vehicleId: value?.id || 0
    }));
  };

  const handleDateChange = (date: Dayjs | null) => {
    setAccidentDate(date);
    setFormData(prev => ({
      ...prev,
      accidentDate: date ? date.format('YYYY-MM-DD') : ''
    }));
  };

  const handleSubmit = async () => {
    if (!formData.vehicleId || !formData.accidentDate || !formData.detail.trim()) {
      showError('Por favor complete todos los campos');
      return;
    }

    if (editingAccident) {
      const payload: UpdateAccidentPayload = {
        vehicleId: formData.vehicleId,
        accidentDate: formData.accidentDate,
        detail: formData.detail
      };
      
      const result = await updateAccident(editingAccident.id, payload);
      if (result.success) {
        showSuccess('Accidente actualizado exitosamente');
        handleCloseDialog();
      } else {
        showError(result.error || 'Error al actualizar accidente');
      }
    } else {
      const result = await createAccident(formData);
      if (result.success) {
        showSuccess('Accidente registrado exitosamente');
        handleCloseDialog();
      } else {
        showError(result.error || 'Error al registrar accidente');
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedAccident) return;

    const result = await deleteAccident(selectedAccident.id);
    if (result.success) {
      showSuccess('Accidente eliminado exitosamente');
      handleCloseDeleteDialog();
    } else {
      showError(result.error || 'Error al eliminar accidente');
    }
  };

  if (loading && accidents.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <AccidentIcon sx={{ fontSize: 32, color: 'error.main' }} />
              <Typography variant="h5" component="h1">
                Gestión de Accidentalidad
              </Typography>
            </Box>
            {canManageData() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
              >
                Registrar Accidente
              </Button>
            )}
          </Box>

          <DataTable
            columns={columns}
            data={accidents}
            actions={actions}
            loading={loading}
            emptyMessage="No hay accidentes registrados"
          />
        </Paper>

        {/* Dialog para crear/editar accidente */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingAccident ? 'Editar Accidente' : 'Registrar Nuevo Accidente'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Autocomplete
                value={selectedVehicle}
                onChange={handleVehicleChange}
                inputValue={vehicleQuery}
                onInputChange={handleVehicleInputChange}
                options={vehicleOptions}
                getOptionLabel={(option) => `${option.plate} - ${option.model}${option.make ? ` (${option.make})` : ''}`}
                loading={vehicleLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Vehículo"
                    required
                    placeholder="Buscar por placa..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {vehicleLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <DatePicker
                label="Fecha del Accidente"
                value={accidentDate}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    required: true,
                    fullWidth: true
                  }
                }}
              />

              <TextField
                label="Detalle del Accidente"
                value={formData.detail}
                onChange={(e) => setFormData(prev => ({ ...prev, detail: e.target.value }))}
                multiline
                rows={4}
                required
                fullWidth
                placeholder="Describa los detalles del accidente..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.vehicleId || !formData.accidentDate || !formData.detail.trim()}
            >
              {editingAccident ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para ver detalle del accidente */}
        <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <VisibilityIcon color="info" />
              <span>Detalle del Accidente</span>
            </Box>
          </DialogTitle>
          <DialogContent>
            {viewingAccident && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Fecha del Accidente
                  </Typography>
                  <Typography variant="body1">
                    {new Date(viewingAccident.accidentDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Vehículo
                  </Typography>
                  <Typography variant="body1">
                    <strong>Placa:</strong> {viewingAccident.vehicle?.plate || '-'} | {' '}
                    <strong>Modelo:</strong> {viewingAccident.vehicle?.model || '-'} | {' '}
                    <strong>Marca:</strong> {viewingAccident.vehicle?.make?.name || '-'}
                  </Typography>
                </Box>

                {viewingAccident.vehicle?.owner && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Propietario
                    </Typography>
                    <Typography variant="body1">
                      <strong>Nombre:</strong> {viewingAccident.vehicle.owner.name} {viewingAccident.vehicle.owner.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Identificación:</strong> {viewingAccident.vehicle.owner.identification} | {' '}
                      <strong>Teléfono:</strong> {viewingAccident.vehicle.owner.phone}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Detalle del Accidente
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      backgroundColor: 'grey.50',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    <Typography variant="body1">
                      {viewingAccident.detail}
                    </Typography>
                  </Paper>
                </Box>

                {viewingAccident.createdAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Registrado el: {new Date(viewingAccident.createdAt).toLocaleString('es-ES')}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailDialog} variant="contained">
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de confirmación para eliminar */}
        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Está seguro que desea eliminar el registro del accidente del vehículo{' '}
              <strong>{selectedAccident?.vehicle?.plate}</strong> ocurrido el{' '}
              <strong>{selectedAccident ? new Date(selectedAccident.accidentDate).toLocaleDateString('es-ES') : ''}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Accidents;
