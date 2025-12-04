import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import api from '../services/http';
import { useNotify } from '../services/notify';
import { formatNumber } from '../utils/formatting';

interface VehicleLite { 
  id: number; 
  plate: string; 
  owner?: { id: number; identification: string; name: string; } 
}

interface ActiveContractProps {
  hideTitle?: boolean;
}

export default function ActiveContract({ hideTitle = false }: ActiveContractProps): JSX.Element {
  const { success, error } = useNotify();
  const [submitting, setSubmitting] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLite | null>(null);
  
  // Vehicle search state
  const [plateQuery, setPlateQuery] = useState('');
  const [vehicleOptions, setVehicleOptions] = useState<VehicleLite[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  
  const disabledAll = submitting;

  const resetAll = () => {
    setPlateQuery('');
    setSelectedVehicle(null);
    setVehicleOptions([]);
  };

  // Search vehicles by plate
  useEffect(() => {
    const q = plateQuery.trim().toUpperCase();
    if (!q) {
      setVehicleOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setVehicleLoading(true);
      try {
        const res = await api.get<VehicleLite[]>('/vehicles', { params: { plate: q } });
        const data = Array.isArray(res.data) ? res.data : [];
        setVehicleOptions(data);
      } catch {
        setVehicleOptions([]);
      } finally {
        setVehicleLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [plateQuery]);

  const canSubmit = selectedVehicle !== null;

  const onGenerate = async () => {
    if (!canSubmit || !selectedVehicle) return;
    setSubmitting(true);
    try {
      const res = await api.post(
        `/documents/active-contract/${selectedVehicle.id}`,
        {},
        { responseType: 'blob' as any }
      );
      
      const dispo = (res as any)?.headers?.['content-disposition'] || (res as any)?.headers?.['Content-Disposition'];
      let filename = 'certificado_contrato_vigente.pdf';
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
      success('Certificado generado exitosamente');
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
              Certificado de Contrato Vigente
            </Typography>
          </Box>
          <Box sx={{ height: 3, width: 320, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />
        </>
      )}

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Vehículo
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Autocomplete
                  options={vehicleOptions}
                  getOptionLabel={(option) => option.plate || ''}
                  value={selectedVehicle}
                  onChange={(_event, newValue) => {
                    setSelectedVehicle(newValue);
                    if (newValue) {
                      setPlateQuery(newValue.plate || '');
                    }
                  }}
                  inputValue={plateQuery}
                  onInputChange={(_event, newInputValue) => setPlateQuery(newInputValue.toUpperCase())}
                  loading={vehicleLoading}
                  disabled={disabledAll}
                  disablePortal
                  filterOptions={(x) => x}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Buscar por Placa"
                      size="small"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {vehicleLoading ? <CircularProgress color="inherit" size={16} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      required
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.plate}
                        </Typography>
                        {option.owner && (
                          <Typography variant="caption" color="text.secondary">
                            {option.owner.name} - {formatNumber(option.owner.identification)}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  )}
                />
              </Box>
            </Stack>

            {selectedVehicle && selectedVehicle.owner && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Información del Propietario
                </Typography>
                <Stack spacing={0.5}>
                  <Typography variant="body2">
                    <strong>Nombre:</strong> {selectedVehicle.owner.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Identificación:</strong> {formatNumber(selectedVehicle.owner.identification)}
                  </Typography>
                </Stack>
              </Box>
            )}

            <Box display="flex" gap={1}>
              <Button 
                variant="contained" 
                onClick={onGenerate} 
                disabled={!canSubmit || disabledAll}
              >
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
