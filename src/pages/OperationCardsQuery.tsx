import React, { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Box, Button, Card, CardContent, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { DatePicker } from '@mui/x-date-pickers';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import api from '../services/http';
import { useNotify } from '../services/notify';
import { useDrivers } from '../hooks/useDrivers';
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

interface Vehicle {
  id: number;
  plate: string;
  model: string;
  color: string;
  capacity: number;
  company: {
    id: number;
    name: string;
    nit: string;
  };
}

interface DriverVehicleHistory {
  id: number;
  originalRecordId: number;
  permitExpiresOn: string;
  note: string;
  soat: string;
  soatExpires: string;
  operationCard: string;
  operationCardExpires: string;
  contractualExpires: string;
  extraContractualExpires: string;
  technicalMechanicExpires: string;
  originalCreatedAt: string;
  originalUpdatedAt: string;
  actionType: string;
  changedBy: string;
  historyCreatedAt: string;
  driver: Driver;
  vehicle: Vehicle;
}

const OperationCardsQuery: React.FC = () => {
  const { success, error } = useNotify();
  const [mode, setMode] = useState<'date' | 'vehicle' | 'driver' | 'expiration'>('date');

  // Estado común
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<DriverVehicleHistory[]>([]);
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

  // Estado para modo conductor (Autocomplete separado por identificación y nombre)
  const [driverIdQuery, setDriverIdQuery] = useState('');
  const [driverIdOptions, setDriverIdOptions] = useState<Driver[]>([]);
  const [driverIdLoading, setDriverIdLoading] = useState(false);
  const [driverNameQuery, setDriverNameQuery] = useState('');
  const [driverNameOptions, setDriverNameOptions] = useState<Driver[]>([]);
  const [driverNameLoading, setDriverNameLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Estado para modo vencimiento
  const [expirationType, setExpirationType] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<Dayjs | null>(null);

  const resetDriverSearch = () => {
    setDriverIdQuery('');
    setDriverNameQuery('');
    setSelectedDriver(null);
    setDriverIdOptions([]);
    setDriverNameOptions([]);
  };

  const resetExpirationSearch = () => {
    setExpirationType('');
    setExpirationDate(null);
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
    if (mode !== 'vehicle') return;
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

  // Búsqueda por identificación del conductor
  useEffect(() => {
    if (mode !== 'driver') return;
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
  }, [mode, driverIdQuery]);

  // Búsqueda por nombre del conductor
  useEffect(() => {
    if (mode !== 'driver') return;
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
  }, [mode, driverNameQuery]);

  const canSubmit = useMemo(() => {
    if (mode === 'date') return !!startDate && !!endDate;
    if (mode === 'vehicle') return !!selectedVehicleId && selectedVehicleId > 0;
    if (mode === 'driver') return !!selectedDriver && selectedDriver.id > 0;
    if (mode === 'expiration') return !!expirationType && !!expirationDate;
    return false;
  }, [mode, startDate, endDate, selectedVehicleId, selectedDriver, expirationType, expirationDate]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      let res: any;
      if (mode === 'date') {
        if (!startDate || !endDate) return;
        // Convert dates to ISO format with proper time ranges
        const fromDate = startDate.startOf('day').toISOString(); // Start of day (00:00:00.000Z)
        const toDate = endDate.endOf('day').toISOString(); // End of day (23:59:59.999Z)
        const params = {
          fromDate,
          toDate,
        };
        setSearchTitle(`Resultados para el rango de fechas: ${startDate.format('YYYY-MM-DD')} - ${endDate.format('YYYY-MM-DD')}`);
        res = await api.get<DriverVehicleHistory[]>('/driver-vehicles-history', { params });
      } else if (mode === 'vehicle') {
        if (!selectedVehicleId) return;
        setSearchTitle(`Resultados para el vehículo con placa: ${plate}`);
        res = await api.get<DriverVehicleHistory[]>('/driver-vehicles-history', { params: { vehicleId: selectedVehicleId } });
      } else if (mode === 'driver') {
        if (!selectedDriver || !selectedDriver.id) return;
        setSearchTitle(`Resultados para el conductor: ${selectedDriver.firstName} ${selectedDriver.lastName}`);
        res = await api.get<DriverVehicleHistory[]>('/driver-vehicles-history', { params: { driverId: selectedDriver.id } });
      } else if (mode === 'expiration') {
        if (!expirationType || !expirationDate) return;
        const fieldNameMap: { [key: string]: string } = {
          'LICENCIA': 'expires_on',
          'TARJETA CONTROL': 'permit_expires_on',
          'SOAT': 'soat_expires_on',
          'TARJETA OPERACION': 'operation_card_expires_on',
          'CONTRACTUAL': 'contractual_expires_on',
          'EXTRA CONTRACTUAL': 'extra_contractual_expires_on',
          'TECNICOMECANICA': 'technical_mechanic_expires_on'
        };
        const fieldName = fieldNameMap[expirationType];
        const params = {
          expirationDate: expirationDate.format('YYYY-MM-DD'),
          fieldName
        };
        setSearchTitle(`Resultados para vencimientos de ${expirationType} hasta: ${expirationDate.format('YYYY-MM-DD')}`);
        res = await api.get<DriverVehicleHistory[]>('/driver-vehicles/expiring', { params });
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

  const getExpirationLabel = (type: string) => {
    switch (type) {
      case 'LICENCIA': return 'Licencia vence';
      case 'TARJETA CONTROL': return 'Tarjeta de control vence';
      case 'SOAT': return 'SOAT vence';
      case 'TARJETA OPERACION': return 'Tarjeta de operación vence';
      case 'CONTRACTUAL': return 'Contractual vence';
      case 'EXTRA CONTRACTUAL': return 'Extra contractual vence';
      case 'TECNICOMECANICA': return 'Tecnomecánica vence';
      default: return 'Vence';
    }
  };

  const getExpirationValue = (record: any, type: string) => {
    switch (type) {
      case 'LICENCIA': return record.driver?.expiresOn || 'N/A';
      case 'TARJETA CONTROL': return record.permitExpiresOn || 'N/A';
      case 'SOAT': return record.soatExpires || 'N/A';
      case 'TARJETA OPERACION': return record.operationCardExpires || 'N/A';
      case 'CONTRACTUAL': return record.contractualExpires || 'N/A';
      case 'EXTRA CONTRACTUAL': return record.extraContractualExpires || 'N/A';
      case 'TECNICOMECANICA': return record.technicalMechanicExpires || 'N/A';
      default: return 'N/A';
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
    } else if (mode === 'driver') {
      resetDriverSearch();
    } else if (mode === 'expiration') {
      resetExpirationSearch();
    }
  };


  return (
    <Box maxWidth={1000} mx="auto" p={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <CreditCardIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
          Consultar Tarjetas
        </Typography>
      </Box>
      <Box sx={{ height: 3, width: 280, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />

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
              <ToggleButton value="driver">Por conductor</ToggleButton>
              <ToggleButton value="expiration">Por vencimiento</ToggleButton>
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
              ) : mode === 'driver' ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                  <Box sx={{ flex: 1 }}>
                    <Autocomplete
                      options={driverIdOptions}
                      getOptionLabel={(option) => option.identification ? formatNumber(option.identification) : ''}
                      value={selectedDriver}
                      onChange={(_event, newValue) => handleDriverSelection(newValue)}
                      inputValue={driverIdQuery}
                      onInputChange={(_event, newInputValue) => setDriverIdQuery(newInputValue)}
                      loading={driverIdLoading}
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
              ) : mode === 'expiration' ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="expiration-type-label">Tipo de vencimiento</InputLabel>
                      <Select
                        labelId="expiration-type-label"
                        value={expirationType}
                        label="Tipo de vencimiento"
                        onChange={(e) => setExpirationType(e.target.value)}
                        required
                      >
                        <MenuItem value="LICENCIA">LICENCIA</MenuItem>
                        <MenuItem value="TARJETA CONTROL">TARJETA CONTROL</MenuItem>
                        <MenuItem value="SOAT">SOAT</MenuItem>
                        <MenuItem value="TARJETA OPERACION">TARJETA OPERACION</MenuItem>
                        <MenuItem value="CONTRACTUAL">CONTRACTUAL</MenuItem>
                        <MenuItem value="EXTRA CONTRACTUAL">EXTRA CONTRACTUAL</MenuItem>
                        <MenuItem value="TECNICOMECANICA">TECNICOMECANICA</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <DatePicker
                      label="Fecha de vencimiento"
                      value={expirationDate}
                      onChange={(v) => setExpirationDate(v)}
                      format="YYYY-MM-DD"
                      minDate={dayjs()}
                      slotProps={{ 
                        textField: { 
                          size: 'small', 
                          fullWidth: true,
                          required: true
                        } 
                      }}
                    />
                  </Box>
                </Stack>
              ) : null}
            </Stack>

            <Box display="flex" gap={1}>
              <Button variant="contained" disabled={!canSubmit || submitting} onClick={handleSubmit}>
                {submitting ? 'CONSULTANDO...' : 'CONSULTAR'}
              </Button>
              <Button variant="outlined" onClick={handleClear} disabled={submitting}>
                LIMPIAR
              </Button>
            </Box>

            {/* Resultado del historial de conductores y vehículos */}
            <Box>
              {searchTitle && (
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  {searchTitle}
                </Typography>
              )}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Resultados: {items.length > 0 ? items.length : 0} {items.length > 1 ? 'registros' : 'registro'}
              </Typography>
              <Stack spacing={0.5}>
                {items.map((record) => (
                  <Box key={record.id} className="rounded border border-gray-200 px-3 py-2 bg-white">
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flex={1}>
                      <Typography variant="body2"><strong>Identificación:</strong> {formatNumber(record.driver.identification)}</Typography>
                      <Typography variant="body2"><strong>Nombre:</strong> {record.driver.firstName} {record.driver.lastName}</Typography>
                      <Typography variant="body2"><strong>Placa:</strong> {record.vehicle.plate}</Typography>
                      {mode === 'expiration' ? (
                        <Typography variant="body2">
                          <strong>{getExpirationLabel(expirationType)}:</strong> {getExpirationValue(record, expirationType)}
                        </Typography>
                      ) : (
                        <Typography variant="body2"><strong>Permiso vence:</strong> {record.permitExpiresOn}</Typography>
                      )}
                    </Stack>
                    {record.note && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Nota:</strong> {record.note}
                      </Typography>
                    )}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">SOAT: {record.soatExpires}</Typography>
                      <Typography variant="caption" color="text.secondary">Tarjeta Op.: {record.operationCardExpires}</Typography>
                      <Typography variant="caption" color="text.secondary">Contractual: {record.contractualExpires}</Typography>
                      <Typography variant="caption" color="text.secondary">Extra Contractual: {record.extraContractualExpires}</Typography>
                      <Typography variant="caption" color="text.secondary">Tecnomecánica: {record.technicalMechanicExpires}</Typography>
                    </Stack>
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

export default OperationCardsQuery;
