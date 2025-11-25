import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material';
import { Vehicle } from '../interfaces/vehicle.interface';

interface DeleteVehicleDialogProps {
    open: boolean;
    vehicle: Vehicle | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteVehicleDialog({ open, vehicle, onConfirm, onCancel }: DeleteVehicleDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                Confirmar eliminación
            </DialogTitle>
            <DialogContent>
                <Typography>
                    ¿Está seguro que desea eliminar el vehículo con placa "{vehicle?.plate}"?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Esta acción no se puede deshacer.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>
                    Cancelar
                </Button>
                <Button
                    onClick={onConfirm}
                    color="error"
                    variant="contained"
                >
                    Eliminar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
