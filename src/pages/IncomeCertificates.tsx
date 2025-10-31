import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import IncomeCertificate from './IncomeCertificate';
import OwnerIncomeCertificate from './OwnerIncomeCertificate';

export default function IncomeCertificates(): JSX.Element {
  const [mode, setMode] = useState<'driver' | 'owner'>('driver');

  return (
    <Box maxWidth={900} mx="auto" p={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <DescriptionIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
          Certificación de Ingresos
        </Typography>
      </Box>
      <Box sx={{ height: 3, width: 220, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <ToggleButtonGroup
            color="primary"
            exclusive
            value={mode}
            onChange={(_, newMode) => {
              if (newMode !== null) {
                setMode(newMode);
              }
            }}
            size="small"
          >
            <ToggleButton value="driver">Por conductor</ToggleButton>
            <ToggleButton value="owner">Por propietario</ToggleButton>
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      {mode === 'driver' ? (
        <IncomeCertificate hideTitle />
      ) : (
        <OwnerIncomeCertificate hideTitle />
      )}
    </Box>
  );
}
