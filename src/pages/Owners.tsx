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
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import DataTable, { TableColumn, TableAction } from '../components/common/DataTable';
import OwnerFormModal from '../components/modals/OwnerFormModal';
import { useOwnersList, Owner } from '../hooks/useOwnersList';
import { formatNumber } from '../utils/formatting';
import { useAuth } from '../hooks/useAuth';

export default function Owners(): JSX.Element {
  const { owners, loading, fetchOwners, deleteOwner } = useOwnersList();
  const { canManageData } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [vehiclesErrorDialogOpen, setVehiclesErrorDialogOpen] = useState(false);
  const [vehiclesCount, setVehiclesCount] = useState(0);

  const handleOpenModal = () => {
    setEditingOwner(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingOwner(null);
  };

  const handleModalSuccess = () => {
    fetchOwners(); // Refresh the list after successful creation/update
  };

  const handleEdit = (owner: Owner) => {
    setEditingOwner(owner);
    setModalOpen(true);
  };

  const handleDeleteClick = (owner: Owner) => {
    setSelectedOwner(owner);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedOwner) {
      const result = await deleteOwner(selectedOwner.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setSelectedOwner(null);
      } else if (result.error === 'OWNER_HAS_RELATED_VEHICLES') {
        // Keep dialog open but show error message
        // The error will be handled by a separate dialog
        setDeleteDialogOpen(false);
        setSelectedOwner(null);
        // Show vehicles error dialog
        setVehiclesErrorDialogOpen(true);
        setVehiclesCount(result.vehiclesCount || 0);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedOwner(null);
  };

  // Define table columns
  const columns: TableColumn<Owner>[] = [
    {
      id: 'id',
      label: 'ID',
      minWidth: 70,
      align: 'center',
      sortable: true,
    },
    {
      id: 'identification',
      label: 'Identificación',
      minWidth: 120,
      sortable: true,
      searchable: true,
      format: (value: string) => formatNumber(value),
    },
    {
      id: 'name',
      label: 'Nombre',
      minWidth: 200,
      sortable: true,
      searchable: true,
      render: (value: string, row: Owner) => (
        <Box>
          <Box component="span" sx={{ fontWeight: 500 }}>
            {value}
          </Box>
          <Box component="div" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            ID: {row.identification}
          </Box>
        </Box>
      ),
    },
    {
      id: 'phone',
      label: 'Teléfono',
      minWidth: 120,
      sortable: true,
      searchable: true,
    },
    {
      id: 'email',
      label: 'Correo Electrónico',
      minWidth: 200,
      sortable: true,
      searchable: true,
      render: (value: string) => value || '-',
    },
    {
      id: 'address',
      label: 'Dirección',
      minWidth: 200,
      sortable: true,
      searchable: true,
      render: (value: string) => value || '-',
    },
  ];

  // Define table actions - Solo para ADMIN y OPERATOR
  const actions: TableAction<Owner>[] = canManageData() ? [
    {
      label: 'Editar',
      icon: <EditIcon />,
      onClick: handleEdit,
      color: 'primary',
    },
    {
      label: 'Eliminar',
      icon: <DeleteIcon />,
      onClick: handleDeleteClick,
      color: 'error',
    },
  ] : [];

  return (
    <Box maxWidth={1200} mx="auto" p={2}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <PersonAddIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
              Propietarios
            </Typography>
          </Box>
          <Box sx={{ height: 3, width: 170, bgcolor: 'primary.main', borderRadius: 1 }} />
        </Box>
        
        {canManageData() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
            sx={{ borderRadius: 2 }}
          >
            Nuevo Propietario
          </Button>
        )}
      </Box>

      {/* Data Table */}
      <DataTable
        data={owners}
        columns={columns}
        loading={loading}
        actions={actions}
        searchPlaceholder="Buscar por identificación, nombre, teléfono o email..."
        emptyMessage="No se encontraron propietarios"
        pageSize={5}
        stickyHeader
        maxHeight={600}
        exportConfig={canManageData() ? {
          endpoint: '/owner/export/excel',
          filename: 'listado-propietarios.xlsx'
        } : undefined}
      />

      {/* Floating Action Button for mobile - Solo para ADMIN y OPERATOR */}
      {canManageData() && (
        <Fab
          color="primary"
          aria-label="agregar propietario"
          onClick={handleOpenModal}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', sm: 'none' },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Owner Form Modal */}
      <OwnerFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editOwner={editingOwner}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar al propietario{' '}
            <strong>{selectedOwner?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vehicles Error Dialog */}
      <Dialog
        open={vehiclesErrorDialogOpen}
        onClose={() => setVehiclesErrorDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'warning.main' }}>
          No se puede eliminar el propietario
        </DialogTitle>
        <DialogContent>
          <Typography>
            No se puede eliminar al propietario{' '}
            <strong>{selectedOwner?.name}</strong> porque tiene{' '}
            <strong>{vehiclesCount}</strong> vehículo{vehiclesCount !== 1 ? 's' : ''} relacionado{vehiclesCount !== 1 ? 's' : ''}.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Para eliminar este propietario, primero debe eliminar o reasignar todos los vehículos asociados.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setVehiclesErrorDialogOpen(false)}
            variant="contained"
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
