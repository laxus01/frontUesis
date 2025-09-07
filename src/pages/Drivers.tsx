import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit, Delete, PersonAddAlt1 as PersonAddAlt1Icon } from '@mui/icons-material';
import { DataTable } from '../components/common/DataTable';
import DriverFormModal, { Driver } from '../components/modals/DriverFormModal';
import { useDriversList } from '../hooks/useDriversList';
import type { TableColumn, TableAction } from '../components/common/DataTable';

export default function Drivers() {
  const { drivers, loading, fetchDrivers, deleteDriver } = useDriversList();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [deleteError, setDeleteError] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const handleAdd = () => {
    setSelectedDriver(null);
    setModalOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setModalOpen(true);
  };

  const handleDelete = (driver: Driver) => {
    setDriverToDelete(driver);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (driverToDelete) {
      setIsDeleting(true);
      setDeleteError(null);
      
      const result = await deleteDriver(driverToDelete.id);
      
      if (result.success) {
        setDeleteDialogOpen(false);
        setDriverToDelete(null);
      } else {
        setDeleteError(result);
      }
      
      setIsDeleting(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedDriver(null);
    fetchDrivers();
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setDriverToDelete(null);
    setDeleteError(null);
  };


  const columns: TableColumn<Driver>[] = [
    {
      id: 'photo',
      label: 'Foto',
      sortable: false,
      render: (photoUrl, driver) => {
        const hasImageError = imageErrors.has(driver.id);
        
        if (!photoUrl || hasImageError) {
          return (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #ddd',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0)}
              </Typography>
            </Box>
          );
        }

        return (
          <Box
            component="img"
            src={photoUrl}
            alt={`${driver.firstName} ${driver.lastName}`}
            onError={() => {
              setImageErrors(prev => new Set([...prev, driver.id]));
            }}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid #eee',
              display: 'block',
              flexShrink: 0,
            }}
          />
        );
      },
    },
    {
      id: 'firstName',
      label: 'Nombre',
      sortable: true,
    },
    {
      id: 'lastName',
      label: 'Apellido',
      sortable: true,
    },
    {
      id: 'identification',
      label: 'Identificación',
      sortable: true,
    },
    {
      id: 'phone',
      label: 'Teléfono',
      sortable: false,
    },
    {
      id: 'license',
      label: 'N° Licencia',
      sortable: true,
    },
    {
      id: 'category',
      label: 'Categoría',
      sortable: true,
    },
    {
      id: 'expiresOn',
      label: 'Vencimiento',
      sortable: true,
      render: (expiresOn) => new Date(expiresOn).toLocaleDateString(),
    },
    {
      id: 'bloodType',
      label: 'Tipo Sangre',
      sortable: true,
    },
  ];

  const actions: TableAction<Driver>[] = [
    {
      label: 'Editar',
      icon: <Edit />,
      onClick: handleEdit,
      color: 'primary',
    },
    {
      label: 'Eliminar',
      icon: <Delete />,
      onClick: handleDelete,
      color: 'error',
    },
  ];


  return (
    <Box maxWidth={1200} mx="auto" p={2}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <PersonAddAlt1Icon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
              Conductores
            </Typography>
          </Box>
          <Box sx={{ height: 3, width: 170, bgcolor: 'primary.main', borderRadius: 1 }} />
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Agregar Conductor
        </Button>
      </Box>

      <DataTable
        data={drivers}
        columns={columns}
        actions={actions}
        loading={loading}
        searchable
        sortable
        paginated
        pageSize={10}
        emptyMessage="No hay conductores registrados"
        exportConfig={{
          endpoint: '/drivers/export/excel',
          filename: 'listado-conductores.xlsx'
        }}
      />

      <DriverFormModal
        open={modalOpen}
        onClose={handleModalClose}
        editDriver={selectedDriver}
        onSuccess={fetchDrivers}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {deleteError ? 'Error al eliminar conductor' : 'Confirmar eliminación'}
        </DialogTitle>
        <DialogContent>
          {deleteError ? (
            <Box>
              {deleteError.error === 'DRIVER_NOT_FOUND' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    El conductor no fue encontrado. Es posible que ya haya sido eliminado.
                  </Typography>
                </Alert>
              )}
              
              {deleteError.error === 'DRIVER_HAS_ASSIGNED_VEHICLES' && (
                <Box>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      No se puede eliminar el conductor <strong>{deleteError.data?.driverName}</strong> 
                      (ID: {deleteError.data?.driverIdentification}) porque tiene vehículos asignados.
                    </Typography>
                  </Alert>
                  
                  
                  <List dense>
                    {deleteError.data?.assignedVehicles?.map((vehicle: any) => (
                      <ListItem key={vehicle.vehicleId} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={`${vehicle.make} ${vehicle.model}`}
                          secondary={`Placa: ${vehicle.plate}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Para eliminar este conductor, primero debe desasignar o eliminar los vehículos asociados.
                  </Typography>
                </Box>
              )}
              
              {deleteError.error !== 'DRIVER_NOT_FOUND' && deleteError.error !== 'DRIVER_HAS_ASSIGNED_VEHICLES' && (
                <Alert severity="error">
                  <Typography variant="body2">
                    {deleteError.message}
                  </Typography>
                </Alert>
              )}
            </Box>
          ) : (
            <Typography>
              ¿Está seguro que desea eliminar al conductor{' '}
              <strong>
                {driverToDelete?.firstName} {driverToDelete?.lastName}
              </strong>
              ?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>
            {deleteError ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!deleteError && (
            <Button
              onClick={confirmDelete}
              color="error"
              variant="contained"
              disabled={driverToDelete === null || isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
