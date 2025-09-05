import React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { useOwners } from '../hooks/useOwners';
import { formatNumber } from '../utils/formatting';

export default function Owners(): JSX.Element {
  const {
    loading,
    submitting,
    selectedOwnerId,
    identification,
    name,
    phone,
    email,
    address,
    disabledAll,
    canSubmit,
    idQuery,
    idOptions,
    idLoading,
    nameQuery,
    nameOptions,
    nameLoading,
    setIdentification,
    setName,
    setPhone,
    setEmail,
    setAddress,
    setIdQuery,
    setNameQuery,
    onSubmit,
    resetForm,
    handleOwnerSelection,
  } = useOwners();

  const ownerValue = (identification || name) ? { id: selectedOwnerId, identification, name } : null;

  return (
    <Box maxWidth={900} mx="auto" p={1}>
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <PersonAddAlt1Icon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
            Propietarios
          </Typography>
        </Box>
        <Box sx={{ height: 3, width: 170, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />
      </>
      <Card>
        <CardContent>
          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Autocomplete
                    options={idOptions}
                    getOptionLabel={(option) => formatNumber(option.identification)}
                    filterOptions={(x) => x}
                    value={ownerValue}
                    onChange={(_event, newValue) => handleOwnerSelection(newValue)}
                    inputValue={idQuery}
                    onInputChange={(_event, newInputValue) => {
                      const digitsOnly = newInputValue.replace(/\D/g, '');
                      setIdQuery(digitsOnly);
                    }}
                    loading={idLoading}
                    renderInput={(params) => (
                      <TextField {...params} label="Buscar Identificación" size="small" fullWidth required disabled={disabledAll} />
                    )}
                    disabled={disabledAll}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Autocomplete
                    options={nameOptions}
                    getOptionLabel={(option) => option.name}
                    value={ownerValue}
                    onChange={(_event, newValue) => handleOwnerSelection(newValue)}
                    inputValue={nameQuery}
                    onInputChange={(_event, newInputValue) => setNameQuery(newInputValue)}
                    loading={nameLoading}
                    renderInput={(params) => (
                      <TextField {...params} label="Buscar Nombre" size="small" fullWidth required disabled={disabledAll} />
                    )}
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

              <Box display="flex" gap={1}>
                <Button type="submit" variant="contained" disabled={!canSubmit || disabledAll}>
                  {submitting ? (selectedOwnerId > 0 ? 'Actualizando...' : 'Guardando...') : (selectedOwnerId > 0 ? 'Actualizar' : 'Guardar')}
                </Button>
                <Button type="button" variant="outlined" disabled={disabledAll} onClick={resetForm}>
                  Limpiar
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
