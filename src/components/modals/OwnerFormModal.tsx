import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Box,
  Button,
  Stack,
  TextField,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { formatNumber } from '../../utils/formatting';
import { useOwners } from '../../hooks/useOwners';
import { Owner } from '../../hooks/useOwnersList';

interface OwnerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editOwner?: Owner | null;
}

export default function OwnerFormModal({ open, onClose, onSuccess, editOwner }: OwnerFormModalProps): JSX.Element {
  const {
    submitting,
    identification,
    name,
    phone,
    email,
    address,
    issuedIn,
    disabledAll,
    canSubmit,
    setIdentification,
    setName,
    setPhone,
    setEmail,
    setAddress,
    setIssuedIn,
    onSubmit,
    resetForm,
    populateForm,
  } = useOwners();

  const isEditMode = !!editOwner;

  // Populate form when editing
  useEffect(() => {
    if (editOwner && open) {
      populateForm({
        id: editOwner.id,
        identification: editOwner.identification,
        name: editOwner.name,
        phone: editOwner.phone,
        email: editOwner.email,
        address: editOwner.address,
        issuedIn: (editOwner as any).issuedIn || '',
      } as any);
    } else if (!editOwner && open) {
      resetForm();
    }
  }, [editOwner, open, populateForm, resetForm]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await onSubmit(e);
      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 1
      }}>
        {isEditMode ? 'Editar Propietario' : 'Nuevo Propietario'}
        <IconButton
          aria-label="cerrar"
          onClick={handleClose}
          sx={{ color: 'grey.500' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Identificación"
                  size="small"
                  fullWidth
                  value={identification}
                  onChange={e => setIdentification(formatNumber(e.target.value))}
                  required
                  disabled={disabledAll}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Lugar de Expedición"
                  size="small"
                  fullWidth
                  value={issuedIn}
                  onChange={e => setIssuedIn(e.target.value)}
                  required
                  disabled={disabledAll}
                  placeholder="Ej: Sincelejo Cartagene Bogotá"
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Nombre"
                  size="small"
                  fullWidth
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  disabled={disabledAll}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Teléfono"
                  size="small"
                  fullWidth
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={disabledAll}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Correo Electrónico"
                  size="small"
                  fullWidth
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={disabledAll}
                />
              </Box>
            </Stack>

            <TextField
              label="Dirección"
              size="small"
              fullWidth
              value={address}
              onChange={e => setAddress(e.target.value)}
              disabled={disabledAll}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleClose}
            disabled={disabledAll}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit || disabledAll}
          >
            {submitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Guardar')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
