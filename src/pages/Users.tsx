import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../hooks/useAuth';
import { SystemUser, CreateUserPayload, UpdateUserPayload, PERMISSION_LABELS, UserPermission } from '../types/user.types';
import { useSnackbar } from '../components/SnackbarProvider';
import DataTable, { TableColumn, TableAction } from '../components/common/DataTable';

const Users: React.FC = () => {
  const { users, loading, createUser, updateUser, deleteUser } = useUsers();
  const { currentUser } = useAuth();
  const { success: showSuccess, error: showError } = useSnackbar();

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<CreateUserPayload>({
    user: '',
    password: '',
    name: '',
    permissions: 'VIEWER',
    companyId: currentUser?.company?.id ? parseInt(currentUser.company.id) : 1
  });


  // Columnas de la tabla
  const columns: TableColumn<SystemUser>[] = [
    {
      id: 'user',
      label: 'Usuario',
      sortable: true,
      render: (_value, row) => <strong>{row.user}</strong>
    },
    {
      id: 'name',
      label: 'Nombre',
      sortable: true,
      render: (_value, row) => row.name
    },
    {
      id: 'company',
      label: 'Compañía',
      sortable: false,
      render: (_value, row) => row.company?.name || '-'
    },
    {
      id: 'permissions',
      label: 'Permisos',
      sortable: true,
      render: (_value, row) => {
        const colors: Record<UserPermission, 'error' | 'warning' | 'info'> = {
          ADMIN: 'error',
          OPERATOR: 'warning',
          VIEWER: 'info'
        };
        return (
          <Chip
            label={PERMISSION_LABELS[row.permissions as UserPermission]}
            color={colors[row.permissions as UserPermission]}
            size="small"
          />
        );
      }
    },
    {
      id: 'createdAt',
      label: 'Fecha Creación',
      sortable: true,
      render: (_value, row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'
    }
  ];

  // Acciones de la tabla
  const actions: TableAction<SystemUser>[] = [
    {
      label: 'Editar',
      icon: <EditIcon />,
      color: 'primary',
      onClick: handleEdit
    },
    {
      label: 'Eliminar',
      icon: <DeleteIcon />,
      color: 'error',
      onClick: handleDeleteClick
    }
  ];

  function handleEdit(user: SystemUser) {
    setEditingUser(user);
    setFormData({
      user: user.user,
      password: '',
      name: user.name,
      permissions: user.permissions,
      companyId: user.companyId || user.company?.id || 1
    });
    setOpenDialog(true);
  }

  function handleDeleteClick(user: SystemUser) {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  }

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      user: '',
      password: '',
      name: '',
      permissions: 'VIEWER',
      companyId: currentUser?.company?.id ? parseInt(currentUser.company.id) : 1
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.user.trim()) {
      showError('El usuario es requerido');
      return;
    }
    if (!formData.name.trim()) {
      showError('El nombre es requerido');
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      showError('La contraseña es requerida');
      return;
    }

    if (editingUser) {
      // Actualizar - Incluir password solo si se proporcionó
      const payload: UpdateUserPayload = {
        name: formData.name,
        user: formData.user,
        companyId: formData.companyId,
        permissions: formData.permissions,
        ...(formData.password.trim() && { password: formData.password })
      };

      const result = await updateUser(editingUser.id!, payload);
      if (result.success) {
        showSuccess('Usuario actualizado exitosamente');
        handleCloseDialog();
      } else {
        showError(result.error || 'Error al actualizar usuario');
      }
    } else {
      // Crear
      const result = await createUser(formData);
      if (result.success) {
        showSuccess('Usuario creado exitosamente');
        handleCloseDialog();
      } else {
        showError(result.error || 'Error al crear usuario');
      }
    }
  };


  const handleDelete = async () => {
    if (selectedUser) {
      const result = await deleteUser(selectedUser.id!);
      if (result.success) {
        showSuccess('Usuario eliminado exitosamente');
        setOpenDeleteDialog(false);
        setSelectedUser(null);
      } else {
        showError(result.error || 'Error al eliminar usuario');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {loading && users.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          actions={actions}
          searchable
          searchPlaceholder="Buscar usuarios..."
        />
      )}

      {/* Dialog Crear/Editar Usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Usuario"
              value={formData.user}
              onChange={(e) => setFormData({ ...formData, user: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Nombre Completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label={editingUser ? "Nueva Contraseña (opcional)" : "Contraseña"}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              fullWidth
              required={!editingUser}
              helperText={editingUser ? "Dejar en blanco para mantener la contraseña actual" : ""}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              select
              label="Tipo de Usuario"
              value={formData.permissions}
              onChange={(e) => setFormData({ ...formData, permissions: e.target.value as UserPermission })}
              fullWidth
              required
            >
              <MenuItem value="ADMIN">Administrador</MenuItem>
              <MenuItem value="OPERATOR">Operador</MenuItem>
              <MenuItem value="VIEWER">Visualizador</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmar Eliminación */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción no se puede deshacer
          </Alert>
          <Typography>
            ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser?.user}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
