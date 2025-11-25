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

interface DeleteOwnerDialogProps {
  open: boolean;
  owner: Owner | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteOwnerDialog({ open, owner, onConfirm, onCancel }: DeleteOwnerDialogProps): JSX.Element {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Confirmar Eliminación
      </DialogTitle>
      <DialogContent>
        <Typography>
          ¿Está seguro que desea eliminar al propietario{' '}
          <strong>{owner?.name}</strong>?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Esta acción no se puede deshacer.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
