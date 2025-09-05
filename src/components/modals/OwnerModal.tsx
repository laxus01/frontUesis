import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { useOwnerForm } from '../../hooks/useOwnerForm';
import { OwnerLite } from '../../hooks/useOwnerSearch';
import OwnerForm from '../forms/OwnerForm';

interface OwnerModalProps {
  onOwnerCreated: (owner: OwnerLite) => void;
}

export default function OwnerModal({ onOwnerCreated }: OwnerModalProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const handleClose = () => !submitting && setOpen(false);

  const {
    submitting,
    identification,
    name,
    phone,
    email,
    address,
    canSubmit,
    setIdentification,
    setName,
    setPhone,
    setEmail,
    setAddress,
    onSubmit,
  } = useOwnerForm(onOwnerCreated, handleClose);

  return (
    <>
      <Tooltip title="Crear Nuevo Propietario">
        <Button
          variant="outlined"
          startIcon={<PersonAddAlt1Icon />}
          onClick={() => setOpen(true)}
          size="small"
        >
          Nuevo
        </Button>
      </Tooltip>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Crear Nuevo Propietario</DialogTitle>
        <Box component="form" onSubmit={onSubmit}>
          <DialogContent>
            <OwnerForm
              identification={identification}
              name={name}
              phone={phone}
              email={email}
              address={address}
              disabledAll={submitting}
              setIdentification={setIdentification}
              setName={setName}
              setPhone={setPhone}
              setEmail={setEmail}
              setAddress={setAddress}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={submitting}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={!canSubmit || submitting}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
