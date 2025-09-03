import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { useNotify } from '../services/notify';
import api from '../services/http';
import { Option } from '../services/catalog.service';
import CatalogService from '../services/catalog.service';

export type WithOwnerDialogSelectorProps = {
  value: number;
  options: Option[];
  onChange: (id: number) => void;
  onCreate: (payload: { name: string; identification: string; phone: string; email?: string; address?: string; }) => Promise<Option>;
  disabled?: boolean;
};

export default function WithOwnerDialogSelector({ value, options, onChange, onCreate, disabled }: WithOwnerDialogSelectorProps) {
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
                  await api.put(`/owner/${selectedOwnerId}`, payload);
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
