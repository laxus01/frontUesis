import { Stack, TextField, Box, Button } from '@mui/material';
import { formatNumber } from '../../utils/formatting';

interface OwnerFormProps {
  identification: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  issuedIn: string;
  disabledAll: boolean;
  setIdentification: (value: string) => void;
  setName: (value: string) => void;
  setPhone: (value: string) => void;
  setEmail: (value: string) => void;
  setAddress: (value: string) => void;
  setIssuedIn: (value: string) => void;
}

export default function OwnerForm({
  identification,
  name,
  phone,
  email,
  address,
  issuedIn,
  disabledAll,
  setIdentification,
  setName,
  setPhone,
  setEmail,
  setAddress,
  setIssuedIn,
}: OwnerFormProps): JSX.Element {
  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Box sx={{ flex: 1 }}>
          <TextField
            label="Identificación"
            size="small"
            fullWidth
            value={identification}
            onChange={e => {
              const cleanValue = e.target.value.replace(/[^\d]/g, '');
              setIdentification(formatNumber(cleanValue));
            }}
            required
            disabled={disabledAll}
            autoFocus
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
            placeholder="Ej: Bogotá, Medellín, Cali"
          />
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Box sx={{ flex: 1 }}>
          <TextField
            label="Nombre Completo"
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
            required
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
  );
}
