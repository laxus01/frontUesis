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
  Chip,
  TextField,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit, 
  Delete, 
  PersonAddAlt1 as PersonAddAlt1Icon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { DataTable } from '../components/common/DataTable';
import DriverFormModal, { Driver } from '../components/modals/DriverFormModal';
import DriverStateHistoryModal from '../components/modals/DriverStateHistoryModal';
import { useDriversList } from '../hooks/useDriversList';
import { useAuth } from '../hooks/useAuth';
import type { TableColumn, TableAction } from '../components/common/DataTable';

export default function Drivers() {
  const { drivers, loading, fetchDrivers, deleteDriver, toggleDriverState } = useDriversList();
  const { canManageData, isAdmin } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [deleteError, setDeleteError] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stateToggleDialogOpen, setStateToggleDialogOpen] = useState(false);
  const [driverToToggle, setDriverToToggle] = useState<Driver | null>(null);
  const [toggleReason, setToggleReason] = useState('');
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedDriverForHistory, setSelectedDriverForHistory] = useState<Driver | null>(null);

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
    // Clear cached image errors so updated photos are retried
    setImageErrors(new Set());
    fetchDrivers();
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setDriverToDelete(null);
    setDeleteError(null);
  };

  const handleStateToggleConfirm = async () => {
    if (driverToToggle && toggleReason.trim()) {
      const result = await toggleDriverState(driverToToggle.id, toggleReason.trim());
      if (result.success) {
        setStateToggleDialogOpen(false);
        setDriverToToggle(null);
        setToggleReason('');
        
        // Refresh the drivers list to ensure UI is in sync
        // This is a fallback in case the local state update doesn't work properly
        setTimeout(() => {
          fetchDrivers();
        }, 100);
      }
    }
  };

  const handleStateToggleCancel = () => {
    setStateToggleDialogOpen(false);
    setDriverToToggle(null);
    setToggleReason('');
  };

  const handleViewHistory = (driver: Driver) => {
    setSelectedDriverForHistory(driver);
    setHistoryModalOpen(true);
  };

  const handleHistoryModalClose = () => {
    setHistoryModalOpen(false);
    setSelectedDriverForHistory(null);
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
    {
      id: 'state',
      label: 'Estado',
      sortable: true,
      render: (value, driver) => (
        <Chip 
          label={driver.state === 1 ? 'Activo' : 'Inactivo'}
          color={driver.state === 1 ? 'success' : 'error'}
          variant="filled"
          size="small"
        />
      )
    },
  ];

  // Solo mostrar acciones si el usuario puede gestionar datos.
  // Desactivar/Activar y Eliminar solo se muestran para usuarios ADMIN (o SUPER si se considera admin en useAuth).
  const actions: TableAction<Driver>[] = canManageData()
    ? isAdmin()
      ? [
          {
            label: 'Editar',
            icon: <Edit />,
            onClick: handleEdit,
            color: 'primary',
          },
          {
            label: 'Historial',
            icon: <HistoryIcon />,
            onClick: handleViewHistory,
            color: 'info',
          },
          {
            label: driver => (driver.state === 1 ? 'Desactivar' : 'Activar'),
            icon: (driver) => (driver.state === 1 ? <ToggleOffIcon /> : <ToggleOnIcon />),
            onClick: (driver) => {
              setDriverToToggle(driver);
              setStateToggleDialogOpen(true);
            },
            color: (driver) => (driver.state === 1 ? 'warning' : 'success'),
          },
          {
            label: 'Eliminar',
            icon: <Delete />,
            onClick: handleDelete,
            color: 'error',
          },
        ]
      : [
          {
            label: 'Editar',
            icon: <Edit />,
            onClick: handleEdit,
            color: 'primary',
          },
          {
            label: 'Historial',
            icon: <HistoryIcon />,
            onClick: handleViewHistory,
            color: 'info',
          },
        ]
    : [];

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
        
        {canManageData() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Agregar Conductor
          </Button>
        )}
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
        exportConfig={canManageData() ? {
          endpoint: '/drivers/export/excel',
          filename: 'listado-conductores.xlsx'
        } : undefined}
      />

      <DriverFormModal
        open={modalOpen}
        onClose={handleModalClose}
        editDriver={selectedDriver}
        onSuccess={() => {
          // After a successful create/update, refresh list and reset image error cache
          setImageErrors(new Set());
          fetchDrivers();
        }}
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

      {/* State Toggle Confirmation Dialog */}
      <Dialog
        open={stateToggleDialogOpen}
        onClose={handleStateToggleCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {driverToToggle?.state === 1 ? 'Desactivar' : 'Activar'} Conductor
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            ¿Está seguro que desea {driverToToggle?.state === 1 ? 'desactivar' : 'activar'} al conductor{' '}
            <strong>{driverToToggle?.firstName} {driverToToggle?.lastName}</strong>?
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
            color={driverToToggle?.state === 1 ? 'warning' : 'success'}
            variant="contained"
            disabled={!toggleReason.trim()}
          >
            {driverToToggle?.state === 1 ? 'Desactivar' : 'Activar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Driver State History Modal */}
      {selectedDriverForHistory && (
        <DriverStateHistoryModal
          open={historyModalOpen}
          onClose={handleHistoryModalClose}
          driverId={selectedDriverForHistory.id}
          driverName={`${selectedDriverForHistory.firstName} ${selectedDriverForHistory.lastName}`}
        />
      )}
    </Box>
  );
}