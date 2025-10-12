import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  MenuItem,
  Select,
  TextField,
  InputLabel,
  FormControl,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import AccountCircle from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { useDriverSearch, Driver } from '../hooks/useDriverSearch';
import { BLOOD_TYPES, CATEGORIES } from '../constants/controlCard';
import CatalogService, { Option } from '../services/catalog.service';
import { WithDialogSelector } from './WithDialogSelector';

interface DriverSectionProps {
  epsList: Option[];
  arlList: Option[];
  onEpsListChange: (eps: Option[]) => void;
  onArlListChange: (arl: Option[]) => void;
  onDriverChange: (driver: Driver | null) => void;
  disabled?: boolean;
}

function PhotoUploader({ photo }: { photo: string }) {
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

export const DriverSection: React.FC<DriverSectionProps> = ({
  epsList,
  arlList,
  onEpsListChange,
  onArlListChange,
  onDriverChange,
  disabled = false,
}) => {
  const {
    query,
    setQuery,
    loading,
    selectedDriver,
    searchDrivers,
  } = useDriverSearch();

  React.useEffect(() => {
    onDriverChange(selectedDriver);
  }, [selectedDriver, onDriverChange]);

  const handleSearch = () => {
    searchDrivers();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardContent>
        <Box>
          <Stack spacing={2}>
            {/* Foto */}
            <PhotoUploader photo={selectedDriver?.photo || ''} />
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Buscar Identificación"
                  size="small"
                  fullWidth
                  required
                  value={query}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '');
                    setQuery(digitsOnly);
                  }}
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleSearch}
                          disabled={!query.trim() || loading}
                          size="small"
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  disabled={disabled}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="De"
                  size="small"
                  fullWidth
                  value={selectedDriver?.issuedIn || ''}
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
                  value={selectedDriver?.firstName || ''}
                  required
                  disabled
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Apellido"
                  size="small"
                  fullWidth
                  value={selectedDriver?.lastName || ''}
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
                  value={selectedDriver?.phone || ''}
                  required
                  disabled
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Dirección"
                  size="small"
                  fullWidth
                  value={selectedDriver?.address || ''}
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
                  value={selectedDriver?.license || ''}
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
                    value={selectedDriver?.category || ''}
                    displayEmpty
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
                  value={selectedDriver?.expiresOn || null}
                  onChange={() => {}}
                  format="YYYY-MM-DD"
                  minDate={dayjs()}
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
              </Box>
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth size="small" disabled required>
                  <InputLabel id="bloodtype-select-label">Tipo de sangre</InputLabel>
                  <Select
                    labelId="bloodtype-select-label"
                    label="Tipo de sangre"
                    value={selectedDriver?.bloodType || ''}
                    displayEmpty
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
                  value={selectedDriver?.epsId || 0}
                  options={epsList}
                  onChange={() => {}}
                  onCreate={async (name) => {
                    const created = await CatalogService.createEps(name);
                    onEpsListChange([...epsList, created]);
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
                  value={selectedDriver?.arlId || 0}
                  options={arlList}
                  onChange={() => {}}
                  onCreate={async (name) => {
                    const created = await CatalogService.createArl(name);
                    onArlListChange([...arlList, created]);
                    return created;
                  }}
                  icon={<HealthAndSafetyIcon />}
                  addButtonAria="Agregar ARL"
                  disabled
                />
              </Box>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};
