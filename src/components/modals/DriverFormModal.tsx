import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Stack,
  TextField,
  IconButton,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  Close as CloseIcon,
  LocalHospital as LocalHospitalIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  AccountCircle,
  CameraAlt,
  Image as ImageIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { formatNumber, unformatNumber } from '../../utils/formatting';
import CatalogService, { Option } from '../../services/catalog.service';
import UploadService from '../../services/upload.service';
import api from '../../services/http';
import { useNotify } from '../../services/notify';

// Constants
const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const CATEGORIES = ['C1', 'C2', 'C3'];

export interface Driver {
  id: number;
  identification: string;
  issuedIn: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  license: string;
  category: string;
  expiresOn: string;
  bloodType: string;
  photo: string;
  epsId: number;
  arlId: number;
  state: number;
  eps?: { id: number; name: string };
  arl?: { id: number; name: string };
}

interface DriverFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editDriver?: Driver | null;
}

// Photo uploader component
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
  const [openCam, setOpenCam] = useState(false);
  const [startingCam, setStartingCam] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

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

  const startCamera = async () => {
    setStartingCam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      const msg = e?.message || 'No se pudo acceder a la cámara';
      error(String(msg));
      setOpenCam(false);
    } finally {
      setStartingCam(false);
    }
  };

  const stopCamera = () => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo obtener el contexto del lienzo');
      ctx.drawImage(video, 0, 0, w, h);
      const blob: Blob = await new Promise((resolve) => canvas.toBlob(b => resolve(b as Blob), 'image/jpeg', 0.9));
      const file = new File([blob], `captura_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await handleUpload(file);
      setOpenCam(false);
    } catch (e: any) {
      const msg = e?.message || 'No se pudo capturar la foto';
      error(String(msg));
    } finally {
      stopCamera();
      setCapturing(false);
    }
  };

  React.useEffect(() => {
    if (openCam) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [openCam]);

  return (
    <Box display="flex" justifyContent="center">
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        {photo ? (
          <Box
            component="img"
            src={photo}
            alt="Foto del conductor"
            sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%', border: '1px solid #eee' }}
          />
        ) : (
          <AccountCircle sx={{ fontSize: 120, color: 'action.disabled' }} />
        )}
        <Box sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 'calc(100% + 10px)', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Tooltip title="Tomar foto">
            <span>
              <IconButton
                color="primary"
                size="small"
                onClick={() => { if (!disabled && !uploading) { setOpenCam(true); } }}
                disabled={disabled || uploading}
                sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
                aria-label="Tomar foto"
              >
                <CameraAlt fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Seleccionar foto">
            <span>
              <IconButton
                color="primary"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
              >
                <ImageIcon fontSize="small" />
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
      
      <Dialog
        open={openCam}
        onClose={() => { if (!startingCam && !capturing) { setOpenCam(false); stopCamera(); } }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Tomar foto</DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', width: '100%' }}>
            <video ref={videoRef} style={{ width: '100%', borderRadius: 8 }} playsInline autoPlay muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenCam(false); stopCamera(); }} disabled={startingCam || capturing}>Cerrar</Button>
          <Button variant="contained" onClick={handleCapture} disabled={startingCam || capturing}>
            {capturing ? 'Capturando...' : 'Capturar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Catalog selector component
type WithDialogSelectorProps = {
  label: string;
  value: number;
  options: Option[];
  onChange: (id: number) => void;
  onCreate: (name: string) => Promise<Option>;
  icon: React.ReactNode;
  addButtonAria: string;
  disabled?: boolean;
  onOptionCreated?: (option: Option) => void;
};

function WithDialogSelector({ label, value, options, onChange, onCreate, icon, addButtonAria, disabled, onOptionCreated }: WithDialogSelectorProps) {
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
            value={value || ''}
            displayEmpty
            onChange={e => {
              const val = e.target.value;
              onChange(typeof val === 'number' ? val : Number(val));
            }}
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
                onOptionCreated?.(created);
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

export default function DriverFormModal({ open, onClose, onSuccess, editDriver }: DriverFormModalProps) {
  const { warning, error, success } = useNotify();
  const isEditMode = Boolean(editDriver);

  // Form state
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
  const [epsId, setEpsId] = useState(0);
  const [arlId, setArlId] = useState(0);

  // Options state
  const [epsOptions, setEpsOptions] = useState<Option[]>([]);
  const [arlOptions, setArlOptions] = useState<Option[]>([]);

  // Form control state
  const [submitting, setSubmitting] = useState(false);
  const [disabledAll, setDisabledAll] = useState(false);

  // Load catalog options
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const cached = CatalogService.getCatalogsFromStorage();
        if (cached) {
          setEpsOptions(cached.eps || []);
          setArlOptions(cached.arls || []);
        }

        const catalogs = await CatalogService.fetchCatalogs();
        setEpsOptions(catalogs.eps || []);
        setArlOptions(catalogs.arls || []);
      } catch (e) {
        error('Error cargando catálogos');
      }
    };

    if (open) {
      loadCatalogs();
    }
  }, [open, error]);

  // Initialize form when editing
  useEffect(() => {
    if (open && editDriver) {
      setIdentification(formatNumber(editDriver.identification) || '');
      setIssuedIn(editDriver.issuedIn || '');
      setFirstName(editDriver.firstName || '');
      setLastName(editDriver.lastName || '');
      setPhone(editDriver.phone || '');
      setAddress(editDriver.address || '');
      setLicense(formatNumber(editDriver.license) || '');
      setCategory(editDriver.category || '');
      setExpiresOn(editDriver.expiresOn ? dayjs(editDriver.expiresOn) : null);
      setBloodType(editDriver.bloodType || '');
      setPhoto(editDriver.photo || '');
      setEpsId(editDriver.epsId || 0);
      setArlId(editDriver.arlId || 0);
    }
  }, [open, editDriver]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
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
      setPhotoFilename('');
      setEpsId(0);
      setArlId(0);
      setSubmitting(false);
      setDisabledAll(false);
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    return (
      unformatNumber(identification).trim().length > 0 &&
      issuedIn.trim().length > 0 &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      phone.trim().length > 0 &&
      license.trim().length > 0 &&
      category.trim().length > 0 &&
      !!expiresOn &&
      bloodType.trim().length > 0 &&
      photo.trim().length > 0 &&
      epsId > 0 &&
      arlId > 0
    );
  }, [identification, issuedIn, firstName, lastName, phone, license, category, expiresOn, bloodType, photo, epsId, arlId]);

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setDisabledAll(true);

    try {
      const payload = {
        identification: unformatNumber(identification),
        issuedIn: issuedIn.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        license: unformatNumber(license),
        category: category.trim(),
        expiresOn: expiresOn ? expiresOn.format('YYYY-MM-DD') : '',
        bloodType: bloodType.trim(),
        photo: photo.trim(),
        epsId,
        arlId,
      };

      if (isEditMode && editDriver) {
        await api.put(`/drivers/${editDriver.id}`, payload);
        success('Conductor actualizado exitosamente');
      } else {
        await api.post('/drivers', payload);
        success('Conductor creado exitosamente');
      }

      onSuccess?.();
      handleClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error al guardar el conductor';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
      setDisabledAll(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 1
      }}>
        {isEditMode ? 'Editar Conductor' : 'Nuevo Conductor'}
        <IconButton
          aria-label="cerrar"
          onClick={handleClose}
          sx={{ color: 'grey.500' }}
          disabled={submitting}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            {/* Photo */}
            <PhotoUploader
              photo={photo}
              photoFilename={photoFilename}
              disabled={disabledAll}
              onChange={(url, filename) => { setPhoto(url); setPhotoFilename(filename); }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Identificación"
                  size="small"
                  fullWidth
                  value={identification}
                  onChange={e => setIdentification(formatNumber(e.target.value))}
                  required
                  disabled={disabledAll}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Lugar de Expedición"
                  placeholder="Ej: Sincelejo Cartagene Bogotá"
                  size="small"
                  fullWidth
                  value={issuedIn}
                  onChange={e => setIssuedIn(e.target.value)}
                  required
                  disabled={disabledAll}
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
                  disabled={disabledAll}
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
                  disabled={disabledAll}
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
                  disabled={disabledAll}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Dirección"
                  size="small"
                  fullWidth
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  disabled={disabledAll}
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
                  onChange={e => setLicense(formatNumber(e.target.value))}
                  required
                  disabled={disabledAll}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth size="small" required disabled={disabledAll}>
                  <InputLabel id="category-select-label">Categoría</InputLabel>
                  <Select
                    labelId="category-select-label"
                    label="Categoría"
                    value={category}
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
                <DatePicker
                  label="Fecha de Vencimiento"
                  value={expiresOn}
                  onChange={setExpiresOn}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      required: true,
                      disabled: disabledAll,
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth size="small" required disabled={disabledAll}>
                  <InputLabel id="bloodtype-select-label">Tipo de Sangre</InputLabel>
                  <Select
                    labelId="bloodtype-select-label"
                    label="Tipo de Sangre"
                    value={bloodType}
                    onChange={e => setBloodType(String(e.target.value))}
                  >
                    {BLOOD_TYPES.map(bt => (
                      <MenuItem key={bt} value={bt}>{bt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <WithDialogSelector
                  label="EPS"
                  value={epsId}
                  options={epsOptions}
                  onChange={setEpsId}
                  onCreate={CatalogService.createEps}
                  icon={<LocalHospitalIcon />}
                  addButtonAria="Agregar EPS"
                  disabled={disabledAll}
                  onOptionCreated={(option) => setEpsOptions(prev => [...prev, option])}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <WithDialogSelector
                  label="ARL"
                  value={arlId}
                  options={arlOptions}
                  onChange={setArlId}
                  onCreate={CatalogService.createArl}
                  icon={<HealthAndSafetyIcon />}
                  addButtonAria="Agregar ARL"
                  disabled={disabledAll}
                  onOptionCreated={(option) => setArlOptions(prev => [...prev, option])}
                />
              </Box>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit || disabledAll}
          >
            {submitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Guardar')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
