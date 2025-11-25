import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material';
import { Owner } from '../interfaces/owner.interface';

interface OwnerDependencyDialogProps {
  open: boolean;
  owner: Owner | null;
  vehiclesCount: number;
  onClose: () => void;
}

export default function OwnerDependencyDialog({ open, owner, vehiclesCount, onClose }: OwnerDependencyDialogProps): JSX.Element {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ color: 'warning.main' }}>
        No se puede eliminar el propietario
      </DialogTitle>
      <DialogContent>
        <Typography>
          No se puede eliminar al propietario{' '}
          <strong>{owner?.name}</strong> porque tiene{' '}
          <strong>{vehiclesCount}</strong> vehículo{vehiclesCount !== 1 ? 's' : ''} relacionado{vehiclesCount !== 1 ? 's' : ''}.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Para eliminar este propietario, primero debe eliminar o reasignar todos los vehículos asociados.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}
