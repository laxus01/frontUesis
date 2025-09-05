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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CameraAlt from '@mui/icons-material/CameraAlt';
import ImageIcon from '@mui/icons-material/Image';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CatalogService, { Option } from '../services/catalog.service';
import UploadService from '../services/upload.service';
import api from '../services/http';
import { useNotify } from '../services/notify';
import { formatNumber } from '../utils/formatting';
import { useDrivers } from '../hooks/useDrivers';

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
  const [openCam, setOpenCam] = useState(false);
  const [startingCam, setStartingCam] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
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

  const stopCamera = () => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach(t => t.stop());
      streamRef.current = null;
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
                aria-label="Seleccionar foto"
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
        capture
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
  const {
    loading,
    submitting,
    selectedDriverId,
    identification,
    issuedIn,
    firstName,
    lastName,
    phone,
    address,
    license,
    category,
    expiresOn,
    bloodType,
    photo,
    photoFilename,
    epsId,
    arlId,
    epsList,
    arlList,
    disabledAll,
    canSubmit,
    idQuery,
    idOptions,
    idLoading,
    nameQuery,
    nameOptions,
    nameLoading,
    setIdentification,
    setIssuedIn,
    setFirstName,
    setLastName,
    setPhone,
    setAddress,
    setLicense,
    setCategory,
    setExpiresOn,
    setBloodType,
    setPhoto,
    setPhotoFilename,
    setEpsId,
    setArlId,
    onSubmit,
    resetForm,
    handleDriverSelection,
    createEps,
    createArl,
    setIdQuery,
    setNameQuery
  } = useDrivers();

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
                    getOptionLabel={(option) => formatNumber(option.identification)}
                    filterOptions={(x) => x}
                    value={idOptions.find(opt => opt.identification === identification.replace(/[,.]/g, '')) || null}
                    onChange={(_event, newValue) => handleDriverSelection(newValue)}
                    inputValue={idQuery}
                    onInputChange={(_event, newInputValue) => {
                      const digitsOnly = newInputValue.replace(/\D/g, '');
                      setIdQuery(digitsOnly);
                    }}
                    loading={idLoading}
                    renderInput={(params) => (
                      <TextField {...params} label="Buscar Identificación" size="small" fullWidth required disabled={disabledAll} />
                    )}
                    disabled={disabledAll}
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
                    onChange={e => setLicense(e.target.value)}
                    required
                    disabled={disabledAll}
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
                    onCreate={createEps}
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
                    onCreate={createArl}
                    icon={<HealthAndSafetyIcon />}
                    addButtonAria="Agregar ARL"
                  />
                </Box>
              </Stack>

              <Box display="flex" gap={1}>
                <Button type="submit" variant="contained" disabled={!canSubmit || disabledAll}>
                  {submitting ? (selectedDriverId > 0 ? 'Actualizando...' : 'Guardando...') : (selectedDriverId > 0 ? 'Actualizar' : 'Guardar')}
                </Button>
                <Button type="button" variant="outlined" disabled={disabledAll} onClick={resetForm}>
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
