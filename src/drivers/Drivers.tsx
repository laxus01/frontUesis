import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  PersonAddAlt1 as PersonAddAlt1Icon,
} from '@mui/icons-material';
import { useDriversList } from './hooks/useDriversList';
import { useAuth } from '../hooks/useAuth';
import { Driver } from './interfaces/driver.interface';
import DriverFormModal from './components/DriverFormModal';
import DriversTable from './components/DriversTable';
import DeleteDriverDialog from './components/DeleteDriverDialog';
import StateToggleDialog from './components/StateToggleDialog';

export default function Drivers() {
  const { drivers, loading, fetchDrivers, deleteDriver, toggleDriverState } = useDriversList();
  const { canManageData } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [deleteError, setDeleteError] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stateToggleDialogOpen, setStateToggleDialogOpen] = useState(false);
  const [driverToToggle, setDriverToToggle] = useState<Driver | null>(null);

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

  const handleToggleStateClick = (driver: Driver) => {
    setDriverToToggle(driver);
    setStateToggleDialogOpen(true);
  };

  const handleStateToggleConfirm = async (reason: string) => {
    if (driverToToggle) {
      const result = await toggleDriverState(driverToToggle.id, reason);
      if (result.success) {
        setStateToggleDialogOpen(false);
        setDriverToToggle(null);

        // Refresh the drivers list to ensure UI is in sync
        setTimeout(() => {
          fetchDrivers();
        }, 100);
      }
    }
  };

  const handleStateToggleCancel = () => {
    setStateToggleDialogOpen(false);
    setDriverToToggle(null);
  };

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

      <DriversTable
        drivers={drivers}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleState={handleToggleStateClick}
      />

      <DriverFormModal
        open={modalOpen}
        onClose={handleModalClose}
        editDriver={selectedDriver}
        onSuccess={() => {
          fetchDrivers();
        }}
      />

      <DeleteDriverDialog
        open={deleteDialogOpen}
        driver={driverToDelete}
        error={deleteError}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onClose={handleDeleteDialogClose}
      />

      <StateToggleDialog
        open={stateToggleDialogOpen}
        driver={driverToToggle}
        onConfirm={handleStateToggleConfirm}
        onCancel={handleStateToggleCancel}
      />
    </Box>
  );
}
