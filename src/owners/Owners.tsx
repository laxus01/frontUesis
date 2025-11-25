import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Fab,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useOwnersList } from './hooks/useOwnersList';
import { Owner } from './interfaces/owner.interface';
import OwnerFormModal from './components/OwnerFormModal';
import OwnersTable from './components/OwnersTable';
import DeleteOwnerDialog from './components/DeleteOwnerDialog';
import OwnerDependencyDialog from './components/OwnerDependencyDialog';

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
      <OwnersTable
        owners={owners}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
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
      <DeleteOwnerDialog
        open={deleteDialogOpen}
        owner={selectedOwner}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Vehicles Error Dialog */}
      <OwnerDependencyDialog
        open={vehiclesErrorDialogOpen}
        owner={selectedOwner}
        vehiclesCount={vehiclesCount}
        onClose={() => setVehiclesErrorDialogOpen(false)}
      />
    </Box>
  );
}
