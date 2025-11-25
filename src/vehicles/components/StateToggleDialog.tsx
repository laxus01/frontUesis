import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    TextField,
} from '@mui/material';
import { Vehicle } from '../interfaces/vehicle.interface';

interface StateToggleDialogProps {
    open: boolean;
    vehicle: Vehicle | null;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
}

export default function StateToggleDialog({ open, vehicle, onConfirm, onCancel }: StateToggleDialogProps) {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (open) {
            setReason('');
        }
    }, [open]);

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason.trim());
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                {vehicle?.state === 1 ? 'Desactivar' : 'Activar'} Vehículo
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 2 }}>
                    ¿Está seguro que desea {vehicle?.state === 1 ? 'desactivar' : 'activar'} el vehículo con placa "{vehicle?.plate}"?
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Razón del cambio"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ingrese la razón del cambio de estado..."
                    required
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleConfirm}
                    color={vehicle?.state === 1 ? 'warning' : 'success'}
                    variant="contained"
                    disabled={!reason.trim()}
                >
                    {vehicle?.state === 1 ? 'Desactivar' : 'Activar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
