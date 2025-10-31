import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Chip,
  TextField,
} from '@mui/material';
import {
  DirectionsCar as DirectionsCarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import DataTable, { TableColumn, TableAction } from '../components/common/DataTable';
import VehicleFormModal from '../components/modals/VehicleFormModal';
import { useVehiclesList, Vehicle } from '../hooks/useVehiclesList';
import { useAuth } from '../hooks/useAuth';

export default function Vehicles(): JSX.Element {
  const { vehicles, loading, deleteVehicle, fetchVehicles, toggleVehicleState } = useVehiclesList();
  const { canManageData } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [stateToggleDialogOpen, setStateToggleDialogOpen] = useState(false);
  const [vehicleToToggle, setVehicleToToggle] = useState<Vehicle | null>(null);
  const [toggleReason, setToggleReason] = useState('');

  const columns: TableColumn<Vehicle>[] = [
    {
      id: 'plate',
      label: 'Placa',
      sortable: true,
      render: (value, vehicle) => (
        <Chip 
          label={vehicle.plate} 
          color="primary" 
          variant="outlined" 
          size="small"
        />
      )
    },
    {
      id: 'model',
      label: 'Modelo',
      sortable: true,
    },
    {
      id: 'internalNumber',
      label: 'Número Interno',
      sortable: true,
    },
    {
      id: 'mobileNumber',
      label: 'Número Móvil',
      sortable: true,
      render: (value, vehicle) => vehicle.mobileNumber || '-'
    },
    {
      id: 'make',
      label: 'Marca',
      sortable: true,
      render: (value, vehicle) => vehicle.make?.name || '-'
    },
    {
      id: 'owner',
      label: 'Propietario',
      sortable: true,
      render: (value, vehicle) => vehicle.owner?.name || '-'
    },
    {
      id: 'communicationCompany',
      label: 'Comunicación',
      sortable: true,
      render: (value, vehicle) => vehicle.communicationCompany?.name || '-'
    },
    {
      id: 'line',
      label: 'Línea',
      sortable: true,
      render: (value, vehicle) => vehicle.line || '-'
    },
    {
      id: 'state',
      label: 'Estado',
      sortable: true,
      render: (value, vehicle) => (
        <Chip 
          label={vehicle.state === 1 ? 'Activo' : 'Inactivo'}
          color={vehicle.state === 1 ? 'success' : 'error'}
          variant="filled"
          size="small"
        />
      )
    }
  ];

  // Solo mostrar acciones si el usuario puede gestionar datos (ADMIN o OPERATOR)
  const actions: TableAction<Vehicle>[] = canManageData() ? [
    {
      label: 'Editar',
      icon: <EditIcon />,
      onClick: (vehicle) => {
        setSelectedVehicle(vehicle);
        setModalOpen(true);
      }
    },
    {
      label: (vehicle: Vehicle) => vehicle.state === 1 ? 'Desactivar' : 'Activar',
      icon: (vehicle: Vehicle) => vehicle.state === 1 ? <ToggleOffIcon /> : <ToggleOnIcon />,
      onClick: (vehicle: Vehicle) => {
        setVehicleToToggle(vehicle);
        setStateToggleDialogOpen(true);
      },
      color: (vehicle: Vehicle) => vehicle.state === 1 ? 'warning' : 'success'
    },
    {
      label: 'Eliminar',
      icon: <DeleteIcon />,
      onClick: (vehicle: Vehicle) => {
        setVehicleToDelete(vehicle);
        setDeleteDialogOpen(true);
      },
      color: 'error'
    }
  ] : [];

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedVehicle(null);
  };

  const handleVehicleSuccess = () => {
    fetchVehicles(); // Refresh the vehicle list after successful create/update
  };

  const handleDeleteConfirm = async () => {
    if (vehicleToDelete) {
      await deleteVehicle(vehicleToDelete.id);
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setVehicleToDelete(null);
  };

  const handleStateToggleConfirm = async () => {
    if (vehicleToToggle && toggleReason.trim()) {
      const result = await toggleVehicleState(vehicleToToggle.id, toggleReason.trim());
      if (result.success) {
        setStateToggleDialogOpen(false);
        setVehicleToToggle(null);
        setToggleReason('');
      }
    }
  };

  const handleStateToggleCancel = () => {
    setStateToggleDialogOpen(false);
    setVehicleToToggle(null);
    setToggleReason('');
  };

  return (
    <Box maxWidth={1200} mx="auto" p={2}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <DirectionsCarIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
              Vehículos
            </Typography>
          </Box>
          <Box sx={{ height: 3, width: 170, bgcolor: 'primary.main', borderRadius: 1 }} />
        </Box>
        
        {canManageData() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setModalOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Nuevo Vehículo
          </Button>
        )}
      </Box>

      {/* DataTable */}
      <DataTable
        data={vehicles}
        columns={columns}
        actions={actions}
        loading={loading}
        searchable
        sortable
        paginated
        pageSize={5}
        emptyMessage="No hay vehículos registrados"
        exportConfig={canManageData() ? {
          endpoint: '/vehicles/export/excel',
          filename: 'listado-vehiculos.xlsx'
        } : undefined}
      />

      {/* Floating Action Button - Solo para ADMIN y OPERATOR */}
      {canManageData() && (
        <Fab
          color="primary"
          aria-label="agregar vehículo"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', sm: 'none' }
          }}
          onClick={() => setModalOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Add/Edit Modal */}
      <VehicleFormModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleVehicleSuccess}
        editVehicle={selectedVehicle}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar el vehículo con placa "{vehicleToDelete?.plate}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* State Toggle Confirmation Dialog */}
      <Dialog
        open={stateToggleDialogOpen}
        onClose={handleStateToggleCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {vehicleToToggle?.state === 1 ? 'Desactivar' : 'Activar'} Vehículo
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            ¿Está seguro que desea {vehicleToToggle?.state === 1 ? 'desactivar' : 'activar'} el vehículo con placa "{vehicleToToggle?.plate}"?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Razón del cambio"
            value={toggleReason}
            onChange={(e) => setToggleReason(e.target.value)}
            placeholder="Ingrese la razón del cambio de estado..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStateToggleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleStateToggleConfirm} 
            color={vehicleToToggle?.state === 1 ? 'warning' : 'success'}
            variant="contained"
            disabled={!toggleReason.trim()}
          >
            {vehicleToToggle?.state === 1 ? 'Desactivar' : 'Activar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}