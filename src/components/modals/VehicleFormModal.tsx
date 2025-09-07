import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  Close as CloseIcon,
  DirectionsCar as DirectionsCarIcon,
  Business as BusinessIcon,
  CellTower as CellTowerIcon,
} from '@mui/icons-material';
import { formatNumber } from '../../utils/formatting';
import CatalogService, { Option } from '../../services/catalog.service';
import api from '../../services/http';
import { useNotify } from '../../services/notify';
import { Vehicle } from '../../hooks/useVehiclesList';

interface VehicleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editVehicle?: Vehicle | null;
}

// Subcomponent for catalog selectors with create functionality
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

export default function VehicleFormModal({ open, onClose, onSuccess, editVehicle }: VehicleFormModalProps) {
  const { warning, error, success } = useNotify();
  const isEditMode = Boolean(editVehicle);

  // Form state
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [internalNumber, setInternalNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [line, setLine] = useState('');
  const [entryDate, setEntryDate] = useState<Dayjs | null>(null);

  // Catalog state
  const [makeId, setMakeId] = useState(0);
  const [insurerId, setInsurerId] = useState(0);
  const [communicationCompanyId, setCommunicationCompanyId] = useState(0);
  const [ownerId, setOwnerId] = useState(0);

  // Options state
  const [makeOptions, setMakeOptions] = useState<Option[]>([]);
  const [insurerOptions, setInsurerOptions] = useState<Option[]>([]);
  const [communicationCompanyOptions, setCommunicationCompanyOptions] = useState<Option[]>([]);
  const [ownerOptions, setOwnerOptions] = useState<any[]>([]);

  // Owner search state
  const [ownerQuery, setOwnerQuery] = useState('');
  const [ownerLoading, setOwnerLoading] = useState(false);

  // Form control state
  const [submitting, setSubmitting] = useState(false);
  const [disabledAll, setDisabledAll] = useState(false);

  // Load catalog options
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        // First try to get from storage
        const cached = CatalogService.getCatalogsFromStorage();
        if (cached) {
          setMakeOptions(cached.makes);
          setInsurerOptions(cached.insurers);
          setCommunicationCompanyOptions(cached.communicationCompanies);
        }

        // Then fetch fresh data
        const catalogs = await CatalogService.fetchCatalogs();
        setMakeOptions(catalogs.makes);
        setInsurerOptions(catalogs.insurers);
        setCommunicationCompanyOptions(catalogs.communicationCompanies);
      } catch (e) {
        error('Error cargando catálogos');
      }
    };

    if (open) {
      loadCatalogs();
    }
  }, [open, error]);

  // Load owner options when searching
  useEffect(() => {
    const searchOwners = async () => {
      if (!ownerQuery.trim()) {
        setOwnerOptions([]);
        return;
      }

      setOwnerLoading(true);
      try {
        const response = await api.get('/owner', {
          params: { search: ownerQuery.trim() }
        });
        setOwnerOptions(response.data || []);
      } catch (e) {
        setOwnerOptions([]);
      } finally {
        setOwnerLoading(false);
      }
    };

    const timeoutId = setTimeout(searchOwners, 300);
    return () => clearTimeout(timeoutId);
  }, [ownerQuery]);

  // Initialize form when editing
  useEffect(() => {
    if (open && editVehicle) {
      setPlate(editVehicle.plate || '');
      setModel(editVehicle.model || '');
      setInternalNumber(editVehicle.internalNumber || '');
      setMobileNumber(editVehicle.mobileNumber || '');
      setEngineNumber(editVehicle.engineNumber || '');
      setChassisNumber(editVehicle.chassisNumber || '');
      setLine(editVehicle.line || '');
      setEntryDate(editVehicle.entryDate ? dayjs(editVehicle.entryDate) : null);
      setMakeId(editVehicle.make?.id || 0);
      setInsurerId(editVehicle.insurer?.id || 0);
      setCommunicationCompanyId(editVehicle.communicationCompany?.id || 0);
      setOwnerId(editVehicle.owner?.id || 0);

      // Set owner query for display
      if (editVehicle.owner) {
        setOwnerQuery(`${editVehicle.owner.identification} - ${editVehicle.owner.name}`);
        setOwnerOptions([editVehicle.owner]);
      }
    }
  }, [open, editVehicle]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
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
      setOwnerQuery('');
      setOwnerOptions([]);
      setSubmitting(false);
      setDisabledAll(false);
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    return plate.trim() && model.trim() && internalNumber.trim() && makeId && insurerId && communicationCompanyId && ownerId;
  }, [plate, model, internalNumber, makeId, insurerId, communicationCompanyId, ownerId]);

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const handleOwnerSelection = (owner: any) => {
    if (owner) {
      setOwnerId(owner.id);
      setOwnerQuery(`${owner.identification} - ${owner.name}`);
    } else {
      setOwnerId(0);
      setOwnerQuery('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setDisabledAll(true);

    try {
      const companyId = localStorage.getItem('companyId');

      const payload = {
        plate: plate.trim(),
        model: model.trim(),
        internalNumber: internalNumber.trim(),
        mobileNumber: mobileNumber.trim() || undefined,
        engineNumber: engineNumber.trim() || undefined,
        chassisNumber: chassisNumber.trim() || undefined,
        line: line.trim() || undefined,
        entryDate: entryDate ? entryDate.format('YYYY-MM-DD') : undefined,
        makeId,
        insurerId,
        communicationCompanyId,
        ownerId,
        companyId: companyId ? parseInt(companyId) : undefined,
      };

      if (isEditMode && editVehicle) {
        await api.put(`/vehicles/${editVehicle.id}`, payload);
        success('Vehículo actualizado exitosamente');
      } else {
        await api.post('/vehicles', payload);
        success('Vehículo creado exitosamente');
      }

      onSuccess?.();
      handleClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error al guardar el vehículo';
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
        {isEditMode ? 'Editar Vehículo' : 'Nuevo Vehículo'}
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Placa"
                  size="small"
                  fullWidth
                  value={plate}
                  onChange={e => setPlate(e.target.value.toUpperCase())}
                  required
                  disabled={disabledAll}
                  placeholder="ABC123"
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
                  disabled={disabledAll}
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
                  required
                  disabled={disabledAll}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Número Móvil"
                  size="small"
                  fullWidth
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  disabled={disabledAll}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Número de Motor"
                  size="small"
                  fullWidth
                  value={engineNumber}
                  onChange={e => setEngineNumber(e.target.value)}
                  disabled={disabledAll}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Número de Chasis"
                  size="small"
                  fullWidth
                  value={chassisNumber}
                  onChange={e => setChassisNumber(e.target.value)}
                  disabled={disabledAll}
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
                  disabled={disabledAll}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <DatePicker
                  label="Fecha de Ingreso"
                  value={entryDate}
                  onChange={setEntryDate}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      disabled: disabledAll,
                    }
                  }}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <WithDialogSelector
                  label="Marca"
                  value={makeId}
                  options={makeOptions}
                  onChange={setMakeId}
                  onCreate={CatalogService.createMake}
                  icon={<DirectionsCarIcon />}
                  addButtonAria="Agregar marca"
                  disabled={disabledAll}
                /></Box>

              <Box sx={{ flex: 1 }}>
                <WithDialogSelector
                  label="Aseguradora"
                  value={insurerId}
                  options={insurerOptions}
                  onChange={setInsurerId}
                  onCreate={CatalogService.createInsurer}
                  icon={<BusinessIcon />}
                  addButtonAria="Agregar aseguradora"
                  disabled={disabledAll}
                /></Box>

              <Box sx={{ flex: 1 }}>
                <WithDialogSelector
                  label="Empresa de Comunicación"
                  value={communicationCompanyId}
                  options={communicationCompanyOptions}
                  onChange={setCommunicationCompanyId}
                  onCreate={CatalogService.createCommunicationCompany}
                  icon={<CellTowerIcon />}
                  addButtonAria="Agregar empresa de comunicación"
                  disabled={disabledAll}
                /></Box>
            </Stack>

            <Stack spacing={2}>


              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Propietario *
                </Typography>
                <Autocomplete
                  size="small"
                  options={ownerOptions}
                  getOptionLabel={(option) => `${option.identification} - ${option.name}`}
                  value={ownerOptions.find(o => o.id === ownerId) || null}
                  onChange={(_, value) => handleOwnerSelection(value)}
                  inputValue={ownerQuery}
                  onInputChange={(_, value) => {
                    setOwnerQuery(value);
                    if (!value) {
                      setOwnerId(0);
                    }
                  }}
                  loading={ownerLoading}
                  disabled={disabledAll}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Buscar por identificación o nombre"
                      required={ownerId === 0}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Stack>
                        <Typography variant="body2">
                          <strong>{formatNumber(option.identification)}</strong> - {option.name}
                        </Typography>
                        {option.email && (
                          <Typography variant="caption" color="text.secondary">
                            {option.email}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  )}
                  noOptionsText={ownerQuery.trim() ? "No se encontraron propietarios" : "Escriba para buscar"}
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
