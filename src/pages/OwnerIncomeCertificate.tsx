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
interface OwnerWithVehicles extends OwnerLite { vehicles?: VehicleLite[] }

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
  const [ownerIdOptions, setOwnerIdOptions] = useState<OwnerWithVehicles[]>([]);
  const [ownerIdLoading, setOwnerIdLoading] = useState(false);
  const [ownerNameQuery, setOwnerNameQuery] = useState('');
  const [ownerNameOptions, setOwnerNameOptions] = useState<OwnerWithVehicles[]>([]);
  const [ownerNameLoading, setOwnerNameLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<OwnerWithVehicles | null>(null);
  
  // Vehicle selection state (from owner's vehicles list)
  const [ownerVehicles, setOwnerVehicles] = useState<VehicleLite[]>([]);
  const [plate, setPlate] = useState<string>('');
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  
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
    setSelectedVehicleIds([]);
    setOwnerVehicles([]);
  };

  const resetAll = () => {
    resetOwnerSearch();
    resetVehicleSearch();
    setAmount('');
  };

  const handleOwnerSelection = (owner: OwnerWithVehicles | null) => {
    setSelectedOwner(owner);
    if (owner) {
      setOwnerId(owner.id);
      setOwnerIdQuery(formatNumber(owner.identification));
      setOwnerNameQuery(owner.name || '');
      setOwnerVehicles(owner.vehicles || []);
      setSelectedVehicleIds([]);
      setPlate('');
    } else {
      setOwnerId(0);
      setOwnerIdQuery('');
      setOwnerNameQuery('');
      setOwnerVehicles([]);
      setSelectedVehicleIds([]);
      setPlate('');
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
        const res = await api.get<OwnerWithVehicles[]>('/owner', { params: { identification: q } });
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
        const res = await api.get<OwnerWithVehicles[]>('/owner', { params: { name: q } });
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

  // Vehicle options now come from the selected owner's vehicles list (no extra API call)



  const amountNumber = useMemo(() => moneyToInteger(amount), [amount]);

  const amountWords = useMemo(() => {
    if (!amountNumber || isNaN(amountNumber)) return '';
    const words = numberToSpanishWords(amountNumber);
    if (!words) return '';
    return `${toTitleCase(words)} Pesos MCTE.`;
  }, [amountNumber]);

  const canSubmit = useMemo(
    () => ownerId > 0 && amountNumber > 0 && selectedVehicleIds.length > 0,
    [ownerId, amountNumber, selectedVehicleIds],
  );

  const onGenerate = async () => {
    if (!canSubmit || !selectedVehicleIds.length) return;
    setSubmitting(true);
    try {
      const payload: any = { amountNumber, amountWords, vehicleIds: selectedVehicleIds };
      const res = await api.post(`/documents/owner-certificate/${ownerId}`, payload, { responseType: 'blob' as any });
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
              Certificación de Ingresos
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
                  multiple
                  options={ownerVehicles}
                  getOptionLabel={(option) => option.plate || ''}
                  value={ownerVehicles.filter(v => selectedVehicleIds.includes(v.id))}
                  onChange={(_event, newValue) => {
                    const ids = (newValue || []).map(v => v.id);
                    setSelectedVehicleIds(ids);
                    if (newValue && newValue.length > 0) {
                      setPlate(newValue[0].plate || '');
                    } else {
                      setPlate('');
                    }
                  }}
                  disabled={disabledAll || !selectedOwner}
                  disablePortal
                  filterOptions={(x) => x}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Placa"
                      size="small"
                      fullWidth
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
