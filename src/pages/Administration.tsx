import React, { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Box, Button, Card, CardContent, CircularProgress, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import type { Dayjs } from 'dayjs';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import api from '../services/http';
import { useNotify } from '../services/notify';

const Administration: React.FC = () => {
  return (
    <Box maxWidth={900} mx="auto" p={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
          Administración
        </Typography>
      </Box>
      <Box sx={{ height: 3, width: 170, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />
      <Card>
        <CardContent>
          <AdministrationForm />
        </CardContent>
      </Card>
    {/* Diálogos integrados en subcomponentes */}
    </Box>
  );
};

export default Administration;

// --- Subcomponent: Formulario ---
interface VehicleLite { id: number; plate: string; model?: string; owner?: { identification: string; name: string; } }

const AdministrationForm: React.FC = () => {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [value, setValue] = useState<string>('');
  const [detail, setDetail] = useState<string>('');
  const [payer, setPayer] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { success, error } = useNotify();

  // Autocomplete de Placa (patrón de PrintControlCard)
  const [plateQuery, setPlateQuery] = useState<string>('');
  const [plateOptions, setPlateOptions] = useState<string[]>([]);
  const [plateResults, setPlateResults] = useState<VehicleLite[]>([]);
  const [plateLoading, setPlateLoading] = useState<boolean>(false);
  const [plate, setPlate] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [ownerIdentification, setOwnerIdentification] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');

  const clearVehicleForm = () => {
    setSelectedVehicleId(null);
    setOwnerIdentification('');
    setOwnerName('');
  };

  const populateVehicleForm = (vehicle: VehicleLite) => {
    if (!vehicle) return;
    setPlate(String(vehicle.plate || ''));
    setSelectedVehicleId(vehicle.id);
    if (vehicle.owner) {
      setOwnerIdentification(String(vehicle.owner.identification || ''));
      setOwnerName(String(vehicle.owner.name || ''));
    } else {
      setOwnerIdentification('');
      setOwnerName('');
    }
    setPlateQuery(String(vehicle.plate || ''));
  };

  // Debounce simple para consulta de placas
  const handlePlateChange = (_event: any, newValue: string | null) => {
    const val = (newValue || '').toUpperCase();
    const found = plateResults.find(v => String(v.plate).trim().toUpperCase() === val.trim());
    if (found) {
      populateVehicleForm(found);
    } else {
      setPlate(val);
      clearVehicleForm();
    }
  };

  const handlePlateInputChange = (_event: any, newInputValue: string, reason: string) => {
    const next = (newInputValue || '').toUpperCase();
    setPlateQuery(next);
    if (reason === 'input') {
      setPlate(next);
      clearVehicleForm();
    }
  };

  const handlePlateBlur = () => {
    const found = plateResults.find(v => String(v.plate).trim().toUpperCase() === plateQuery.trim());
    if (found) {
      populateVehicleForm(found);
    }
  };

  useEffect(() => {
    const q = plateQuery.trim();
    if (!q) { setPlateOptions([]); return; }
    const handle = setTimeout(async () => {
      setPlateLoading(true);
      try {
        const res = await api.get<VehicleLite[]>('/vehicles', { params: { plate: q } });
        const data = Array.isArray(res.data) ? res.data : [];
        setPlateResults(data);
        const plates = Array.from(new Set(data.map(v => String((v as any).plate || '').trim().toUpperCase()).filter(Boolean)));
        setPlateOptions(plates);
      } catch (e: any) {
        setPlateOptions([]);
      } finally {
        setPlateLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [plateQuery]);

  const canSubmit = useMemo(() => {
    return (
      !!selectedVehicleId && selectedVehicleId > 0 && String(value).trim() !== '' && !!detail.trim() && !!payer.trim()
    );
  }, [selectedVehicleId, value, detail, payer]);

  // Formatea solo enteros con separador de miles (es-CO). No permite decimales
  const formatMoneyInput = (input: string): string => {
    if (!input) return '';
    const digits = input.replace(/\D/g, '');
    if (!digits) return '';
    const n = Number(digits);
    return new Intl.NumberFormat('es-CO').format(n);
  };

  // Convierte a entero: elimina puntos y descarta decimales (parte después de la coma)
  const moneyToInteger = (s: string): number => {
    if (!s) return 0;
    const noThousands = s.replace(/\./g, '');
    const intPart = noThousands.split(',')[0] || '';
    const digits = intPart.replace(/[^0-9]/g, '');
    const n = Number(digits || '0');
    return isNaN(n) ? 0 : n;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: any = {
      date: date ? date.format('YYYY-MM-DD') : null,
      value: moneyToInteger(value),
      detail: detail.trim(),
      payer: payer.trim(),
      vehicleId: selectedVehicleId,
    };
    // Append current user id if available
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const uid = userObj?.user?.id;
        if (uid != null) payload.userId = Number(uid);
      }
    } catch {}
    try {
      setSubmitting(true);
      const res = await api.post('/administrations', payload);
      success('Registro creado');
      resetForm();
      console.log('Registro creado:', res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar administración';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
      console.error('Error al guardar administración', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDate(null);
    setPlate('');
    setPlateQuery('');
    setSelectedVehicleId(null);
    setValue('');
    setPayer('');
    setDetail('');
    setOwnerIdentification('');
    setOwnerName('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <DatePicker
              label="Fecha"
              value={date}
              onChange={(v) => setDate(v)}
              format="YYYY-MM-DD"
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Autocomplete
              options={plateOptions}
              value={plate || null}
              onChange={handlePlateChange}
              inputValue={plateQuery}
              onInputChange={handlePlateInputChange}
              onBlur={handlePlateBlur}
              loading={plateLoading}
              freeSolo
              disablePortal
              filterOptions={(x) => x}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Placa"
                  size="small"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {plateLoading ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  required
                />
              )}
            />
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <TextField
              label="Identificación Propietario"
              size="small"
              fullWidth
              value={ownerIdentification}
              disabled
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <TextField
              label="Nombre Propietario"
              size="small"
              fullWidth
              value={ownerName}
              disabled
            />
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <TextField
              label="Valor"
              type="text"
              size="small"
              fullWidth
              value={value}
              onChange={(e) => setValue(formatMoneyInput(e.target.value))}
              inputProps={{ inputMode: 'decimal', pattern: "[0-9.,]*" }}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              required
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <TextField
              label="Pagador"
              type="text"
              size="small"
              fullWidth
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              required
            />
          </Box>
        </Stack>

        <TextField
          label="Detalle"
          type="text"
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          required
        />

        <Box display="flex" gap={1}>
          <Button type="submit" variant="contained" disabled={!canSubmit || submitting}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button type="button" variant="outlined" onClick={resetForm} disabled={submitting}>
            Limpiar
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};
