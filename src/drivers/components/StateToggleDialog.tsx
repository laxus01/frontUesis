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
import { Driver } from '../interfaces/driver.interface';

interface StateToggleDialogProps {
  open: boolean;
  driver: Driver | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function StateToggleDialog({ open, driver, onConfirm, onCancel }: StateToggleDialogProps) {
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
        {driver?.state === 1 ? 'Desactivar' : 'Activar'} Conductor
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          ¿Está seguro que desea {driver?.state === 1 ? 'desactivar' : 'activar'} al conductor{' '}
          <strong>{driver?.firstName} {driver?.lastName}</strong>?
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
          color={driver?.state === 1 ? 'warning' : 'success'}
          variant="contained"
          disabled={!reason.trim()}
        >
          {driver?.state === 1 ? 'Desactivar' : 'Activar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
