import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Alert,
  IconButton,
  TextField,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  InputAdornment,
} from '@mui/material';
import { Print as PrintIcon, Edit as EditIcon, Warning as WarningIcon, Search as SearchIcon, Info as InfoIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../services/http';
import { useNotify } from '../services/notify';
import ControlCardEditModal from '../components/modals/ControlCardEditModal';


const formatNumber = (value: string): string => {
  if (!value) return '';
  const numberValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
  if (isNaN(numberValue)) return '';
  return numberValue.toLocaleString('es-CO');
};

const unformatNumber = (value: string): string => {
  if (!value) return '';
  return value.replace(/[^0-9]/g, '');
};

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

interface Person {
  id: number;
  identification: string;
  firstName: string;
  lastName: string;
  name: string;
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

interface ExpiredDocument {
  name: string;
  date: string;
  daysExpired: number;
}

interface VehicleStateHistory {
  id: number;
  vehicleId: number;
  previousState: number;
  newState: number;
  reason: string;
  createdAt: string;
  vehicle: {
    id: number;
    plate: string;
  };
}

interface VehicleStateHistoryResponse {
  vehicleId: number;
  vehiclePlate: string;
  currentState: number;
  totalChanges: number;
  history: VehicleStateHistory[];
}

export default function PrintControlCard(): JSX.Element {
  const { error, success } = useNotify();
  const [selectedDriverId, setSelectedDriverId] = useState<number>(0);

  // Person search state
  const [idQuery, setIdQuery] = useState('');
  const [idOptions, setIdOptions] = useState<Person[]>([]);
  const [idLoading, setIdLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Person | null>(null);
  const [printConfirmOpen, setPrintConfirmOpen] = useState(false);
  const [itemToPrint, setItemToPrint] = useState<DriverVehicleRes | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedControlCard, setSelectedControlCard] = useState<DriverVehicleRes | null>(null);

  // Vehicle state history modal
  const [stateHistoryOpen, setStateHistoryOpen] = useState(false);
  const [stateHistoryData, setStateHistoryData] = useState<VehicleStateHistoryResponse | null>(null);
  const [loadingStateHistory, setLoadingStateHistory] = useState(false);

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedControlCard(null);
  };

  const handleShowStateHistory = async (vehicleId: number) => {
    setLoadingStateHistory(true);
    setStateHistoryOpen(true);
    try {
      const res = await api.get<VehicleStateHistoryResponse>(`/vehicles/${vehicleId}/state-history`);
      setStateHistoryData(res.data);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error al obtener el historial de estado';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
      setStateHistoryOpen(false);
    } finally {
      setLoadingStateHistory(false);
    }
  };

  const handleCloseStateHistory = () => {
    setStateHistoryOpen(false);
    setStateHistoryData(null);
  };

  const handlePrintClick = (item: DriverVehicleRes) => {
    setItemToPrint(item);
    setPrintConfirmOpen(true);
  };
  const handlePrintConfirm = () => {
    if (itemToPrint) {
      const dvId = itemToPrint?.id ? String(itemToPrint.id) : '';
      const params = new URLSearchParams();
      if (dvId) params.set('dvId', dvId);
      const base = (typeof window !== 'undefined' ? window.location.origin : '') || '';
      const url = `${base}/absolute-print${params.toString() ? `?${params.toString()}` : ''}`;
      try {
        window.open(url, '_blank', 'noopener,noreferrer,width=1200,height=700');
      } catch { }
    }
    setPrintConfirmOpen(false);
    setItemToPrint(null);
  };
  const handlePrintCancel = () => {
    setPrintConfirmOpen(false);
    setItemToPrint(null);
  };

  const handleEditSuccess = async () => {
    // Refresh the results after successful edit by refetching data
    if (!selectedDriverId && !selectedVehicleId) return;

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

  const handlePersonSelection = (person: Person | null) => {
    setSelectedDriver(person);
    if (person) {
      setSelectedDriverId(person.id);
      setIdQuery(formatNumber(person.identification));
      // Clear options after selection to clean up the UI
      setIdOptions([]);
    } else {
      setSelectedDriverId(0);
      setIdQuery('');
      setIdOptions([]);
    }
  };

  const handleSearchDriver = async () => {
    console.log('handleSearchDriver');
    const q = unformatNumber(idQuery).trim();
    if (!q) {
      console.log('Ingrese una identificación para buscar');
      return;
    }

    setIdLoading(true);
    try {
      const res = await api.get<Person[]>('/drivers', { params: { identification: q } });
      const data = (Array.isArray(res.data) ? res.data : []).map(p => ({ ...p, name: `${p.firstName} ${p.lastName}`.trim() }));

      if (data.length === 0) {
        error('No se encontraron conductores con esa identificación');
        setIdOptions([]);
      } else if (data.length === 1) {
        // Auto-select if only one result
        const driver = data[0];
        handlePersonSelection(driver);
        setIdOptions(data);
        
        // Fetch driver-vehicles data
        setLoadingResults(true);
        try {
          const dvRes = await api.get<DriverVehicleRes[]>(`/driver-vehicles/by-driver/${driver.id}`);
          const dvData = Array.isArray(dvRes.data) ? dvRes.data : [];
          setResults(dvData);
        } catch (e: any) {
          const msg = e?.response?.data?.message || 'No se pudo obtener la información';
          error(Array.isArray(msg) ? msg.join('\n') : String(msg));
        } finally {
          setLoadingResults(false);
        }
      } else {
        // Multiple results
        setIdOptions(data);
        success(`Se encontraron ${data.length} conductores`);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error buscando conductor';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
      setIdOptions([]);
    } finally {
      setIdLoading(false);
    }
  };


  // Vehicle autocomplete state
  const [plateQuery, setPlateQuery] = useState('');
  const [plateOptions, setPlateOptions] = useState<string[]>([]);
  const [plateResults, setPlateResults] = useState<VehicleLite[]>([]);
  const [plateLoading, setPlateLoading] = useState(false);
  const [plate, setPlate] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const handlePlateChange = (newValue: string | null) => {
    const val = (newValue || '').toUpperCase();
    const found = plateResults.find((v) => String(v?.plate).trim().toUpperCase() === val.trim());
    setPlate(val);
    setSelectedVehicleId(found ? found.id : null);
  };

  const handlePlateInputChange = (newInput: string, reason: string) => {
    const next = (newInput || '').toUpperCase();
    setPlateQuery(next);
    if (reason === 'input') {
      setPlate(next);
      setSelectedVehicleId(null);
    }
  };

  const handlePlateBlur = () => {
    const found = plateResults.find((v) => String(v?.plate).trim().toUpperCase() === plateQuery.trim());
    if (found) {
      setPlate(found.plate);
      setSelectedVehicleId(found.id);
    }
  };

  // Results state
  const [loadingResults, setLoadingResults] = useState(false);
  const [results, setResults] = useState<DriverVehicleRes[]>([]);

  // Function to check for expired documents
  const getExpiredDocuments = (item: DriverVehicleRes): ExpiredDocument[] => {
    const today = dayjs();
    const expired: ExpiredDocument[] = [];

    const checkDate = (date: string | null | undefined, name: string) => {
      if (date) {
        const expDate = dayjs(String(date).slice(0, 10));
        if (expDate.isBefore(today, 'day')) {
          expired.push({
            name,
            date: expDate.format('YYYY-MM-DD'),
            daysExpired: today.diff(expDate, 'day')
          });
        }
      }
    };

    // Check vehicle state - if state is 0, vehicle is inactive
    if (item.vehicle && item.vehicle.state === 0) {
      expired.push({
        name: 'Vehículo',
        date: 'Inactivo',
        daysExpired: 0
      });
    }

    // Check vehicle policy status - if state is 0, policy is inactive
    if (item.vehicle?.police && item.vehicle.police.state === 0) {
      expired.push({
        name: 'Póliza del vehículo',
        date: 'Inactiva',
        daysExpired: 0
      });
    }

    // Check driver license expiration
    if (item.driver?.expiresOn) {
      checkDate(item.driver.expiresOn, 'Licencia de conducir');
    }

    // Check all document expiration dates
    checkDate(item.permitExpiresOn, 'Permiso');
    checkDate(item.technicalMechanicExpires, 'Tecnomecánica');
    checkDate(item.extraContractualExpires, 'Extracontractual');
    checkDate(item.contractualExpires, 'Contractual');
    checkDate(item.operationCardExpires, 'Tarjeta de operación');
    checkDate(item.soatExpires, 'SOAT');

    return expired.sort((a, b) => b.daysExpired - a.daysExpired);
  };


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
    console.log('selectedDriverId', selectedDriverId);
    console.log('selectedVehicleId', selectedVehicleId);
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

  const handleSearchVehicle = async () => {
    const q = plateQuery.trim().toUpperCase();
    if (!q) {
      console.log('Ingrese una placa para buscar');
      return;
    }
    setPlateLoading(true);
    try {
      const res = await api.get<any[]>('/vehicles', { params: { plate: q } });
      const data = Array.isArray(res.data) ? res.data : [];
      if (data.length === 1) {
        const vehicle = data[0];
        setPlate(String(vehicle?.plate || '').toUpperCase());
        setSelectedVehicleId(Number(vehicle?.id || 0));
        success(`Vehículo encontrado: ${vehicle?.plate} - ${vehicle?.model}`);
      } else if (data.length > 1) {
        // Multiple vehicles found
        success(`Se encontraron ${data.length} vehículos`);
      } else {
        error('No se encontró ningún vehículo con esa placa');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'No se pudo obtener la información';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setPlateLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 print:hidden">Imprimir tarjeta control</h1>

      <Card className="print:hidden">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Buscar Identificación"
                  size="small"
                  fullWidth
                  required
                  value={idQuery}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '');
                    setIdQuery(digitsOnly);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchDriver();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleSearchDriver}
                          disabled={!idQuery.trim() || idLoading}
                          size="small"
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  disabled={false}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Placa"
                  size="small"
                  fullWidth
                  required
                  value={plateQuery}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setPlateQuery(val);
                    setPlate(val);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchVehicle();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleSearchVehicle}
                          disabled={!plateQuery.trim() || plateLoading}
                          size="small"
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
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
            const fmt = (s?: string | null) => s ? dayjs(String(s).slice(0, 10)).format('YYYY-MM-DD') : '';
            const expiredDocs = getExpiredDocuments(item);

            return (
              <Card key={item.id} className="relative print:break-inside-avoid">
                <CardContent>
                  <Box className="!absolute top-2 right-2 flex gap-1">
                    {/* Edit button - always available */}
                    <IconButton
                      size="small"
                      aria-label="Editar tarjeta"
                      title="Editar tarjeta"
                      onClick={() => {
                        setSelectedControlCard(item);
                        setEditModalOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" color="primary" />
                    </IconButton>

                    {/* Print button - only available when no expired documents */}
                    {expiredDocs.length === 0 && (
                      <IconButton
                        size="small"
                        aria-label="Imprimir tarjeta"
                        title="Imprimir tarjeta"
                        onClick={() => handlePrintClick(item)}
                      >
                        <PrintIcon fontSize="small" color="primary" />
                      </IconButton>
                    )}
                  </Box>

                  <Stack spacing={1}>
                    {/* Expired Documents Alert */}
                    {expiredDocs.length > 0 && (
                      <Alert
                        severity="error"
                        icon={<WarningIcon fontSize="inherit" />}
                        style={{ marginTop: '30px', marginBottom: '10px' }}
                      >
                        <Typography variant="body2" fontWeight={600}>Documentos vencidos:</Typography>
                        {expiredDocs.map((doc, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              - {doc.name}: {doc.date}{doc.daysExpired > 0 ? ` (${doc.daysExpired} días vencido${doc.daysExpired !== 1 ? 's' : ''})` : ''}
                            </Typography>
                            {doc.name === 'Vehículo' && doc.date === 'Inactivo' && v.id && (
                              <IconButton
                                size="small"
                                onClick={() => handleShowStateHistory(v.id)}
                                sx={{ padding: 0, ml: 0.5 }}
                                title="Ver historial de estado"
                              >
                                <InfoIcon fontSize="small" color="info" />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                      </Alert>
                    )}

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

      {/* Edit Modal */}
      <ControlCardEditModal
        open={editModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
        controlCardData={selectedControlCard}
      />

      {/* Print Confirmation Dialog */}
      <Dialog
        open={printConfirmOpen}
        onClose={handlePrintCancel}
        aria-labelledby="print-dialog-title"
      >
        <DialogTitle id="print-dialog-title">
          Confirmar Impresión
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea imprimir la tarjeta de control para:
          </Typography>
          {itemToPrint && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Conductor:</strong> {itemToPrint.driver?.firstName} {itemToPrint.driver?.lastName}
              </Typography>
              <Typography variant="body2">
                <strong>Identificación:</strong> {formatNumber(itemToPrint.driver?.identification || '')}
              </Typography>
              <Typography variant="body2">
                <strong>Vehículo:</strong> {itemToPrint.vehicle?.plate}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrintCancel} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handlePrintConfirm} variant="contained" color="primary">
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vehicle State History Modal */}
      <Dialog
        open={stateHistoryOpen}
        onClose={handleCloseStateHistory}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Historial de Estado del Vehículo
        </DialogTitle>
        <DialogContent>
          {loadingStateHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : stateHistoryData ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="body2">
                  <strong>Vehículo:</strong> {stateHistoryData.vehiclePlate}
                </Typography>
                <Typography variant="body2">
                  <strong>Estado actual:</strong>{' '}
                  <Chip
                    label={stateHistoryData.currentState === 1 ? 'Activo' : 'Inactivo'}
                    color={stateHistoryData.currentState === 1 ? 'success' : 'error'}
                    size="small"
                  />
                </Typography>
                <Typography variant="body2">
                  <strong>Total de cambios:</strong> {stateHistoryData.totalChanges}
                </Typography>
              </Box>

              <Typography variant="subtitle2" fontWeight={600}>
                Historial de cambios:
              </Typography>

              {stateHistoryData.history.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No hay historial de cambios disponible.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {stateHistoryData.history.map((record) => (
                    <Card key={record.id} variant="outlined">
                      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        <Stack spacing={0.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={record.previousState === 1 ? 'Activo' : 'Inactivo'}
                              color={record.previousState === 1 ? 'success' : 'error'}
                              size="small"
                            />
                            <Typography variant="body2">→</Typography>
                            <Chip
                              label={record.newState === 1 ? 'Activo' : 'Inactivo'}
                              color={record.newState === 1 ? 'success' : 'error'}
                              size="small"
                            />
                          </Box>
                          <Typography variant="body2">
                            <strong>Razón:</strong> {record.reason}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(record.createdAt).format('DD/MM/YYYY HH:mm')}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStateHistory} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}