import React, { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Box, Button, Card, CardContent, CircularProgress, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
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
interface VehicleLite { id: number; plate: string; model?: string }

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

  // Debounce simple para consulta de placas
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
      !!date && !!selectedVehicleId && selectedVehicleId > 0 && String(value).trim() !== '' && !!detail.trim() && !!payer.trim()
    );
  }, [date, selectedVehicleId, value, detail, payer]);

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
    const payload = {
      date: date ? date.format('YYYY-MM-DD') : null,
      value: moneyToInteger(value),
      detail: detail.trim(),
      payer: payer.trim(),
      vehicleId: selectedVehicleId,
    };
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
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Fecha"
                value={date}
                onChange={(v) => setDate(v)}
                format="YYYY-MM-DD"
                slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }}
              />
            </LocalizationProvider>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Autocomplete
              options={plateOptions}
              value={plate || null}
              onChange={(event, newValue) => {
                const val = (newValue || '').toUpperCase();
                setPlate(val);
                if (val) {
                  const found = plateResults.find(v => String((v as any).plate).trim().toUpperCase() === val);
                  setSelectedVehicleId(found ? Number((found as any).id) : null);
                } else {
                  setSelectedVehicleId(null);
                }
              }}
              inputValue={plateQuery}
              onInputChange={(e, newInput) => {
                const next = (newInput || '').toUpperCase();
                setPlateQuery(next);
                setPlate(next);
                setSelectedVehicleId(null);
              }}
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
