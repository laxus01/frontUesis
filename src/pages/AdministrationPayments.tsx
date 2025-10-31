import React, { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Box, Button, Card, CardContent, CircularProgress, IconButton, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { DatePicker } from '@mui/x-date-pickers';
import type { Dayjs } from 'dayjs';
import api from '../services/http';
import { useNotify } from '../services/notify';
import { useOwners, OwnerLite } from '../hooks/useOwners';
import { formatNumber } from '../utils/formatting';
import { useAuth } from '../hooks/useAuth';

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
  const { success, error, warning } = useNotify();
  const { canManageData } = useAuth();
  const [mode, setMode] = useState<'date' | 'vehicle' | 'owner'>('date');

  // Estado común
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [items, setItems] = useState<Administration[]>([]);
  const [searchTitle, setSearchTitle] = useState<string>('');

  // Estado para modo fecha
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  // Estado para modo vehículo (Autocomplete por placa)
  interface VehicleLite { id: number; plate: string; owner?: { id: number; identification: string; name: string; } }
  const [plateQuery, setPlateQuery] = useState<string>('');
  const [plateOptions, setPlateOptions] = useState<string[]>([]);
  const [plateResults, setPlateResults] = useState<VehicleLite[]>([]);
  const [plateLoading, setPlateLoading] = useState<boolean>(false);
  const [plate, setPlate] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [ownerId, setOwnerId] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');

  // Estado para modo propietario (Autocomplete separado por identificación y nombre)
  const [ownerIdQuery, setOwnerIdQuery] = useState('');
  const [ownerIdOptions, setOwnerIdOptions] = useState<OwnerLite[]>([]);
  const [ownerIdLoading, setOwnerIdLoading] = useState(false);
  const [ownerNameQuery, setOwnerNameQuery] = useState('');
  const [ownerNameOptions, setOwnerNameOptions] = useState<OwnerLite[]>([]);
  const [ownerNameLoading, setOwnerNameLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<OwnerLite | null>(null);

  const resetOwnerSearch = () => {
    setOwnerIdQuery('');
    setOwnerNameQuery('');
    setSelectedOwner(null);
    setOwnerIdOptions([]);
    setOwnerNameOptions([]);
  };

  const handleOwnerSelection = (owner: OwnerLite | null) => {
    setSelectedOwner(owner);
    if (owner) {
      setOwnerIdQuery(formatNumber(owner.identification));
      setOwnerNameQuery(owner.name || '');
    } else {
      setOwnerIdQuery('');
      setOwnerNameQuery('');
    }
  };

  const populateVehicleForm = (vehicle: VehicleLite) => {
    if (!vehicle) return;
    setPlate(String(vehicle.plate || ''));
    setSelectedVehicleId(vehicle.id);
    setPlateQuery(String(vehicle.plate || ''));
    setOwnerId(formatNumber(String(vehicle.owner?.identification || '')));
    setOwnerName(String(vehicle.owner?.name || ''));
  };

  // Autocomplete de placas (con debounce)
  const handlePlateChange = (_event: any, newValue: string | null) => {
    const val = (newValue || '').toUpperCase();
    const found = plateResults.find(v => String(v.plate).trim().toUpperCase() === val.trim());
    if (found) {
      populateVehicleForm(found);
    } else {
      setPlate(val);
      setSelectedVehicleId(null);
    }
  };

  const handlePlateInputChange = (_event: any, newInputValue: string, reason: string) => {
    const next = (newInputValue || '').toUpperCase();
    setPlateQuery(next);
    if (reason === 'input') {
      setPlate(next);
      setSelectedVehicleId(null);
    }
  };

  const handlePlateBlur = () => {
    const found = plateResults.find(v => String(v.plate).trim().toUpperCase() === plateQuery.trim());
    if (found) {
      populateVehicleForm(found);
    }
  };

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

  // Búsqueda por identificación del propietario
  useEffect(() => {
    if (mode !== 'owner') return;
    const q = ownerIdQuery.replace(/\./g, '');
    if (!q) {
      setOwnerIdOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setOwnerIdLoading(true);
      try {
        const res = await api.get<OwnerLite[]>('/owner', { params: { identification: q } });
        const data = Array.isArray(res.data) ? res.data : [];
        setOwnerIdOptions(data);
      } catch {
        setOwnerIdOptions([]);
      } finally {
        setOwnerIdLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [mode, ownerIdQuery]);

  // Búsqueda por nombre del propietario
  useEffect(() => {
    if (mode !== 'owner') return;
    const q = ownerNameQuery.trim();
    if (!q) {
      setOwnerNameOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setOwnerNameLoading(true);
      try {
        const res = await api.get<OwnerLite[]>('/owner', { params: { name: q } });
        const data = Array.isArray(res.data) ? res.data : [];
        setOwnerNameOptions(data);
      } catch {
        setOwnerNameOptions([]);
      } finally {
        setOwnerNameLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [mode, ownerNameQuery]);


  const canSubmit = useMemo(() => {
    if (mode === 'date') return !!startDate && !!endDate;
    if (mode === 'vehicle') return !!selectedVehicleId && selectedVehicleId > 0;
    if (mode === 'owner') return !!selectedOwner && selectedOwner.id > 0;
    return false;
  }, [mode, startDate, endDate, selectedVehicleId, selectedOwner]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      let res: any;
      if (mode === 'date') {
        if (!startDate || !endDate) return;
        const payload = {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
        };
        setSearchTitle(`Resultados para el rango de fechas: ${payload.startDate} - ${payload.endDate}`);
        res = await api.post<Administration[]>('/administrations/date-range', payload);
      } else if (mode === 'vehicle') {
        if (!selectedVehicleId) return;
        setSearchTitle(`Resultados para el vehículo con placa: ${plate}`);
        res = await api.post<Administration[]>('/administrations/vehicle', { vehicleId: selectedVehicleId });
      } else if (mode === 'owner') {
        if (!selectedOwner || !selectedOwner.id) return;
        setSearchTitle(`Resultados para el propietario: ${selectedOwner.name}`);
        res = await api.post<Administration[]>('/administrations/owner', { ownerId: selectedOwner.id });
      }

      if (res) {
        setItems(Array.isArray(res.data) ? res.data : []);
        success('Consulta realizada');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error al consultar';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      let payload: any;
      let filename: string;
      let endpoint: string;

      if (mode === 'date') {
        if (!startDate || !endDate) return;
        payload = {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
        };
        filename = `administraciones_${payload.startDate}_${payload.endDate}.xlsx`;
        endpoint = '/administrations/date-range/export/excel';
      } else if (mode === 'vehicle') {
        if (!selectedVehicleId) return;
        payload = { vehicleId: selectedVehicleId };
        filename = `administraciones_vehiculo_${plate}.xlsx`;
        endpoint = '/administrations/vehicle/export/excel';
      } else if (mode === 'owner') {
        if (!selectedOwner || !selectedOwner.id) return;
        payload = { ownerId: selectedOwner.id };
        filename = `administraciones_propietario_${selectedOwner.identification}.xlsx`;
        endpoint = '/administrations/owner/export/excel';
      } else {
        return;
      }

      const response = await api.post(endpoint, payload, {
        responseType: 'blob',
      });
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success('Archivo exportado correctamente');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error al exportar';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setExporting(false);
    }
  };

  const handleClear = () => {
    setItems([]);
    setSearchTitle('');
    if (mode === 'date') {
      setStartDate(null);
      setEndDate(null);
    } else if (mode === 'vehicle') {
      setPlate('');
      setPlateQuery('');
      setSelectedVehicleId(null);
      setPlateOptions([]);
      setPlateResults([]);
      setOwnerId('');
      setOwnerName('');
    } else if (mode === 'owner') {
      resetOwnerSearch();
    }
  };

  const total = useMemo(() => items.reduce((acc, it) => acc + (Number(it.value) || 0), 0), [items]);
  const formatter = new Intl.NumberFormat('es-CO');

  const handlePrint = (it: Administration) => {
    try {
      const id = it?.id ? String(it.id) : '';
      const params = new URLSearchParams();
      if (id) params.set('id', id);
      const base = (typeof window !== 'undefined' ? window.location.origin : '') || '';
      const url = `${base}/absolute-print-administration${params.toString() ? `?${params.toString()}` : ''}`;
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
    } catch { }
  };

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
              <ToggleButton value="owner">Por propietario</ToggleButton>
            </ToggleButtonGroup>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              {mode === 'date' ? (
                <>
                  <Box sx={{ flex: 1 }}>
                    <DatePicker
                      label="Fecha inicial"
                      value={startDate}
                      onChange={(v) => setStartDate(v)}
                      format="YYYY-MM-DD"
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <DatePicker
                      label="Fecha final"
                      value={endDate}
                      onChange={(v) => setEndDate(v)}
                      format="YYYY-MM-DD"
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Box>
                </>
              ) : mode === 'vehicle' ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                  <Box sx={{ flex: 1 }}>
                    <Autocomplete
                      options={plateOptions}
                      value={plate || null}
                      onChange={handlePlateChange}
                      inputValue={plateQuery}
                      onInputChange={handlePlateInputChange}
                      onBlur={handlePlateBlur}
                      loading={plateLoading}
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
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Id. Propietario"
                      value={ownerId}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Nombre Propietario"
                      value={ownerName}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Box>
                </Stack>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                  <Box sx={{ flex: 1 }}>
                    <Autocomplete
                      options={ownerIdOptions}
                      getOptionLabel={(option) => option.identification ? formatNumber(option.identification) : ''}
                      value={selectedOwner}
                      onChange={(_event, newValue) => handleOwnerSelection(newValue)}
                      inputValue={ownerIdQuery}
                      onInputChange={(_event, newInputValue) => setOwnerIdQuery(newInputValue)}
                      loading={ownerIdLoading}
                      disablePortal
                      filterOptions={(x) => x}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar Identificación"
                          size="small"
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {ownerIdLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                          required
                        />
                      )}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Autocomplete
                      options={ownerNameOptions}
                      getOptionLabel={(option) => option.name || ''}
                      value={selectedOwner}
                      onChange={(_event, newValue) => handleOwnerSelection(newValue)}
                      inputValue={ownerNameQuery}
                      onInputChange={(_event, newInputValue) => setOwnerNameQuery(newInputValue)}
                      loading={ownerNameLoading}
                      disablePortal
                      filterOptions={(x) => x}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar Nombre"
                          size="small"
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {ownerNameLoading ? <CircularProgress color="inherit" size={16} /> : null}
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
              )}
            </Stack>

            <Box display="flex" gap={1}>
              <Button variant="contained" disabled={!canSubmit || submitting} onClick={handleSubmit}>
                {submitting ? 'CONSULTANDO...' : 'CONSULTAR'}
              </Button>
              {canManageData() && (
                <Button
                  variant="contained"
                  color="success"
                  disabled={!canSubmit || exporting || submitting}
                  onClick={handleExport}
                  startIcon={<FileDownloadIcon />}
                >
                  {exporting ? 'EXPORTANDO...' : 'EXPORTAR'}
                </Button>
              )}
              <Button variant="outlined" onClick={handleClear} disabled={submitting || exporting}>
                LIMPIAR
              </Button>
            </Box>

            {/* Resultado simple */}
            <Box>
              {searchTitle && (
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  {searchTitle}
                </Typography>
              )}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Resultados: {items.length} registros · Total: ${formatter.format(total)}
              </Typography>
              <Stack spacing={0.5}>
                {items.map((it) => (
                  <Box key={it.id} className="rounded border border-gray-200 px-3 py-2 bg-white">
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flex={1}>
                        <Typography variant="body2"><strong>Fecha:</strong> {it.date}</Typography>
                        <Typography variant="body2"><strong>Valor:</strong> ${formatter.format(Number(it.value) || 0)}</Typography>
                        <Typography variant="body2"><strong>Pagador:</strong> {it.payer}</Typography>
                        {it.vehicle?.plate && (
                          <Typography variant="body2"><strong>Placa:</strong> {it.vehicle.plate}</Typography>
                        )}
                      </Stack>
                      <Tooltip title="Imprimir registro">
                        <span>
                          <IconButton color="primary" size="small" onClick={() => handlePrint(it)}>
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
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
