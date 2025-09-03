import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  MenuItem,
  Select,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BusinessIcon from '@mui/icons-material/Business';
import CellTowerIcon from '@mui/icons-material/CellTower';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import CatalogService, { Option } from '../services/catalog.service';
import api from '../services/http';
import { useNotify } from '../services/notify';

// Subcomponents
type WithDialogSelectorProps = {
  label: string;
  value: number;
  options: Option[];
  onChange: (id: number) => void;
  onCreate: (name: string) => Promise<Option>;
  icon: React.ReactNode;
  addButtonAria: string;
  disabled?: boolean;
};

function WithDialogSelector({ label, value, options, onChange, onCreate, icon, addButtonAria, disabled }: WithDialogSelectorProps) {
  const { warning, error, success } = useNotify();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControl fullWidth size="small" required disabled={disabled}>
          <InputLabel id={`${label}-select-label`}>{label}</InputLabel>
          <Select
            labelId={`${label}-select-label`}
            label={label}
            value={value}
            displayEmpty
            onChange={e => onChange(e.target.value === 0 ? 0 : Number(e.target.value))}
          >
            {options.map((o) => (
              <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title={`Agregar ${label}`}>
          <span>
            <IconButton color="primary" onClick={() => setOpen(true)} disabled={disabled} aria-label={addButtonAria}>
              {icon}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{`Agregar ${label}`}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={`Nombre de la ${label.toLowerCase()}`}
            type="text"
            fullWidth
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const trimmed = name.trim();
              if (!trimmed) { warning('Ingrese un nombre válido'); return; }
              setSaving(true);
              try {
                const created = await onCreate(trimmed);
                onChange(created.id);
                setOpen(false);
                setName('');
                success(`${label} creada`);
              } catch (e: any) {
                const msg = e?.response?.data?.message || `No se pudo crear la ${label.toLowerCase()}`;
                error(Array.isArray(msg) ? msg.join('\n') : String(msg));
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

type WithOwnerDialogSelectorProps = {
  value: number;
  options: Option[];
  onChange: (id: number) => void;
  onCreate: (payload: { name: string; identification: string; phone: string; email?: string; address?: string; }) => Promise<Option>;
  disabled?: boolean;
};

function WithOwnerDialogSelector({ value, options, onChange, onCreate, disabled }: WithOwnerDialogSelectorProps) {
  const { warning, error, success } = useNotify();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // Editable fields
  const [ownerName, setOwnerName] = useState('');
  const [ownerIdentification, setOwnerIdentification] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');

  // Search states
  const [searchIdentification, setSearchIdentification] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundOwners, setFoundOwners] = useState<any[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number>(0);

  // Debounced search by identification and/or name
  useEffect(() => {
    const ident = searchIdentification.trim();
    const name = searchName.trim();
    if (!ident && !name) { setFoundOwners([]); return; }
    const handle = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const params: any = {};
        if (ident) params.identification = ident;
        if (name) params.name = name;
        const res = await api.get<any[]>('/owner', { params });
        const list = Array.isArray(res.data) ? res.data : [];
        setFoundOwners(list);
      } catch (e) {
        setFoundOwners([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchIdentification, searchName]);

  const populateFromOwner = (o: any | null) => {
    if (!o) {
      setSelectedOwnerId(0);
      setOwnerName('');
      setOwnerIdentification('');
      setOwnerEmail('');
      setOwnerAddress('');
      setOwnerPhone('');
      return;
    }
    setSelectedOwnerId(Number(o.id || 0));
    setOwnerName(String(o.name || ''));
    setOwnerIdentification(String(o.identification || ''));
    setOwnerEmail(String(o.email || ''));
    setOwnerAddress(String(o.address || ''));
    setOwnerPhone(String(o.phone || ''));
    // Sync search inputs with selected owner
    setSearchIdentification(String(o.identification || ''));
    setSearchName(String(o.name || ''));
  };

  const resetOwnerModal = () => {
    setSearchIdentification('');
    setSearchName('');
    setFoundOwners([]);
    setSelectedOwnerId(0);
    setOwnerName('');
    setOwnerIdentification('');
    setOwnerEmail('');
    setOwnerAddress('');
    setOwnerPhone('');
  };

  const handleCloseOwnerModal = () => {
    if (saving) return;
    resetOwnerModal();
    setOpen(false);
  };

  // When user types into search fields and there is no selected owner, mirror into payload fields
  useEffect(() => {
    if (selectedOwnerId === 0) {
      setOwnerIdentification(searchIdentification);
    }
  }, [searchIdentification, selectedOwnerId]);
  useEffect(() => {
    if (selectedOwnerId === 0) {
      setOwnerName(searchName);
    }
  }, [searchName, selectedOwnerId]);

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ flex: 1 }}>
          <Autocomplete
            options={options}
            value={options.find(o => o.id === value) || null}
            getOptionLabel={(o) => o?.name ?? ''}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            onChange={(event, newValue) => onChange(newValue ? newValue.id : 0)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Propietario"
                size="small"
                required
                fullWidth
              />
            )}
            disabled={disabled}
          />
        </Box>
        <Tooltip title="Agregar propietario">
          <span>
            <IconButton color="primary" onClick={() => setOpen(true)} disabled={disabled} aria-label="Agregar propietario">
              <PersonAddAlt1Icon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{selectedOwnerId > 0 ? 'Actualizar propietario' : 'Agregar propietario'}</DialogTitle>
        <DialogContent>
          {/* Identification as Autocomplete */}
          <Autocomplete
            options={foundOwners}
            loading={searchLoading}
            value={foundOwners.find(o => o.id === selectedOwnerId) || null}
            getOptionLabel={(o: any) => String(o?.identification || '')}
            isOptionEqualToValue={(opt: any, val: any) => Number(opt.id) === Number(val.id)}
            onChange={(event, newValue: any | null) => {
              populateFromOwner(newValue);
            }}
            inputValue={searchIdentification}
            onInputChange={(e, v) => {
              setSearchIdentification(v);
              if (selectedOwnerId > 0) {
                setSelectedOwnerId(0);
                setOwnerEmail('');
                setOwnerAddress('');
                setOwnerPhone('');
              }
            }}
            filterOptions={(x) => x}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                margin="dense"
                label="Identificación"
                type="text"
                fullWidth
              />
            )}
            disabled={saving}
          />
          <Box sx={{ height: 8 }} />
          {/* Name as Autocomplete */}
          <Autocomplete
            options={foundOwners}
            loading={searchLoading}
            value={foundOwners.find(o => o.id === selectedOwnerId) || null}
            getOptionLabel={(o: any) => String(o?.name || '')}
            isOptionEqualToValue={(opt: any, val: any) => Number(opt.id) === Number(val.id)}
            onChange={(event, newValue: any | null) => {
              populateFromOwner(newValue);
            }}
            inputValue={searchName}
            onInputChange={(e, v) => {
              setSearchName(v);
              if (selectedOwnerId > 0) {
                setSelectedOwnerId(0);
                setOwnerEmail('');
                setOwnerAddress('');
                setOwnerPhone('');
              }
            }}
            filterOptions={(x) => x}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                label="Nombre"
                type="text"
                fullWidth
              />
            )}
            disabled={saving}
          />
          {/* Other editable fields */}
          <TextField margin="dense" label="Correo electrónico" type="email" fullWidth value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} disabled={saving} />
          <TextField margin="dense" label="Dirección" type="text" fullWidth value={ownerAddress} onChange={e => setOwnerAddress(e.target.value)} disabled={saving} />
          <TextField margin="dense" label="Teléfono" type="text" fullWidth value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} disabled={saving} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const name = ownerName.trim();
              const identification = ownerIdentification.trim();
              const email = ownerEmail.trim();
              const address = ownerAddress.trim();
              const phone = ownerPhone.trim();
              if (!name || !identification || !phone) {
                warning('Complete nombre, identificación y teléfono del propietario');
                return;
              }
              setSaving(true);
              try {
                const payload: any = { name, identification, phone };
                if (email) payload.email = email;
                if (address) payload.address = address;
                if (selectedOwnerId > 0) {
                  // Update owner
                  const res = await api.put(`/owner/${selectedOwnerId}`, payload);
                  // Best-effort: update catalogs storage for owners list
                  try {
                    const catalogs = CatalogService.getCatalogsFromStorage();
                    if (catalogs) {
                      const owners = catalogs.owners.map(o => o.id === selectedOwnerId ? { ...o, name } : o);
                      CatalogService.saveCatalogsToStorage({ ...catalogs, owners });
                    }
                  } catch {}
                  onChange(selectedOwnerId);
                  success('Propietario actualizado');
                } else {
                  // Fallback: create if none selected
                  const created = await onCreate(payload);
                  onChange(created.id);
                  success('Propietario creado');
                }
                handleCloseOwnerModal();
              } catch (e: any) {
                const msg = e?.response?.data?.message || (selectedOwnerId > 0 ? 'No se pudo actualizar el propietario' : 'No se pudo crear el propietario');
                error(Array.isArray(msg) ? msg.join('\n') : String(msg));
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            {selectedOwnerId > 0 ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function Vehicles(): JSX.Element {
  const { success, warning, error } = useNotify();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(0);
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [internalNumber, setInternalNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [line, setLine] = useState('');
  const [entryDate, setEntryDate] = useState<Dayjs | null>(null);
  const [makeId, setMakeId] = useState<number>(0);
  const [insurerId, setInsurerId] = useState<number>(0);
  const [communicationCompanyId, setCommunicationCompanyId] = useState<number>(0);
  const [ownerId, setOwnerId] = useState<number>(0);

  const [makes, setMakes] = useState<Option[]>([]);
  const [insurers, setInsurers] = useState<Option[]>([]);
  const [communicationCompanies, setCommunicationCompanies] = useState<Option[]>([]);
  const [owners, setOwners] = useState<Option[]>([]);

  // Dialog states removed; handled inside subcomponents

  const disabledAll = loading || submitting;

  useEffect(() => {
    const loadFromStorage = () => {
      setLoading(true);
      try {
        const catalogs = CatalogService.getCatalogsFromStorage();
        if (!catalogs) {
          console.warn('Catálogos no encontrados en storage. Inicie sesión para precargar.');
          warning('Catálogos no disponibles. Inicia sesión para precargar los catálogos.');
          return;
        }
        setMakes(catalogs.makes);
        setInsurers(catalogs.insurers);
        setCommunicationCompanies(catalogs.communicationCompanies);
        setOwners(catalogs.owners);
      } finally {
        setLoading(false);
      }
    };
    loadFromStorage();
  }, []);

  // Realtime plate suggestions and existing vehicle prefill
  const [plateQuery, setPlateQuery] = useState('');
  const [plateOptions, setPlateOptions] = useState<string[]>([]);
  const [plateResults, setPlateResults] = useState<any[]>([]);
  const [plateLoading, setPlateLoading] = useState(false);
  useEffect(() => {
    const q = plateQuery.trim();
    if (!q) { setPlateOptions([]); return; }
    const handle = setTimeout(async () => {
      setPlateLoading(true);
      try {
        const res = await api.get<any[]>('/vehicles', { params: { plate: q } });
        const data = Array.isArray(res.data) ? res.data : [];
        setPlateResults(data);
        const plates = Array.from(new Set(data.map((v: any) => String(v?.plate || '').trim()).filter(Boolean)));
        setPlateOptions(plates);
      } catch {
        setPlateOptions([]);
      } finally {
        setPlateLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [plateQuery]);

  const canSubmit = useMemo(() => {
    return (
      plate.trim().length > 0 &&
      model.trim().length > 0 &&
      internalNumber.trim().length > 0 &&
      makeId > 0 &&
      insurerId > 0 &&
      communicationCompanyId > 0 &&
      ownerId > 0
    );
  }, [plate, model, internalNumber, makeId, insurerId, communicationCompanyId, ownerId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const companyIdStr = localStorage.getItem('companyId');
      const companyId = companyIdStr ? Number(companyIdStr) : undefined;
      const payload: any = {
        plate: plate.trim(),
        model: model.trim(),
        makeId,
      };
      payload.internalNumber = internalNumber.trim();
      if (mobileNumber.trim()) payload.mobileNumber = mobileNumber.trim();
      payload.insurerId = insurerId;
      payload.communicationCompanyId = communicationCompanyId;
      payload.ownerId = ownerId;
      if (engineNumber.trim()) payload.engineNumber = engineNumber.trim();
      if (chassisNumber.trim()) payload.chassisNumber = chassisNumber.trim();
      if (line.trim()) payload.line = line.trim();
      if (entryDate) payload.entryDate = entryDate.format('YYYY-MM-DD');
      if (companyId) payload.companyId = companyId;

      let res;
      if (selectedVehicleId > 0) {
        res = await api.put(`/vehicles/${selectedVehicleId}`, payload);
        success('Vehículo actualizado con éxito (ID ' + (res.data?.id ?? selectedVehicleId) + ').');
      } else {
        res = await api.post('/vehicles', payload);
        success('Vehículo creado con éxito (ID ' + res.data?.id + ').');
        // Reset solo en creación
        setPlate('');
        setModel('');
        setInternalNumber('');
        setMobileNumber('');
        setEngineNumber('');
        setChassisNumber('');
        setLine('');
        setEntryDate(null);
        setMakeId(0);
        setInsurerId(0);
        setCommunicationCompanyId(0);
        setOwnerId(0);
        setSelectedVehicleId(0);
      }
    } catch (e: any) {
      console.error('Error creating vehicle', e);
      const msg = e?.response?.data?.message || 'Error creando vehículo';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxWidth={900} mx="auto" p={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <DirectionsCarIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
          Vehículos
        </Typography>
      </Box>
      <Box sx={{ height: 3, width: 170, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />
      <Card>
        <CardContent>
          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Autocomplete
                    options={plateOptions}
                    value={plate || null}
                    onChange={(event, newValue) => {
                      const val = (newValue || '').toString().toUpperCase();
                      setPlate(val);
                      setPlateQuery(val);
                      if (val) {
                        const found = plateResults.find((v) => String(v?.plate).trim().toUpperCase() === val.trim());
                        if (found) {
                          setModel(String(found?.model || ''));
                          setInternalNumber(String(found?.internalNumber || ''));
                          setMobileNumber(String(found?.mobileNumber || ''));
                          setEngineNumber(String((found as any)?.engineNumber || ''));
                          setChassisNumber(String((found as any)?.chassisNumber || ''));
                          setLine(String((found as any)?.line || ''));
                          const ed = (found as any)?.entryDate ? dayjs(String((found as any).entryDate)) : null;
                          setEntryDate(ed && ed.isValid() ? ed : null);
                          // Map nested objects from API response
                          const nextMakeId = Number(found?.make?.id || 0);
                          const nextInsurerId = Number(found?.insurer?.id || 0);
                          const nextCommId = Number(found?.communicationCompany?.id || 0);
                          const nextOwnerId = Number(found?.owner?.id || 0);

                          setMakeId(nextMakeId);
                          setInsurerId(nextInsurerId);
                          setCommunicationCompanyId(nextCommId);
                          setOwnerId(nextOwnerId);

                          // Ensure option lists include the selected entities so UI shows labels
                          if (nextMakeId > 0 && found?.make?.name && !makes.some(m => m.id === nextMakeId)) {
                            setMakes(prev => [...prev, { id: nextMakeId, name: String(found.make.name) }]);
                          }
                          if (nextInsurerId > 0 && found?.insurer?.name && !insurers.some(i => i.id === nextInsurerId)) {
                            setInsurers(prev => [...prev, { id: nextInsurerId, name: String(found.insurer.name) }]);
                          }
                          if (nextCommId > 0 && found?.communicationCompany?.name && !communicationCompanies.some(c => c.id === nextCommId)) {
                            setCommunicationCompanies(prev => [...prev, { id: nextCommId, name: String(found.communicationCompany.name) }]);
                          }
                          if (nextOwnerId > 0 && found?.owner?.name && !owners.some(o => o.id === nextOwnerId)) {
                            setOwners(prev => [...prev, { id: nextOwnerId, name: String(found.owner.name) }]);
                          }
                          setSelectedVehicleId(Number(found?.id || 0));
                        } else {
                          setSelectedVehicleId(0);
                        }
                      }
                    }}
                    inputValue={plateQuery}
                    onInputChange={(e, newInput) => {
                      const next = (newInput || '').toUpperCase();
                      setPlateQuery(next);
                      setPlate(next);
                      setSelectedVehicleId(0);
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
                        required
                        disabled={loading || submitting}
                      />
                    )}
                    disabled={loading || submitting}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Modelo"
                    size="small"
                    fullWidth
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    required
                    disabled={loading || submitting}
                  />
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Número Interno"
                    size="small"
                    fullWidth
                    value={internalNumber}
                    onChange={e => setInternalNumber(e.target.value)}
                    disabled={loading || submitting}
                    required
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Número Móvil"
                    size="small"
                    fullWidth
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    disabled={loading || submitting}
                  />
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Número Motor"
                    size="small"
                    fullWidth
                    value={engineNumber}
                    onChange={e => setEngineNumber(e.target.value)}
                    disabled={loading || submitting}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Número Chasis"
                    size="small"
                    fullWidth
                    value={chassisNumber}
                    onChange={e => setChassisNumber(e.target.value)}
                    disabled={loading || submitting}
                  />
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Línea"
                    size="small"
                    fullWidth
                    value={line}
                    onChange={e => setLine(e.target.value)}
                    disabled={loading || submitting}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <DatePicker
                    label="Fecha de ingreso"
                    value={entryDate}
                    onChange={(v) => setEntryDate(v)}
                    format="YYYY-MM-DD"
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    disabled={loading || submitting}
                  />
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <WithDialogSelector
                    label="Marca"
                    value={makeId}
                    options={makes}
                    onChange={(id) => setMakeId(id)}
                    onCreate={async (name) => { const created = await CatalogService.createMake(name); setMakes(prev => [...prev, created]); return created; }}
                    icon={<DirectionsCarIcon />}
                    addButtonAria="Agregar marca"
                    disabled={disabledAll}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <WithDialogSelector
                    label="Aseguradora"
                    value={insurerId}
                    options={insurers}
                    onChange={(id) => setInsurerId(id)}
                    onCreate={async (name) => { const created = await CatalogService.createInsurer(name); setInsurers(prev => [...prev, created]); return created; }}
                    icon={<BusinessIcon />}
                    addButtonAria="Agregar aseguradora"
                    disabled={disabledAll}
                  />
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <WithDialogSelector
                    label="Compañía de comunicación"
                    value={communicationCompanyId}
                    options={communicationCompanies}
                    onChange={(id) => setCommunicationCompanyId(id)}
                    onCreate={async (name) => { const created = await CatalogService.createCommunicationCompany(name); setCommunicationCompanies(prev => [...prev, created]); return created; }}
                    icon={<CellTowerIcon />}
                    addButtonAria="Agregar compañía de comunicación"
                    disabled={disabledAll}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <WithOwnerDialogSelector
                    value={ownerId}
                    options={owners}
                    onChange={(id) => setOwnerId(id)}
                    onCreate={async (payload) => { const created = await CatalogService.createOwner(payload); setOwners(prev => [...prev, created]); return created; }}
                    disabled={disabledAll}
                  />
                </Box>
              </Stack>

              <Box display="flex" gap={1}>
                <Button type="submit" variant="contained" disabled={!canSubmit || loading || submitting}>
                  {submitting ? (selectedVehicleId > 0 ? 'Actualizando...' : 'Guardando...') : (selectedVehicleId > 0 ? 'Actualizar' : 'Guardar')}
                </Button>
                <Button type="button" variant="outlined" disabled={loading || submitting}
                  onClick={() => {
                    setPlate(''); setModel(''); setInternalNumber(''); setMobileNumber(''); setEngineNumber(''); setChassisNumber(''); setLine(''); setEntryDate(null);
                    setMakeId(0);
                    setInsurerId(0);
                    setCommunicationCompanyId(0);
                    setOwnerId(0);
                    setSelectedVehicleId(0);
                  }}
                >
                  Limpiar
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    {/* Diálogos integrados en subcomponentes */}
    </Box>
  );
}
