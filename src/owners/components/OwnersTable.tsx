import React from 'react';
import { Box } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import DataTable, { TableColumn, TableAction } from '../../components/common/DataTable';
import { formatNumber } from '../../utils/formatting';
import { Owner } from '../interfaces/owner.interface';
import { useAuth } from '../../hooks/useAuth';

interface OwnersTableProps {
  owners: Owner[];
  loading: boolean;
  onEdit: (owner: Owner) => void;
  onDelete: (owner: Owner) => void;
}

export default function OwnersTable({ owners, loading, onEdit, onDelete }: OwnersTableProps): JSX.Element {
  const { canManageData, isAdmin } = useAuth();

  // Define table columns
  const columns: TableColumn<Owner>[] = [
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
      render: (value: string, row: Owner) => (
        <Box>
          <Box component="span" sx={{ fontWeight: 500 }}>
            {value}
          </Box>
          <Box component="div" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            ID: {row.identification}
          </Box>
        </Box>
      ),
    },
    {
      id: 'phone',
      label: 'Teléfono',
      minWidth: 120,
      sortable: true,
      searchable: true,
    },
    {
      id: 'email',
      label: 'Correo Electrónico',
      minWidth: 200,
      sortable: true,
      searchable: true,
      render: (value: string) => value || '-',
    },
    {
      id: 'address',
      label: 'Dirección',
      minWidth: 200,
      sortable: true,
      searchable: true,
      render: (value: string) => value || '-',
    },
  ];

  // Define table actions
  const actions: TableAction<Owner>[] = canManageData()
    ? isAdmin()
      ? [
        {
          label: 'Editar',
          icon: <EditIcon />,
          onClick: onEdit,
          color: 'primary',
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
      data={owners}
      columns={columns}
      loading={loading}
      actions={actions}
      searchPlaceholder="Buscar por identificación, nombre, teléfono o email..."
      emptyMessage="No se encontraron propietarios"
      pageSize={5}
      stickyHeader
      maxHeight={600}
      exportConfig={canManageData() ? {
        endpoint: '/owner/export/excel',
        filename: 'listado-propietarios.xlsx'
      } : undefined}
    />
  );
}
