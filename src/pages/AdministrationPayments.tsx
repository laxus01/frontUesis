import React, { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import api from '../services/http';
import { useNotify } from '../services/notify';

interface Vehicle { id: number; plate?: string }
interface Administration {
  id: number;
  date: string; // YYYY-MM-DD
  value: number;
  detail: string;
  payer: string;
  vehicle?: Vehicle;
}

const AdministrationPayments: React.FC = () => {
  // Modo: por rango de fechas o por vehículo
  const [mode, setMode] = useState<'date' | 'vehicle'>('date');

  // Estado común
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<Administration[]>([]);
  const { success, error } = useNotify();

  // Estado para modo fecha
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  // Estado para modo vehículo (Autocomplete por placa)
  interface VehicleLite { id: number; plate: string }
  const [plateQuery, setPlateQuery] = useState<string>('');
  const [plateOptions, setPlateOptions] = useState<string[]>([]);
  const [plateResults, setPlateResults] = useState<VehicleLite[]>([]);
  const [plateLoading, setPlateLoading] = useState<boolean>(false);
  const [plate, setPlate] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  // Autocomplete de placas (con debounce)
  useEffect(() => {
    if (mode !== 'vehicle') return; // evita llamadas si no es el modo activo
    const q = (plateQuery || '').trim();
    if (!q) { setPlateOptions([]); setPlateResults([]); return; }
    const handle = setTimeout(async () => {
      setPlateLoading(true);
      try {
        const res = await api.get<VehicleLite[]>('/vehicles', { params: { plate: q } });
        const data = Array.isArray(res.data) ? res.data : [];
        setPlateResults(data);
        const plates = Array.from(new Set(data.map(v => String((v as any).plate || '').trim().toUpperCase()).filter(Boolean)));
        setPlateOptions(plates);
      } catch (e) {
        setPlateOptions([]);
        setPlateResults([]);
      } finally {
        setPlateLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [mode, plateQuery]);

  const canSubmit = useMemo(() => {
    if (mode === 'date') return !!startDate && !!endDate;
    return !!selectedVehicleId && selectedVehicleId > 0;
  }, [mode, startDate, endDate, selectedVehicleId]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      let res;
      if (mode === 'date') {
        if (!startDate || !endDate) return;
        const payload = {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
        };
        res = await api.post<Administration[]>('/administrations/date-range', payload);
      } else {
        if (!selectedVehicleId) return;
        res = await api.post<Administration[]>('/administrations/vehicle', { vehicleId: selectedVehicleId });
      }
      setItems(Array.isArray(res.data) ? res.data : []);
      success('Consulta realizada');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error al consultar';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setItems([]);
    if (mode === 'date') {
      setStartDate(null);
      setEndDate(null);
    } else {
      setPlate('');
      setPlateQuery('');
      setSelectedVehicleId(null);
      setPlateOptions([]);
      setPlateResults([]);
    }
  };

  const total = useMemo(() => items.reduce((acc, it) => acc + (Number(it.value) || 0), 0), [items]);
  const formatter = new Intl.NumberFormat('es-CO');

  return (
    <Box maxWidth={900} mx="auto" p={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <AssessmentIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
          Pagos de Administración
        </Typography>
      </Box>
      <Box sx={{ height: 3, width: 220, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />

      <Card>
        <CardContent>
          <Stack spacing={2}>
            {/* Selector de modo */}
            <ToggleButtonGroup
              color="primary"
              exclusive
              value={mode}
              onChange={(_, val) => { if (val) setMode(val); }}
              size="small"
            >
              <ToggleButton value="date">Por fecha</ToggleButton>
              <ToggleButton value="vehicle">Por vehículo</ToggleButton>
            </ToggleButtonGroup>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {mode === 'date' ? (
                <>
                  <Box sx={{ flex: 1 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Fecha inicial"
                        value={startDate}
                        onChange={(v) => setStartDate(v)}
                        format="YYYY-MM-DD"
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Fecha final"
                        value={endDate}
                        onChange={(v) => setEndDate(v)}
                        format="YYYY-MM-DD"
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Box>
                </>
              ) : (
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
              )}
            </Stack>

            <Box display="flex" gap={1}>
              <Button variant="contained" disabled={!canSubmit || submitting} onClick={handleSubmit}>
                {submitting ? 'CONSULTANDO...' : 'CONSULTAR'}
              </Button>
              <Button variant="outlined" onClick={handleClear} disabled={submitting}>
                LIMPIAR
              </Button>
            </Box>

            {/* Resultado simple */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Resultados: {items.length} registros · Total: ${formatter.format(total)}
              </Typography>
              <Stack spacing={0.5}>
                {items.map((it) => (
                  <Box key={it.id} className="rounded border border-gray-200 px-3 py-2 bg-white">
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
                      <Typography variant="body2"><strong>Fecha:</strong> {it.date}</Typography>
                      <Typography variant="body2"><strong>Valor:</strong> ${formatter.format(Number(it.value) || 0)}</Typography>
                      <Typography variant="body2"><strong>Pagador:</strong> {it.payer}</Typography>
                      {it.vehicle?.plate && (
                        <Typography variant="body2"><strong>Placa:</strong> {it.vehicle.plate}</Typography>
                      )}
                    </Stack>
                    {it.detail && (
                      <Typography variant="body2" color="text.secondary">{it.detail}</Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdministrationPayments;
