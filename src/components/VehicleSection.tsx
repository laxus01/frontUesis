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
import SearchIcon from '@mui/icons-material/Search';
import { useVehicleSearch, Vehicle } from '../hooks/useVehicleSearch';
import { Option } from '../services/catalog.service';

interface VehicleSectionProps {
  makes: Option[];
  insurers: Option[];
  communicationCompanies: Option[];
  owners: Option[];
  onVehicleChange: (vehicle: Vehicle | null) => void;
  disabled?: boolean;
}

export const VehicleSection: React.FC<VehicleSectionProps> = ({
  makes,
  insurers,
  communicationCompanies,
  owners,
  onVehicleChange,
  disabled = false,
}) => {
  const {
    query,
    setQuery,
    loading,
    selectedVehicle,
    searchVehicles,
  } = useVehicleSearch();

  React.useEffect(() => {
    onVehicleChange(selectedVehicle);
  }, [selectedVehicle, onVehicleChange]);

  const handleSearch = () => {
    searchVehicles();
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Buscar Placa"
                  size="small"
                  fullWidth
                  required
                  value={query}
                  onChange={(e) => {
                    const upperValue = e.target.value.toUpperCase();
                    setQuery(upperValue);
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
                  label="Modelo"
                  size="small"
                  fullWidth
                  value={selectedVehicle?.model || ''}
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
                  value={selectedVehicle?.internalNumber || ''}
                  disabled
                  required
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Número Móvil"
                  size="small"
                  fullWidth
                  value={selectedVehicle?.mobileNumber || ''}
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
                    value={selectedVehicle?.makeId || 0}
                    displayEmpty
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
                    value={selectedVehicle?.insurerId || 0}
                    displayEmpty
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
                    value={selectedVehicle?.communicationCompanyId || 0}
                    displayEmpty
                  >
                    {communicationCompanies.map(o => (
                      <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Propietario"
                  size="small"
                  fullWidth
                  value={selectedVehicle?.ownerName || ''}
                  disabled
                  required
                />
              </Box>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};
