import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
} from '@mui/material';
import api from '../services/http';
import { Option } from '../services/catalog.service';

export type WithOwnerDialogSelectorProps = {
  value: number;
  options: Option[]; // This will be used for the initial value
  onChange: (id: number, newOptions?: Option[]) => void;
  disabled?: boolean;
};

export default function WithOwnerDialogSelector({ value, options, onChange, disabled }: WithOwnerDialogSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundOwners, setFoundOwners] = useState<Option[]>([]);

  // Debounced search by identification or name
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setFoundOwners([]);
      return;
    }

    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const params: any = {};
        // Simple check if it's a number for identification, otherwise search by name
        if (/^\d+$/.test(query)) {
          params.identification = query;
        } else {
          params.name = query;
        }
        const res = await api.get<any[]>('/owner', { params });
        const list = (Array.isArray(res.data) ? res.data : []).map(o => ({ id: o.id, name: `${o.name} (${o.identification})` }));
        setFoundOwners(list);
      } catch (e) {
        setFoundOwners([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  const allOptions = [...options, ...foundOwners].filter((option, index, self) =>
    index === self.findIndex((t) => t.id === option.id)
  );

  const selectedValue = allOptions.find(o => o.id === value) || null;

  return (
    <Autocomplete
      options={allOptions}
      value={selectedValue}
      getOptionLabel={(o) => o?.name ?? ''}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      onChange={(event, newValue) => {
        onChange(newValue ? newValue.id : 0, foundOwners);
      }}
      inputValue={searchQuery}
      onInputChange={(e, newInputValue) => {
        setSearchQuery(newInputValue);
      }}
      loading={loading}
      filterOptions={(x) => x} // Options are already filtered by the API
      renderInput={(params) => (
        <TextField
          {...params}
          label="Buscar Propietario (Nombre o ID)"
          size="small"
          required
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      disabled={disabled}
    />
  );
}
