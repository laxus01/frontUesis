import React, { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import DataTable, { TableColumn, TableAction } from '../../components/common/DataTable';
import { Driver } from '../interfaces/driver.interface';
import { useAuth } from '../../hooks/useAuth';

interface DriversTableProps {
  drivers: Driver[];
  loading: boolean;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
  onToggleState: (driver: Driver) => void;
}

export default function DriversTable({ drivers, loading, onEdit, onDelete, onToggleState }: DriversTableProps) {
  const { canManageData, isAdmin } = useAuth();
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const columns: TableColumn<Driver>[] = [
    {
      id: 'photo',
      label: 'Foto',
      sortable: false,
      render: (photoUrl, driver) => {
        const hasImageError = imageErrors.has(driver.id);

        if (!photoUrl || hasImageError) {
          return (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #ddd',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0)}
              </Typography>
            </Box>
          );
        }

        return (
          <Box
            component="img"
            src={photoUrl}
            alt={`${driver.firstName} ${driver.lastName}`}
            onError={() => {
              setImageErrors(prev => new Set([...prev, driver.id]));
            }}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid #eee',
              display: 'block',
              flexShrink: 0,
            }}
          />
        );
      },
    },
    {
      id: 'firstName',
      label: 'Nombre',
      sortable: true,
    },
    {
      id: 'lastName',
      label: 'Apellido',
      sortable: true,
    },
    {
      id: 'identification',
      label: 'Identificación',
      sortable: true,
    },
    {
      id: 'phone',
      label: 'Teléfono',
      sortable: false,
    },
    {
      id: 'license',
      label: 'N° Licencia',
      sortable: true,
    },
    {
      id: 'category',
      label: 'Categoría',
      sortable: true,
    },
    {
      id: 'expiresOn',
      label: 'Vencimiento',
      sortable: true,
      render: (expiresOn) => new Date(expiresOn).toLocaleDateString(),
    },
    {
      id: 'bloodType',
      label: 'Tipo Sangre',
      sortable: true,
    },
    {
      id: 'state',
      label: 'Estado',
      sortable: true,
      render: (value, driver) => (
        <Chip
          label={driver.state === 1 ? 'Activo' : 'Inactivo'}
          color={driver.state === 1 ? 'success' : 'error'}
          variant="filled"
          size="small"
        />
      )
    },
  ];

  const actions: TableAction<Driver>[] = canManageData()
    ? isAdmin()
      ? [
        {
          label: 'Editar',
          icon: <EditIcon />,
          onClick: onEdit,
          color: 'primary',
        },
        {
          label: driver => (driver.state === 1 ? 'Desactivar' : 'Activar'),
          icon: (driver) => (driver.state === 1 ? <ToggleOffIcon /> : <ToggleOnIcon />),
          onClick: onToggleState,
          color: (driver) => (driver.state === 1 ? 'warning' : 'success'),
        },
        {
          label: 'Eliminar',
          icon: <DeleteIcon />,
          onClick: onDelete,
          color: 'error',
        },
      ]
      : [
        {
          label: 'Editar',
          icon: <EditIcon />,
          onClick: onEdit,
          color: 'primary',
        },
      ]
    : [];

  return (
    <DataTable
      data={drivers}
      columns={columns}
      actions={actions}
      loading={loading}
      searchable
      sortable
      paginated
      pageSize={10}
      emptyMessage="No hay conductores registrados"
      exportConfig={canManageData() ? {
        endpoint: '/drivers/export/excel',
        filename: 'listado-conductores.xlsx'
      } : undefined}
    />
  );
}
