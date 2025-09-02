import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  MenuItem,
  Select,
  TextField,
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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
// import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import AccountCircle from '@mui/icons-material/AccountCircle';
// import PhotoCamera from '@mui/icons-material/PhotoCamera';
// import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CatalogService, { Option } from '../services/catalog.service';
// import UploadService from '../services/upload.service';
import api from '../services/http';
import { useNotify } from '../services/notify';

// Simple accordion section component
function AccordionSection({
  title,
  children,
  isOpen,
  onToggle,
  id,
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <div className="rounded-md bg-white shadow-sm">
      <h3>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={`${id}-content`}
          onClick={onToggle}
          className="flex w-full items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-50"
        >
          <span className="font-medium text-gray-800">{title}</span>
          <span
            className={
              'material-symbols-outlined transition-transform duration-200 ' +
              (isOpen ? 'rotate-180' : '')
            }
            aria-hidden
          >
            expand_more
          </span>
        </button>
      </h3>
      <div
        id={`${id}-content`}
        role="region"
        className={
          'grid transition-[grid-template-rows] duration-200 ease-in-out ' +
          (isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')
        }
      >
        <div className="overflow-hidden">
          <div className="p-3 sm:p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Constants
const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const CATEGORIES = ['C1', 'C2', 'C3'];

// Subcomponents
type PhotoUploaderProps = {
  photo: string;
  photoFilename: string; // kept for compatibility; not used
  disabled: boolean; // kept for compatibility; not used
  onChange: (url: string, filename: string) => void; // kept for compatibility; not used
};

function PhotoUploader({ photo }: PhotoUploaderProps) {
  return (
    <Box display="flex" justifyContent="center">
      {photo ? (
        <Box
          component="img"
          src={photo}
          alt="Foto del conductor"
          sx={{ width: 160, height: 160, objectFit: 'cover', borderRadius: '50%', border: '1px solid #eee' }}
        />
      ) : (
        <AccountCircle sx={{ fontSize: 160, color: 'action.disabled' }} />
      )}
    </Box>
  );
}

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
        <FormControl fullWidth size="small" required disabled={!!disabled}>
          <InputLabel id={`${label}-select-label`}>{label}</InputLabel>
          <Select
            labelId={`${label}-select-label`}
            label={label}
            value={value}
            displayEmpty
            onChange={e => onChange(e.target.value === 0 ? 0 : Number(e.target.value))}
          >
            {options.map(o => (
              <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {!disabled && (
          <Tooltip title={`Agregar ${label}`}>
            <span>
              <IconButton color="primary" onClick={() => setOpen(true)} aria-label={addButtonAria}>
                {icon}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{`Agregar ${label}`}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={`Nombre de la ${label}`}
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
                const msg = e?.response?.data?.message || `No se pudo crear la ${label}`;
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

export default function ControlCard(): JSX.Element {
  // 0: Conductores, 1: Vehículos, 2: Tarjeta de Control
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex((cur) => (cur === idx ? null : idx));
  };

  // Notifications
  const { warning, error, success } = useNotify();

  // Drivers form state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<number>(0);

  const [identification, setIdentification] = useState('');
  const [issuedIn, setIssuedIn] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [license, setLicense] = useState('');
  const [category, setCategory] = useState('');
  const [expiresOn, setExpiresOn] = useState<Dayjs | null>(null);
  const [bloodType, setBloodType] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoFilename, setPhotoFilename] = useState('');
  const [epsId, setEpsId] = useState<number>(0);
  const [arlId, setArlId] = useState<number>(0);

  // Catalog data
  const [epsList, setEpsList] = useState<Option[]>([]);
  const [arlList, setArlList] = useState<Option[]>([]);
  // Vehicle catalog data
  const [makes, setMakes] = useState<Option[]>([]);
  const [insurers, setInsurers] = useState<Option[]>([]);
  const [communicationCompanies, setCommunicationCompanies] = useState<Option[]>([]);
  const [owners, setOwners] = useState<Option[]>([]);

  const disabledAll = loading || submitting;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const catalogs = CatalogService.getCatalogsFromStorage();
        if (!catalogs) {
          warning('Catálogos no disponibles. Inicia sesión para precargar los catálogos.');
        } else {
          setEpsList(catalogs.eps || []);
          setArlList(catalogs.arls || []);
          setMakes(catalogs.makes || []);
          setInsurers(catalogs.insurers || []);
          setCommunicationCompanies(catalogs.communicationCompanies || []);
          setOwners(catalogs.owners || []);
        }
      } catch (e: any) {
        console.error('Error loading initial data', e);
        const msg = e?.response?.data?.message || 'Error cargando datos';
        error(Array.isArray(msg) ? msg.join('\n') : String(msg));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [warning, error]);

  // Se removió envío y validación de formulario

  // Realtime identification suggestions
  const [idQuery, setIdQuery] = useState('');
  const [idOptions, setIdOptions] = useState<string[]>([]);
  const [idResults, setIdResults] = useState<any[]>([]);
  const [idLoading, setIdLoading] = useState(false);
  useEffect(() => {
    const q = idQuery.trim();
    if (!q) { setIdOptions([]); return; }
    const handle = setTimeout(async () => {
      setIdLoading(true);
      try {
        const res = await api.get<any[]>('/drivers', { params: { identification: q } });
        const data = Array.isArray(res.data) ? res.data : [];
        setIdResults(data);
        const ids = Array.from(new Set(data.map((d: any) => String(d?.identification || '').trim()).filter(Boolean)));
        setIdOptions(ids);
      } catch {
        setIdOptions([]);
      } finally {
        setIdLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [idQuery]);

  // Vehicle: state and search by plate (read-only UI except plate autocomplete)
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [internalNumber, setInternalNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [makeId, setMakeId] = useState<number>(0);
  const [insurerId, setInsurerId] = useState<number>(0);
  const [communicationCompanyId, setCommunicationCompanyId] = useState<number>(0);
  const [ownerId, setOwnerId] = useState<number>(0);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(0);

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

  // Control Sheet (driver-vehicle) state
  const [permitExpiresOn, setPermitExpiresOn] = useState<Dayjs | null>(null);
  const [note, setNote] = useState('');
  const [soat, setSoat] = useState('');
  const [soatExpires, setSoatExpires] = useState<Dayjs | null>(null);
  const [operationCard, setOperationCard] = useState('');
  const [operationCardExpires, setOperationCardExpires] = useState<Dayjs | null>(null);
  const [contractualExpires, setContractualExpires] = useState<Dayjs | null>(null);
  const [extraContractualExpires, setExtraContractualExpires] = useState<Dayjs | null>(null);
  const [technicalMechanicExpires, setTechnicalMechanicExpires] = useState<Dayjs | null>(null);

  const saveControlSheet = async () => {
    if (!selectedDriverId || !selectedVehicleId) {
      warning('Seleccione un conductor y un vehículo válidos');
      return;
    }
    const fmt = (d: Dayjs | null) => (d ? d.format('YYYY-MM-DD') : undefined);
    const payload = {
      driverId: selectedDriverId,
      vehicleId: selectedVehicleId,
      permitExpiresOn: fmt(permitExpiresOn),
      note: note || undefined,
      soat: soat || undefined,
      soatExpires: fmt(soatExpires),
      operationCard: operationCard || undefined,
      operationCardExpires: fmt(operationCardExpires),
      contractualExpires: fmt(contractualExpires),
      extraContractualExpires: fmt(extraContractualExpires),
      technicalMechanicExpires: fmt(technicalMechanicExpires),
    } as any;
    setSubmitting(true);
    try {
      await api.post('/driver-vehicles', payload);
      // Success feedback and optional reset
      setNote('');
      setSoat('');
      setOperationCard('');
      success('Tarjeta de control guardada correctamente');

      // Reset Control Card fields
      setPermitExpiresOn(null);
      setSoatExpires(null);
      setOperationCardExpires(null);
      setContractualExpires(null);
      setExtraContractualExpires(null);
      setTechnicalMechanicExpires(null);

      // Reset Driver selection and info
      setSelectedDriverId(0);
      setIdentification('');
      setIdQuery('');
      setIssuedIn('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setAddress('');
      setLicense('');
      setCategory('');
      setExpiresOn(null);
      setBloodType('');
      setPhoto('');
      setEpsId(0);
      setArlId(0);

      // Reset Vehicle selection and info
      setSelectedVehicleId(0);
      setPlate('');
      setPlateQuery('');
      setModel('');
      setInternalNumber('');
      setMobileNumber('');
      setMakeId(0);
      setInsurerId(0);
      setCommunicationCompanyId(0);
      setOwnerId(0);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'No se pudo guardar la tarjeta de control';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Tarjeta de Control</h1>

      <AccordionSection
        id="driver"
        title="Conductor"
        isOpen={openIndex === 0}
        onToggle={() => toggle(0)}
      >
        <Card>
          <CardContent>
            <Box>
              <Stack spacing={2}>
                {/* Foto */}
                <PhotoUploader
                  photo={photo}
                  photoFilename={photoFilename}
                  disabled={disabledAll}
                  onChange={(url, filename) => { setPhoto(url); setPhotoFilename(filename); }}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Autocomplete
                      options={idOptions}
                      value={identification || null}
                      onChange={(event, newValue) => {
                        const val = newValue || '';
                        setIdentification(val);
                        if (val) {
                          const found = idResults.find((d) => String(d?.identification).trim() === val.trim());
                          if (found) {
                            setIssuedIn(String(found?.issuedIn || ''));
                            setFirstName(String(found?.firstName || ''));
                            setLastName(String(found?.lastName || ''));
                            setPhone(String(found?.phone || ''));
                            setAddress(String(found?.address || ''));
                            setLicense(String(found?.license || ''));
                            setCategory(String(found?.category || ''));
                            setBloodType(String(found?.bloodType || ''));
                            try {
                              const dateStr = String(found?.expiresOn || '').slice(0, 10);
                              setExpiresOn(dateStr ? dayjs(dateStr) : null);
                            } catch {
                              setExpiresOn(null);
                            }
                            setPhoto(String(found?.photo || ''));
                            setEpsId(Number(found?.epsId || 0));
                            setArlId(Number(found?.arlId || 0));
                            setSelectedDriverId(Number(found?.id || 0));
                          }
                          else {
                            setSelectedDriverId(0);
                          }
                        }
                      }}
                      inputValue={idQuery}
                      onInputChange={(e, newInput) => {
                        const next = newInput || '';
                        setIdQuery(next);
                        setIdentification(next);
                        setSelectedDriverId(0);
                      }}
                      loading={idLoading}
                      freeSolo
                      disablePortal
                      filterOptions={(x) => x}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Identificación"
                          size="small"
                          fullWidth
                          required
                          disabled={false}
                        />
                      )}
                      disabled={false}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="De"
                      size="small"
                      fullWidth
                      value={issuedIn}
                      onChange={e => setIssuedIn(e.target.value)}
                      required
                      disabled
                    />
                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Nombre"
                      size="small"
                      fullWidth
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                      disabled
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Apellido"
                      size="small"
                      fullWidth
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                      disabled
                    />
                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Teléfono"
                      size="small"
                      fullWidth
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      disabled
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Dirección"
                      size="small"
                      fullWidth
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      required
                      disabled
                    />
                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Licencia"
                      size="small"
                      fullWidth
                      value={license}
                      onChange={e => setLicense(e.target.value)}
                      required
                      disabled
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth size="small" disabled required>
                      <InputLabel id="category-select-label">Categoría</InputLabel>
                      <Select
                        labelId="category-select-label"
                        label="Categoría"
                        value={category}
                        displayEmpty
                        onChange={e => setCategory(String(e.target.value))}
                      >
                        {CATEGORIES.map(cat => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Vence"
                        value={expiresOn}
                        onChange={(newValue) => setExpiresOn(newValue)}
                        format="YYYY-MM-DD"
                        disabled
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            required: true,
                            disabled: true,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth size="small" disabled required>
                      <InputLabel id="bloodtype-select-label">Tipo de sangre</InputLabel>
                      <Select
                        labelId="bloodtype-select-label"
                        label="Tipo de sangre"
                        value={bloodType}
                        displayEmpty
                        onChange={e => setBloodType(String(e.target.value))}
                      >
                        {BLOOD_TYPES.map(bt => (
                          <MenuItem key={bt} value={bt}>{bt}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>

                {/* Fila: EPS y ARL */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <WithDialogSelector
                      label="EPS"
                      value={epsId}
                      options={epsList}
                      onChange={(id) => setEpsId(id)}
                      onCreate={async (name) => {
                        const created = await CatalogService.createEps(name);
                        setEpsList(prev => [...prev, created]);
                        return created;
                      }}
                      icon={<LocalHospitalIcon />}
                      addButtonAria="Agregar EPS"
                      disabled
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <WithDialogSelector
                      label="ARL"
                      value={arlId}
                      options={arlList}
                      onChange={(id) => setArlId(id)}
                      onCreate={async (name) => {
                        const created = await CatalogService.createArl(name);
                        setArlList(prev => [...prev, created]);
                        return created;
                      }}
                      icon={<HealthAndSafetyIcon />}
                      addButtonAria="Agregar ARL"
                      disabled
                    />
                  </Box>
                </Stack>

                {/* Botones de acción removidos */}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </AccordionSection>

      <AccordionSection
        id="vehicle"
        title="Vehículo"
        isOpen={openIndex === 1}
        onToggle={() => toggle(1)}
      >
        <Card>
          <CardContent>
            <Box>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Autocomplete
                      options={plateOptions}
                      value={plate || null}
                      onChange={(event, newValue) => {
                        const val = (newValue || '').toUpperCase();
                        setPlate(val);
                        if (val) {
                          const found = plateResults.find((v) => String(v?.plate).trim().toUpperCase() === val.trim());
                          if (found) {
                            setModel(String(found?.model || ''));
                            setInternalNumber(String(found?.internalNumber || ''));
                            setMobileNumber(String(found?.mobileNumber || ''));
                            setMakeId(Number(found?.make?.id || 0));
                            setInsurerId(Number(found?.insurer?.id || 0));
                            setCommunicationCompanyId(Number(found?.communicationCompany?.id || 0));
                            setOwnerId(Number(found?.owner?.id || 0));
                            setSelectedVehicleId(Number(found?.id || 0));
                          }
                        }
                      }}
                      inputValue={plateQuery}
                      onInputChange={(e, newInput) => {
                        const next = (newInput || '').toUpperCase();
                        setPlateQuery(next);
                        setPlate(next);
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
                        />
                      )}
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
                      disabled
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
                      disabled
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
                      disabled
                      required
                    />
                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth size="small" disabled required>
                      <InputLabel id="make-select-label">Marca</InputLabel>
                      <Select
                        labelId="make-select-label"
                        label="Marca"
                        value={makeId}
                        displayEmpty
                        onChange={e => setMakeId(Number(e.target.value))}
                      >
                        {makes.map(o => (
                          <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth size="small" disabled required>
                      <InputLabel id="insurer-select-label">Aseguradora</InputLabel>
                      <Select
                        labelId="insurer-select-label"
                        label="Aseguradora"
                        value={insurerId}
                        displayEmpty
                        onChange={e => setInsurerId(Number(e.target.value))}
                      >
                        {insurers.map(o => (
                          <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth size="small" disabled required>
                      <InputLabel id="commcompany-select-label">Compañía de comunicación</InputLabel>
                      <Select
                        labelId="commcompany-select-label"
                        label="Compañía de comunicación"
                        value={communicationCompanyId}
                        displayEmpty
                        onChange={e => setCommunicationCompanyId(Number(e.target.value))}
                      >
                        {communicationCompanies.map(o => (
                          <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth size="small" disabled required>
                      <InputLabel id="owner-select-label">Propietario</InputLabel>
                      <Select
                        labelId="owner-select-label"
                        label="Propietario"
                        value={ownerId}
                        displayEmpty
                        onChange={e => setOwnerId(Number(e.target.value))}
                      >
                        {owners.map(o => (
                          <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </AccordionSection>

      <AccordionSection
        id="controlSheet"
        title="Tarjeta de Control"
        isOpen={openIndex === 2}
        onToggle={() => toggle(2)}
      >
        <Card>
          <CardContent>
            <Box>
              <Stack spacing={2}>
                

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Vence"
                        value={permitExpiresOn}
                        onChange={(v) => setPermitExpiresOn(v)}
                        format="YYYY-MM-DD"
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Nota"
                      size="small"
                      fullWidth
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      inputProps={{ maxLength: 500 }}
                    />
                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="SOAT No"
                      size="small"
                      fullWidth
                      value={soat}
                      onChange={e => setSoat(e.target.value)}
                      inputProps={{ maxLength: 60 }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Vence"
                        value={soatExpires}
                        onChange={(v) => setSoatExpires(v)}
                        format="YYYY-MM-DD"
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Tarjeta Operación No"
                      size="small"
                      fullWidth
                      value={operationCard}
                      onChange={e => setOperationCard(e.target.value)}
                      inputProps={{ maxLength: 60 }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Vence"
                        value={operationCardExpires}
                        onChange={(v) => setOperationCardExpires(v)}
                        format="YYYY-MM-DD"
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Contractual vence"
                        value={contractualExpires}
                        onChange={(v) => setContractualExpires(v)}
                        format="YYYY-MM-DD"
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Extracontractual vence"
                        value={extraContractualExpires}
                        onChange={(v) => setExtraContractualExpires(v)}
                        format="YYYY-MM-DD"
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Tecnomecánica vence"
                        value={technicalMechanicExpires}
                        onChange={(v) => setTechnicalMechanicExpires(v)}
                        format="YYYY-MM-DD"
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Box>
                  <Box sx={{ flex: 1 }} />
                </Stack>

                <Stack direction="row" justifyContent="flex-start">
                  <Button
                    variant="contained"
                    onClick={saveControlSheet}
                    disabled={submitting}
                  >
                    Guardar
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </AccordionSection>
    </div>
  );
}
