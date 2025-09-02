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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import AccountCircle from '@mui/icons-material/AccountCircle';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CatalogService, { Option } from '../services/catalog.service';
import UploadService from '../services/upload.service';
import api from '../services/http';
import { useNotify } from '../services/notify';

// Constants
const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const CATEGORIES = ['C1', 'C2', 'C3'];

// Subcomponents
type PhotoUploaderProps = {
  photo: string;
  photoFilename: string;
  disabled: boolean;
  onChange: (url: string, filename: string) => void;
};

function PhotoUploader({ photo, photoFilename, disabled, onChange }: PhotoUploaderProps) {
  const { success, error } = useNotify();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (f: File) => {
    setUploading(true);
    try {
      const res = await UploadService.uploadFile(f);
      onChange(res.url, res.filename);
      success('Foto subida');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'No se pudo subir la foto';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    const filename = photoFilename || (photo ? photo.split('/').pop() || '' : '');
    if (!filename) { onChange('', ''); return; }
    setUploading(true);
    try {
      await UploadService.deleteFile(filename);
      onChange('', '');
      success('Foto eliminada');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'No se pudo eliminar la foto';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center">
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
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
        <Box sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 'calc(100% + 10px)', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Tooltip title="Seleccionar foto">
            <span>
              <IconButton
                color="primary"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
                aria-label="Seleccionar foto"
              >
                <PhotoCamera fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {photo && (
            <Tooltip title="Eliminar foto">
              <span>
                <IconButton
                  color="error"
                  size="small"
                  onClick={handleDelete}
                  disabled={disabled || uploading}
                  sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
                  aria-label="Eliminar foto"
                >
                  <DeleteForeverIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
          if (!f) return;
          await handleUpload(f);
          if (e.currentTarget) e.currentTarget.value = '';
        }}
      />
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

type VehicleSelectProps = {
  vehicles: Option[];
  valueId: number;
  onChange: (id: number) => void;
  disabled?: boolean;
};

// Vehicle selection removed

export default function Drivers(): JSX.Element {
  const { success, warning, error } = useNotify();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<number>(0);

  // Form fields
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

  // Dialog states removed; handled inside WithDialogSelector

  // Local helpers
  const disabledAll = loading || submitting;
  

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Load EPS/ARL from storage if available
        const catalogs = CatalogService.getCatalogsFromStorage();
        if (!catalogs) {
          warning('Catálogos no disponibles. Inicia sesión para precargar los catálogos.');
        } else {
          setEpsList(catalogs.eps || []);
          setArlList(catalogs.arls || []);
        }
        // Vehicles no longer required
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

  const canSubmit = useMemo(() => {
    return (
      identification.trim().length > 0 &&
      issuedIn.trim().length > 0 &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      phone.trim().length > 0 &&
      address.trim().length > 0 &&
      license.trim().length > 0 &&
      category.trim().length > 0 &&
      !!expiresOn &&
      bloodType.trim().length > 0 &&
      photo.trim().length > 0 &&
      epsId > 0 &&
      arlId > 0
    );
  }, [identification, issuedIn, firstName, lastName, phone, address, license, category, expiresOn, bloodType, photo, epsId, arlId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        identification: identification.trim(),
        issuedIn: issuedIn.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        license: license.trim(),
        category: category.trim(),
        // Format as YYYY-MM-DD for backend
        expiresOn: expiresOn ? expiresOn.format('YYYY-MM-DD') : '',
        bloodType: bloodType.trim(),
        photo: photo.trim(),
        epsId,
        arlId,
      };
      let res;
      if (selectedDriverId > 0) {
        res = await api.put(`/drivers/${selectedDriverId}`, payload);
        success('Conductor actualizado con éxito (ID ' + (res.data?.id ?? selectedDriverId) + ').');
      } else {
        res = await api.post('/drivers', payload);
        success('Conductor creado con éxito (ID ' + res.data?.id + ').');
        // Reset solo cuando es creación
        setIdentification('');
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
        setSelectedDriverId(0);
      }
    } catch (e: any) {
      console.error('Error creating driver', e);
      const msg = e?.response?.data?.message || 'Error creando conductor';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  // Realtime identification suggestions for Identificación
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
        // Silent fail for suggestions
        setIdOptions([]);
      } finally {
        setIdLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [idQuery]);

  return (
    <Box maxWidth={900} mx="auto" p={1}>
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <PersonAddAlt1Icon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
            Conductores
          </Typography>
        </Box>
        <Box sx={{ height: 3, width: 170, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />
      </>
      <Card>
        <CardContent>
          <Box component="form" onSubmit={onSubmit}>
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
                          // expiresOn expects Dayjs | null, backend likely returns date string
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
                      // si el usuario cambia el texto, olvidar selección previa
                      setSelectedDriverId(0);
                    }}
                    loading={idLoading}
                    freeSolo
                    disablePortal
                    filterOptions={(x) => x} // do not client-filter; server provides
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Identificación"
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
                    label="De"
                    size="small"
                    fullWidth
                    value={issuedIn}
                    onChange={e => setIssuedIn(e.target.value)}
                    required
                    disabled={loading || submitting}
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
                    disabled={loading || submitting}
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
                    disabled={loading || submitting}
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
                    disabled={loading || submitting}
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
                    disabled={loading || submitting}
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
                    disabled={loading || submitting}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth size="small" disabled={disabledAll} required>
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
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          required: true,
                          disabled: disabledAll,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth size="small" disabled={disabledAll} required>
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
                  />
                </Box>
              </Stack>

              <Box display="flex" gap={1}>
                <Button type="submit" variant="contained" disabled={!canSubmit || loading || submitting}>
                  {submitting ? (selectedDriverId > 0 ? 'Actualizando...' : 'Guardando...') : (selectedDriverId > 0 ? 'Actualizar' : 'Guardar')}
                </Button>
                <Button type="button" variant="outlined" disabled={loading || submitting}
                  onClick={() => {
                    setIdentification(''); setIssuedIn(''); setFirstName(''); setLastName('');
                    setPhone(''); setAddress(''); setLicense(''); setCategory(''); setExpiresOn(null); setBloodType('');
                    setPhoto(''); setPhotoFilename(''); setEpsId(0); setArlId(0); setSelectedDriverId(0);
                  }}
                >
                  Limpiar
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Diálogos de EPS/ARL han sido integrados en WithDialogSelector */}
    </Box>
  );
}
