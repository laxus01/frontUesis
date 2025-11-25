import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Driver } from '../interfaces/driver.interface';

interface DeleteDriverDialogProps {
  open: boolean;
  driver: Driver | null;
  error: any;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteDriverDialog({ open, driver, error, isDeleting, onConfirm, onClose }: DeleteDriverDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {error ? 'Error al eliminar conductor' : 'Confirmar eliminación'}
      </DialogTitle>
      <DialogContent>
        {error ? (
          <Box>
            {error.error === 'DRIVER_NOT_FOUND' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  El conductor no fue encontrado. Es posible que ya haya sido eliminado.
                </Typography>
              </Alert>
            )}

            {error.error === 'DRIVER_HAS_ASSIGNED_VEHICLES' && (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    No se puede eliminar el conductor <strong>{error.data?.driverName}</strong>
                    (ID: {error.data?.driverIdentification}) porque tiene vehículos asignados.
                  </Typography>
                </Alert>

                <List dense>
                  {error.data?.assignedVehicles?.map((vehicle: any) => (
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

            {error.error !== 'DRIVER_NOT_FOUND' && error.error !== 'DRIVER_HAS_ASSIGNED_VEHICLES' && (
              <Alert severity="error">
                <Typography variant="body2">
                  {error.message}
                </Typography>
              </Alert>
            )}
          </Box>
        ) : (
          <Typography>
            ¿Está seguro que desea eliminar al conductor{' '}
            <strong>
              {driver?.firstName} {driver?.lastName}
            </strong>
            ?
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {error ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!error && (
          <Button
            onClick={onConfirm}
            color="error"
            variant="contained"
            disabled={driver === null || isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
