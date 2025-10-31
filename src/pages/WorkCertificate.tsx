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
  CircularProgress,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { DatePicker } from '@mui/x-date-pickers';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import api from '../services/http';
import { useNotify } from '../services/notify';
import { formatNumber } from '../utils/formatting';

interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  identification: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpires: string;
}

export default function WorkCertificate(): JSX.Element {
  const { success, error } = useNotify();
  const [submitting, setSubmitting] = useState(false);
  
  // Driver search state (separated by identification and name)
  const [driverIdQuery, setDriverIdQuery] = useState('');
  const [driverIdOptions, setDriverIdOptions] = useState<Driver[]>([]);
  const [driverIdLoading, setDriverIdLoading] = useState(false);
  const [driverNameQuery, setDriverNameQuery] = useState('');
  const [driverNameOptions, setDriverNameOptions] = useState<Driver[]>([]);
  const [driverNameLoading, setDriverNameLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  
  // Date range state
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  
  const disabledAll = submitting;

  const resetDriverSearch = () => {
    setDriverIdQuery('');
    setDriverNameQuery('');
    setSelectedDriver(null);
    setDriverIdOptions([]);
    setDriverNameOptions([]);
  };

  const resetAll = () => {
    resetDriverSearch();
    setStartDate(null);
    setEndDate(null);
  };

  // Función para formatear fecha en español (ej: "1 de abril de 2006")
  const formatDateToSpanish = (date: Dayjs): string => {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const day = date.date();
    const month = months[date.month()];
    const year = date.year();
    return `${day} de ${month} de ${year}`;
  };

  const handleDriverSelection = (driver: Driver | null) => {
    setSelectedDriver(driver);
    if (driver) {
      setDriverIdQuery(formatNumber(driver.identification));
      setDriverNameQuery(`${driver.firstName} ${driver.lastName}`);
    } else {
      setDriverIdQuery('');
      setDriverNameQuery('');
    }
  };

  // Search by driver identification
  useEffect(() => {
    const q = driverIdQuery.replace(/\./g, '');
    if (!q) {
      setDriverIdOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setDriverIdLoading(true);
      try {
        const res = await api.get<Driver[]>('/drivers', { params: { identification: q } });
        const data = Array.isArray(res.data) ? res.data : [];
        setDriverIdOptions(data);
      } catch {
        setDriverIdOptions([]);
      } finally {
        setDriverIdLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [driverIdQuery]);

  // Search by driver name
  useEffect(() => {
    const q = driverNameQuery.trim();
    if (!q) {
      setDriverNameOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setDriverNameLoading(true);
      try {
        const res = await api.get<Driver[]>('/drivers', { params: { name: q } });
        const data = Array.isArray(res.data) ? res.data : [];
        setDriverNameOptions(data);
      } catch {
        setDriverNameOptions([]);
      } finally {
        setDriverNameLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [driverNameQuery]);

  const canSubmit = useMemo(() => {
    return !!selectedDriver && selectedDriver.id > 0 && !!startDate && !!endDate;
  }, [selectedDriver, startDate, endDate]);

  const onGenerate = async () => {
    if (!canSubmit || !selectedDriver || !startDate || !endDate) return;
    setSubmitting(true);
    try {
      const payload = {
        startDate: formatDateToSpanish(startDate),
        endDate: formatDateToSpanish(endDate)
      };
      const res = await api.post(`/documents/work-certificate/${selectedDriver.id}`, payload, { responseType: 'blob' as any });
      const dispo = (res as any)?.headers?.['content-disposition'] || (res as any)?.headers?.['Content-Disposition'];
      let filename = 'work-certificate.pdf';
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
      success('Certificado laboral generado');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'No se pudo generar el certificado';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxWidth={900} mx="auto" p={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <DescriptionIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
          Certificado Laboral
        </Typography>
      </Box>
      <Box sx={{ height: 3, width: 220, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Conductor
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Autocomplete
                  options={driverIdOptions}
                  getOptionLabel={(option) => option.identification ? formatNumber(option.identification) : ''}
                  value={selectedDriver}
                  onChange={(_event, newValue) => handleDriverSelection(newValue)}
                  inputValue={driverIdQuery}
                  onInputChange={(_event, newInputValue) => setDriverIdQuery(newInputValue)}
                  loading={driverIdLoading}
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
                            {driverIdLoading ? <CircularProgress color="inherit" size={16} /> : null}
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
                  options={driverNameOptions}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                  value={selectedDriver}
                  onChange={(_event, newValue) => handleDriverSelection(newValue)}
                  inputValue={driverNameQuery}
                  onInputChange={(_event, newInputValue) => setDriverNameQuery(newInputValue)}
                  loading={driverNameLoading}
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
                            {driverNameLoading ? <CircularProgress color="inherit" size={16} /> : null}
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
              Período Laboral
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <DatePicker
                  label="Fecha inicial"
                  value={startDate}
                  onChange={(v) => setStartDate(v)}
                  format="YYYY-MM-DD"
                  disabled={disabledAll}
                  slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <DatePicker
                  label="Fecha final"
                  value={endDate}
                  onChange={(v) => setEndDate(v)}
                  format="YYYY-MM-DD"
                  disabled={disabledAll}
                  slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }}
                />
              </Box>
            </Stack>

            <Box display="flex" gap={1}>
              <Button variant="contained" onClick={onGenerate} disabled={!canSubmit || disabledAll}>
                {submitting ? 'Generando...' : 'GENERAR CERTIFICADO'}
              </Button>
              <Button
                variant="outlined"
                disabled={disabledAll}
                onClick={resetAll}
              >
                LIMPIAR
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
