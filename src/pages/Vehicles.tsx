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
} from '@mui/material';
import {
  DirectionsCar as DirectionsCarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import DataTable, { TableColumn, TableAction } from '../components/common/DataTable';
import VehicleFormModal from '../components/modals/VehicleFormModal';
import { useVehiclesList, Vehicle } from '../hooks/useVehiclesList';

export default function Vehicles(): JSX.Element {
  const { vehicles, loading, deleteVehicle, fetchVehicles } = useVehiclesList();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

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
      id: 'insurer',
      label: 'Aseguradora',
      sortable: true,
      render: (value, vehicle) => vehicle.insurer?.name || '-'
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
    }
  ];

  const actions: TableAction<Vehicle>[] = [
    {
      label: 'Editar',
      icon: <EditIcon />,
      onClick: (vehicle) => {
        setSelectedVehicle(vehicle);
        setModalOpen(true);
      }
    },
    {
      label: 'Eliminar',
      icon: <DeleteIcon />,
      onClick: (vehicle) => {
        setVehicleToDelete(vehicle);
        setDeleteDialogOpen(true);
      },
      color: 'error'
    }
  ];

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
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Nuevo Vehículo
        </Button>
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
        exportConfig={{
          endpoint: '/vehicles/export/excel',
          filename: 'listado-vehiculos.xlsx'
        }}
      />

      {/* Floating Action Button */}
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
    </Box>
  );
}
