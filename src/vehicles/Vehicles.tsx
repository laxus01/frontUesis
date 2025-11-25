import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Fab,
} from '@mui/material';
import {
    DirectionsCar as DirectionsCarIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useVehiclesList } from './hooks/useVehiclesList';
import { useAuth } from '../hooks/useAuth';
import { Vehicle } from './interfaces/vehicle.interface';
import VehicleFormModal from './components/VehicleFormModal';
import VehiclesTable from './components/VehiclesTable';
import DeleteVehicleDialog from './components/DeleteVehicleDialog';
import StateToggleDialog from './components/StateToggleDialog';

export default function Vehicles(): JSX.Element {
    const { vehicles, loading, deleteVehicle, fetchVehicles, toggleVehicleState } = useVehiclesList();
    const { canManageData } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
    const [stateToggleDialogOpen, setStateToggleDialogOpen] = useState(false);
    const [vehicleToToggle, setVehicleToToggle] = useState<Vehicle | null>(null);

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedVehicle(null);
    };

    const handleVehicleSuccess = () => {
        fetchVehicles(); // Refresh the vehicle list after successful create/update
    };

    const handleEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setModalOpen(true);
    };

    const handleDeleteClick = (vehicle: Vehicle) => {
        setVehicleToDelete(vehicle);
        setDeleteDialogOpen(true);
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

    const handleToggleStateClick = (vehicle: Vehicle) => {
        setVehicleToToggle(vehicle);
        setStateToggleDialogOpen(true);
    };

    const handleStateToggleConfirm = async (reason: string) => {
        if (vehicleToToggle) {
            const result = await toggleVehicleState(vehicleToToggle.id, reason);
            if (result.success) {
                setStateToggleDialogOpen(false);
                setVehicleToToggle(null);
            }
        }
    };

    const handleStateToggleCancel = () => {
        setStateToggleDialogOpen(false);
        setVehicleToToggle(null);
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
            <VehiclesTable
                vehicles={vehicles}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onToggleState={handleToggleStateClick}
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
            <DeleteVehicleDialog
                open={deleteDialogOpen}
                vehicle={vehicleToDelete}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />

            {/* State Toggle Confirmation Dialog */}
            <StateToggleDialog
                open={stateToggleDialogOpen}
                vehicle={vehicleToToggle}
                onConfirm={handleStateToggleConfirm}
                onCancel={handleStateToggleCancel}
            />
        </Box>
    );
}
