import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Autocomplete,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import api from '../services/http';
import { useNotify } from '../services/notify';
import { formatMoneyInput, moneyToInteger, numberToSpanishWords, toTitleCase } from '../utils/format';
import { formatNumber } from '../utils/formatting';
import { OwnerLite } from '../hooks/useOwners';


interface VehicleLite { id: number; plate: string; owner?: { id: number; identification: string; name: string; } }

interface OwnerIncomeCertificateProps {
  hideTitle?: boolean;
}

export default function OwnerIncomeCertificate({ hideTitle = false }: OwnerIncomeCertificateProps): JSX.Element {
  const { success, warning, error } = useNotify();
  const [submitting, setSubmitting] = useState(false);
  const [ownerId, setOwnerId] = useState<number>(0);
  const [amount, setAmount] = useState<string>('');
  
  // Owner search state (separated by identification and name)
  const [ownerIdQuery, setOwnerIdQuery] = useState('');
  const [ownerIdOptions, setOwnerIdOptions] = useState<OwnerLite[]>([]);
  const [ownerIdLoading, setOwnerIdLoading] = useState(false);
  const [ownerNameQuery, setOwnerNameQuery] = useState('');
  const [ownerNameOptions, setOwnerNameOptions] = useState<OwnerLite[]>([]);
  const [ownerNameLoading, setOwnerNameLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<OwnerLite | null>(null);
  
  // Vehicle search state
  const [plateQuery, setPlateQuery] = useState<string>('');
  const [plateOptions, setPlateOptions] = useState<string[]>([]);
  const [plateResults, setPlateResults] = useState<VehicleLite[]>([]);
  const [plateLoading, setPlateLoading] = useState<boolean>(false);
  const [plate, setPlate] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  
  const disabledAll = submitting;

  const resetOwnerSearch = () => {
    setOwnerIdQuery('');
    setOwnerNameQuery('');
    setSelectedOwner(null);
    setOwnerId(0);
    setOwnerIdOptions([]);
    setOwnerNameOptions([]);
  };

  const resetVehicleSearch = () => {
    setPlate('');
    setPlateQuery('');
    setSelectedVehicleId(null);
    setPlateOptions([]);
    setPlateResults([]);
  };

  const resetAll = () => {
    resetOwnerSearch();
    resetVehicleSearch();
    setAmount('');
  };

  const populateVehicleForm = (vehicle: VehicleLite) => {
    if (!vehicle) return;
    setPlate(String(vehicle.plate || ''));
    setSelectedVehicleId(vehicle.id);
    setPlateQuery(String(vehicle.plate || ''));
    // Auto-populate owner info from vehicle
    if (vehicle.owner) {
      setOwnerId(vehicle.owner.id);
      setOwnerIdQuery(formatNumber(String(vehicle.owner.identification || '')));
      setOwnerNameQuery(String(vehicle.owner.name || ''));
      setSelectedOwner({
        id: vehicle.owner.id,
        identification: vehicle.owner.identification,
        name: vehicle.owner.name
      } as OwnerLite);
    }
  };

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

  const handleOwnerSelection = (owner: OwnerLite | null) => {
    setSelectedOwner(owner);
    if (owner) {
      setOwnerId(owner.id);
      setOwnerIdQuery(formatNumber(owner.identification));
      setOwnerNameQuery(owner.name || '');
    } else {
      setOwnerId(0);
      setOwnerIdQuery('');
      setOwnerNameQuery('');
    }
  };

  // Search by owner identification
  useEffect(() => {
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
  }, [ownerIdQuery]);

  // Search by owner name
  useEffect(() => {
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
  }, [ownerNameQuery]);

  // Search vehicles by plate
  useEffect(() => {
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
  }, [plateQuery]);



  const amountNumber = useMemo(() => moneyToInteger(amount), [amount]);

  const amountWords = useMemo(() => {
    if (!amountNumber || isNaN(amountNumber)) return '';
    const words = numberToSpanishWords(amountNumber);
    if (!words) return '';
    return `${toTitleCase(words)} Pesos MCTE.`;
  }, [amountNumber]);

  const canSubmit = useMemo(() => ownerId > 0 && amountNumber > 0 && selectedVehicleId !== null && selectedVehicleId > 0, [ownerId, amountNumber, selectedVehicleId]);

  const onGenerate = async () => {
    if (!canSubmit || !selectedVehicleId) return;
    setSubmitting(true);
    try {
      const payload: any = { amountNumber, amountWords };
      const res = await api.post(`/documents/owner-certificate/${ownerId}/${selectedVehicleId}`, payload, { responseType: 'blob' as any });
      const dispo = (res as any)?.headers?.['content-disposition'] || (res as any)?.headers?.['Content-Disposition'];
      let filename = 'certificado_propietario.pdf';
      if (typeof dispo === 'string') {
        const match = dispo.match(/filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i);
        const raw = decodeURIComponent(match?.[1] || match?.[2] || '');
        if (raw) filename = raw;
      }
      const blob = new Blob([res.data], { type: (res as any)?.headers?.['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      success('Certificado generado');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'No se pudo generar el certificado';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxWidth={900} mx="auto" p={hideTitle ? 0 : 1}>
      {!hideTitle && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <DescriptionIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
              Certificación de Ingresos - Propietario
            </Typography>
          </Box>
          <Box sx={{ height: 3, width: 280, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />
        </>
      )}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Vehículo
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Autocomplete
                  options={plateOptions}
                  value={plate || null}
                  onChange={handlePlateChange}
                  inputValue={plateQuery}
                  onInputChange={handlePlateInputChange}
                  onBlur={handlePlateBlur}
                  loading={plateLoading}
                  disabled={disabledAll}
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

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
              Propietario
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Autocomplete
                  options={ownerIdOptions}
                  getOptionLabel={(option) => option.identification ? formatNumber(option.identification) : ''}
                  value={selectedOwner}
                  onChange={(_event, newValue) => handleOwnerSelection(newValue)}
                  inputValue={ownerIdQuery}
                  onInputChange={(_event, newInputValue) => setOwnerIdQuery(newInputValue)}
                  loading={ownerIdLoading}
                  disabled={disabledAll}
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
                  disabled={disabledAll}
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Valor"
                  size="small"
                  fullWidth
                  value={amount}
                  onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
                  placeholder="0"
                  type="text"
                  inputMode="decimal"
                  inputProps={{ pattern: "[0-9.,]*" }}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  disabled={disabledAll}
                  required
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Valor en letras"
                  size="small"
                  fullWidth
                  value={amountWords}
                  disabled
                />
              </Box>
            </Stack>

            <Box display="flex" gap={1}>
              <Button variant="contained" onClick={onGenerate} disabled={!canSubmit || disabledAll}>
                {submitting ? 'Generando...' : 'Generar Certificado'}
              </Button>
              <Button
                variant="outlined"
                disabled={disabledAll}
                onClick={resetAll}
              >
                Limpiar
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
