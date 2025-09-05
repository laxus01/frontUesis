import React, { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select, TextField } from '@mui/material';

export interface Option {
  id: number;
  name: string;
}

interface WithDialogSelectorProps {
  label: string;
  value: number;
  options: Option[];
  onChange: (id: number) => void;
  onCreate: (name: string) => Promise<Option>;
  icon: React.ReactNode;
  addButtonAria: string;
  disabled?: boolean;
}

export const WithDialogSelector: React.FC<WithDialogSelectorProps> = ({ label, value, options, onChange, onCreate, icon, addButtonAria, disabled }) => {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewName('');
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const newOption = await onCreate(newName.trim());
      onChange(newOption.id);
      handleClose();
    } catch (error) {
      console.error('Failed to create new option:', error);
      // Optionally, show an error message to the user
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {options.map(opt => (
            <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <IconButton onClick={handleOpen} aria-label={addButtonAria} disabled={disabled}>
        {icon}
      </IconButton>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Agregar Nuevo {label}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            type="text"
            fullWidth
            variant="standard"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
