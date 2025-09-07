import React from 'react';
import { Box, Chip } from '@mui/material';
import DataTable, { TableColumn, tableActions } from './DataTable';
import { OwnerLite } from '../../hooks/useOwners';
import { formatNumber } from '../../utils/formatting';

// Example usage of DataTable with Owner data
interface OwnerTableProps {
  owners: OwnerLite[];
  loading?: boolean;
  onEdit?: (owner: OwnerLite) => void;
  onDelete?: (owner: OwnerLite) => void;
  onView?: (owner: OwnerLite) => void;
}

export function OwnerTable({ 
  owners, 
  loading = false, 
  onEdit, 
  onDelete, 
  onView 
}: OwnerTableProps): JSX.Element {
  // Define columns for Owner table
  const columns: TableColumn<OwnerLite>[] = [
    {
      id: 'id',
      label: 'ID',
      minWidth: 70,
      align: 'center',
      sortable: true,
    },
    {
      id: 'identification',
      label: 'Identificación',
      minWidth: 120,
      sortable: true,
      searchable: true,
      format: (value: string) => formatNumber(value),
    },
    {
      id: 'name',
      label: 'Nombre',
      minWidth: 200,
      sortable: true,
      searchable: true,
      render: (value: string, row: OwnerLite) => (
        <Box>
          <Box component="span" sx={{ fontWeight: 500 }}>
            {value}
          </Box>
          <Box component="div" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            ID: {row.id}
          </Box>
        </Box>
      ),
    },
  ];

  // Define actions
  const actions = [
    ...(onView ? [tableActions.view(onView)] : []),
    ...(onEdit ? [tableActions.edit(onEdit)] : []),
    ...(onDelete ? [tableActions.delete(onDelete)] : []),
  ];

  return (
    <DataTable
      data={owners}
      columns={columns}
      loading={loading}
      actions={actions}
      title="Lista de Propietarios"
      searchPlaceholder="Buscar por identificación o nombre..."
      emptyMessage="No se encontraron propietarios"
      pageSize={10}
      dense
      stickyHeader
      maxHeight={500}
    />
  );
}

// Example with more complex data structure
interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  active: boolean;
  ownerId: number;
  ownerName: string;
  createdAt: string;
}

interface VehicleTableProps {
  vehicles: Vehicle[];
  loading?: boolean;
  onRowClick?: (vehicle: Vehicle) => void;
  onEdit?: (vehicle: Vehicle) => void;
  onToggleStatus?: (vehicle: Vehicle) => void;
}

export function VehicleTable({ 
  vehicles, 
  loading = false, 
  onRowClick,
  onEdit,
  onToggleStatus 
}: VehicleTableProps): JSX.Element {
  const columns: TableColumn<Vehicle>[] = [
    {
      id: 'plate',
      label: 'Placa',
      minWidth: 100,
      sortable: true,
      searchable: true,
      render: (value: string) => (
        <Chip 
          label={value} 
          variant="outlined" 
          size="small"
          sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
        />
      ),
    },
    {
      id: 'brand',
      label: 'Marca',
      minWidth: 120,
      sortable: true,
      searchable: true,
    },
    {
      id: 'model',
      label: 'Modelo',
      minWidth: 120,
      sortable: true,
      searchable: true,
    },
    {
      id: 'year',
      label: 'Año',
      minWidth: 80,
      align: 'center',
      sortable: true,
    },
    {
      id: 'color',
      label: 'Color',
      minWidth: 100,
      sortable: true,
      render: (value: string) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: value.toLowerCase(),
              border: '1px solid #ccc',
            }}
          />
          {value}
        </Box>
      ),
    },
    {
      id: 'ownerName',
      label: 'Propietario',
      minWidth: 150,
      sortable: true,
      searchable: true,
    },
    {
      id: 'active',
      label: 'Estado',
      minWidth: 100,
      align: 'center',
      sortable: true,
      render: (value: boolean) => (
        <Chip
          label={value ? 'Activo' : 'Inactivo'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Fecha Registro',
      minWidth: 120,
      sortable: true,
      format: (value: string) => new Date(value).toLocaleDateString('es-ES'),
    },
  ];

  const actions = [
    ...(onEdit ? [tableActions.edit(onEdit)] : []),
    ...(onToggleStatus ? [{
      label: 'Cambiar Estado',
      icon: <Chip size="small" label="Estado" />,
      onClick: onToggleStatus,
      color: 'warning' as const,
    }] : []),
  ];

  return (
    <DataTable
      data={vehicles}
      columns={columns}
      loading={loading}
      actions={actions}
      onRowClick={onRowClick}
      title="Lista de Vehículos"
      searchPlaceholder="Buscar por placa, marca, modelo o propietario..."
      emptyMessage="No se encontraron vehículos"
      pageSize={15}
      stickyHeader
      maxHeight={600}
    />
  );
}

export default { OwnerTable, VehicleTable };
