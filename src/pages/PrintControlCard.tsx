import React, { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Box, Card, CardContent, CircularProgress, IconButton, Stack, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';
import api from '../services/http';
import { useNotify } from '../services/notify';
import PrintIcon from '@mui/icons-material/Print';

// Types
interface DriverLite {
  id: number;
  identification: string;
  firstName?: string;
  lastName?: string;
}

interface VehicleLite {
  id: number;
  plate: string;
  model?: string;
}

interface DriverVehicleRes {
  id: number;
  permitExpiresOn?: string | null;
  note?: string | null;
  soat?: string | null;
  soatExpires?: string | null;
  operationCard?: string | null;
  operationCardExpires?: string | null;
  contractualExpires?: string | null;
  extraContractualExpires?: string | null;
  technicalMechanicExpires?: string | null;
  driver?: any;
  vehicle?: any;
}

export default function PrintControlCard(): JSX.Element {
  const { error } = useNotify();

  // Driver autocomplete state
  const [idQuery, setIdQuery] = useState('');
  const [idOptions, setIdOptions] = useState<string[]>([]);
  const [idResults, setIdResults] = useState<DriverLite[]>([]);
  const [idLoading, setIdLoading] = useState(false);
  const [identification, setIdentification] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  // Vehicle autocomplete state
  const [plateQuery, setPlateQuery] = useState('');
  const [plateOptions, setPlateOptions] = useState<string[]>([]);
  const [plateResults, setPlateResults] = useState<VehicleLite[]>([]);
  const [plateLoading, setPlateLoading] = useState(false);
  const [plate, setPlate] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  // Results state
  const [loadingResults, setLoadingResults] = useState(false);
  const [results, setResults] = useState<DriverVehicleRes[]>([]);

  // Debounced search drivers by identification
  useEffect(() => {
    const q = idQuery.trim();
    if (!q) { setIdOptions([]); return; }
    const handle = setTimeout(async () => {
      setIdLoading(true);
      try {
        const res = await api.get<DriverLite[]>('/drivers', { params: { identification: q } });
        const data = Array.isArray(res.data) ? res.data : [];
        setIdResults(data);
        const ids = Array.from(new Set(data.map(d => String(d.identification || '').trim()).filter(Boolean)));
        setIdOptions(ids);
      } catch (e: any) {
        setIdOptions([]);
      } finally {
        setIdLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [idQuery]);

  // Debounced search vehicles by plate
  useEffect(() => {
    const q = plateQuery.trim();
    if (!q) { setPlateOptions([]); return; }
    const handle = setTimeout(async () => {
      setPlateLoading(true);
      try {
        const res = await api.get<VehicleLite[]>('/vehicles', { params: { plate: q } });
        const data = Array.isArray(res.data) ? res.data : [];
        setPlateResults(data as any);
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

  // Compute current filter mode and title
  const filterTitle = useMemo(() => {
    if (selectedDriverId && selectedVehicleId) return 'Por conductor y vehículo';
    if (selectedDriverId) return 'Por conductor';
    if (selectedVehicleId) return 'Por vehículo';
    return '';
  }, [selectedDriverId, selectedVehicleId]);

  // Fetch results when a filter is selected
  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedDriverId && !selectedVehicleId) { setResults([]); return; }
      setLoadingResults(true);
      try {
        let data: DriverVehicleRes[] = [];
        if (selectedDriverId && selectedVehicleId) {
          // Fetch by both and intersect on vehicle/driver id
          const [byDriver, byVehicle] = await Promise.all([
            api.get<DriverVehicleRes[]>(`/driver-vehicles/by-driver/${selectedDriverId}`),
            api.get<DriverVehicleRes[]>(`/driver-vehicles/by-vehicle/${selectedVehicleId}`),
          ]);
          const a = Array.isArray(byDriver.data) ? byDriver.data : [];
          const b = Array.isArray(byVehicle.data) ? byVehicle.data : [];
          const setB = new Set(b.map(x => `${x.driver?.id}-${x.vehicle?.id}`));
          data = a.filter(x => setB.has(`${x.driver?.id}-${x.vehicle?.id}`));
        } else if (selectedDriverId) {
          const res = await api.get<DriverVehicleRes[]>(`/driver-vehicles/by-driver/${selectedDriverId}`);
          data = Array.isArray(res.data) ? res.data : [];
        } else if (selectedVehicleId) {
          const res = await api.get<DriverVehicleRes[]>(`/driver-vehicles/by-vehicle/${selectedVehicleId}`);
          data = Array.isArray(res.data) ? res.data : [];
        }
        setResults(data);
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'No se pudo obtener la información';
        error(Array.isArray(msg) ? msg.join('\n') : String(msg));
      } finally {
        setLoadingResults(false);
      }
    };
    fetchResults();
  }, [selectedDriverId, selectedVehicleId, error]);

  // (Se removieron botones de limpiar/imprimir por solicitud)

  return (
    <div className="space-y-3">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 print:hidden">Imprimir tarjeta control</h1>

      <Card className="print:hidden">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Autocomplete
                  options={idOptions}
                  value={identification || null}
                  onChange={(event, newValue) => {
                    const val = (newValue || '').trim();
                    setIdentification(val);
                    if (val) {
                      const found = idResults.find(d => String(d.identification).trim() === val);
                      setSelectedDriverId(found ? Number(found.id) : null);
                    } else {
                      setSelectedDriverId(null);
                    }
                  }}
                  inputValue={idQuery}
                  onInputChange={(e, newInput) => {
                    const next = (newInput || '').trim();
                    setIdQuery(next);
                    setIdentification(next);
                    setSelectedDriverId(null);
                  }}
                  loading={idLoading}
                  freeSolo
                  disablePortal
                  filterOptions={(x) => x}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Identificación del conductor"
                      size="small"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {idLoading ? <CircularProgress color="inherit" size={16} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
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
                      label="Placa del vehículo"
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
                    />
                  )}
                />
              </Box>
            </Stack>

            {/* Botones de Limpiar/Imprimir removidos */}
          </Stack>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {filterTitle && (
            <Typography variant="h6" component="h2">{filterTitle}</Typography>
          )}
          {loadingResults && <CircularProgress size={18} />}
        </div>

        {(!loadingResults && results.length === 0 && (selectedDriverId || selectedVehicleId)) && (
          <Typography variant="body2" color="text.secondary">No hay resultados.</Typography>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 gap-3">
          {results.map((item) => {
            const d = item.driver || {};
            const v = item.vehicle || {};
            const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ');
            const fmt = (s?: string | null) => s ? dayjs(String(s).slice(0,10)).format('YYYY-MM-DD') : '';
            return (
              <Card key={item.id} className="relative print:break-inside-avoid">
                <CardContent>
                  <IconButton
                    size="small"
                    className="!absolute top-2 right-2"
                    aria-label="Imprimir tarjeta"
                    title="Imprimir tarjeta"
                    onClick={() => {
                      // Solo enviar el id del registro drivers_vehicles (dvId) en la URL
                      const dvId = item?.id ? String(item.id) : '';
                      const params = new URLSearchParams();
                      if (dvId) params.set('dvId', dvId);
                      const base = (typeof window !== 'undefined' ? window.location.origin : '') || '';
                      const url = `${base}/absolute-print${params.toString() ? `?${params.toString()}` : ''}`;
                      try {
                        window.open(url, '_blank', 'noopener,noreferrer,width=1200,height=700');
                      } catch {}
                    }}
                  >
                    <PrintIcon fontSize="small" />
                  </IconButton>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={600}>Conductor</Typography>
                    <Typography variant="body2">{fullName || '—'}</Typography>
                    <Typography variant="body2">ID: {d.identification || '—'}</Typography>

                    <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>Vehículo</Typography>
                    <Typography variant="body2">Placa: {v.plate || '—'}</Typography>
                    <Typography variant="body2">Modelo: {v.model || '—'}</Typography>

                    <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>Vigencias</Typography>
                    <Typography variant="body2">Permiso: {fmt(item.permitExpiresOn) || '—'}</Typography>
                    <Typography variant="body2">SOAT: {item.soat || '—'} {item.soatExpires ? `(vence ${fmt(item.soatExpires)})` : ''}</Typography>
                    <Typography variant="body2">Tarjeta Operación: {item.operationCard || '—'} {item.operationCardExpires ? `(vence ${fmt(item.operationCardExpires)})` : ''}</Typography>
                    <Typography variant="body2">Contractual: {fmt(item.contractualExpires) || '—'}</Typography>
                    <Typography variant="body2">Ex Contractual: {fmt(item.extraContractualExpires) || '—'}</Typography>
                    <Typography variant="body2">Téc. Mecánica: {fmt(item.technicalMechanicExpires) || '—'}</Typography>

                    {item.note && (
                      <Typography variant="body2" color="text.secondary">Nota: {item.note}</Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
