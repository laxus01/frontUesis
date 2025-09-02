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
} from '@mui/material';
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
  const [ownerName, setOwnerName] = useState('');
  const [ownerIdentification, setOwnerIdentification] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControl fullWidth size="small" required disabled={disabled}>
          <InputLabel id={`owner-select-label`}>Propietario</InputLabel>
          <Select
            labelId={`owner-select-label`}
            label="Propietario"
            value={value}
            displayEmpty
            onChange={e => onChange(e.target.value === 0 ? 0 : Number(e.target.value))}
          >
            {options.map((o) => (
              <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title="Agregar propietario">
          <span>
            <IconButton color="primary" onClick={() => setOpen(true)} disabled={disabled} aria-label="Agregar propietario">
              <PersonAddAlt1Icon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Agregar propietario</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Nombre del propietario" type="text" fullWidth value={ownerName} onChange={e => setOwnerName(e.target.value)} disabled={saving} />
          <TextField margin="dense" label="Identificación" type="text" fullWidth value={ownerIdentification} onChange={e => setOwnerIdentification(e.target.value)} disabled={saving} />
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
                const created = await onCreate(payload);
                onChange(created.id);
                setOpen(false);
                setOwnerName('');
                setOwnerIdentification('');
                setOwnerEmail('');
                setOwnerAddress('');
                setOwnerPhone('');
                success('Propietario creado');
              } catch (e: any) {
                const msg = e?.response?.data?.message || 'No se pudo crear el propietario';
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

export default function Vehicles(): JSX.Element {
  const { success, warning, error } = useNotify();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [internalNumber, setInternalNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
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

  const canSubmit = useMemo(() => {
    return (
      plate.trim().length > 0 &&
      model.trim().length > 0 &&
      internalNumber.trim().length > 0 &&
      mobileNumber.trim().length > 0 &&
      makeId > 0 &&
      insurerId > 0 &&
      communicationCompanyId > 0 &&
      ownerId > 0
    );
  }, [plate, model, internalNumber, mobileNumber, makeId, insurerId, communicationCompanyId, ownerId]);

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
      payload.mobileNumber = mobileNumber.trim();
      payload.insurerId = insurerId;
      payload.communicationCompanyId = communicationCompanyId;
      payload.ownerId = ownerId;
      if (companyId) payload.companyId = companyId;

      const res = await api.post('/vehicles', payload);
      success('Vehículo creado con éxito (ID ' + res.data?.id + ').');
      // Reset básico
      setPlate('');
      setModel('');
      setInternalNumber('');
      setMobileNumber('');
      setMakeId(0);
      setInsurerId(0);
      setCommunicationCompanyId(0);
      setOwnerId(0);
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
                  <TextField
                    label="Placa"
                    size="small"
                    fullWidth
                    value={plate}
                    onChange={e => setPlate(e.target.value.toUpperCase())}
                    required
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
                    required
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
                  {submitting ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button type="button" variant="outlined" disabled={loading || submitting}
                  onClick={() => {
                    setPlate(''); setModel(''); setInternalNumber(''); setMobileNumber('');
                    setMakeId(0);
                    setInsurerId(0);
                    setCommunicationCompanyId(0);
                    setOwnerId(0);
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
