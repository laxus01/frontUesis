import React from 'react';
import { Chip } from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    ToggleOn as ToggleOnIcon,
    ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import DataTable, { TableColumn, TableAction } from '../../components/common/DataTable';
import { Vehicle } from '../interfaces/vehicle.interface';
import { useAuth } from '../../hooks/useAuth';

interface VehiclesTableProps {
    vehicles: Vehicle[];
    loading: boolean;
    onEdit: (vehicle: Vehicle) => void;
    onDelete: (vehicle: Vehicle) => void;
    onToggleState: (vehicle: Vehicle) => void;
}

export default function VehiclesTable({ vehicles, loading, onEdit, onDelete, onToggleState }: VehiclesTableProps) {
    const { canManageData, isAdmin } = useAuth();

    const columns: TableColumn<Vehicle>[] = [
        {
            id: 'plate',
            label: 'Placa',
            sortable: true,
            render: (value, vehicle) => (
                <Chip
                    label={vehicle.plate}
                    color="primary"
                    variant="outlined"
                    size="small"
                />
            )
        },
        {
            id: 'model',
            label: 'Modelo',
            sortable: true,
        },
        {
            id: 'internalNumber',
            label: 'Número Interno',
            sortable: true,
        },
        {
            id: 'mobileNumber',
            label: 'Número Móvil',
            sortable: true,
            render: (value, vehicle) => vehicle.mobileNumber || '-'
        },
        {
            id: 'make',
            label: 'Marca',
            sortable: true,
            render: (value, vehicle) => vehicle.make?.name || '-'
        },
        {
            id: 'owner',
            label: 'Propietario',
            sortable: true,
            render: (value, vehicle) => vehicle.owner?.name || '-'
        },
        {
            id: 'communicationCompany',
            label: 'Comunicación',
            sortable: true,
            render: (value, vehicle) => vehicle.communicationCompany?.name || '-'
        },
        {
            id: 'line',
            label: 'Línea',
            sortable: true,
            render: (value, vehicle) => vehicle.line || '-'
        },
        {
            id: 'state',
            label: 'Estado',
            sortable: true,
            render: (value, vehicle) => (
                <Chip
                    label={vehicle.state === 1 ? 'Activo' : 'Inactivo'}
                    color={vehicle.state === 1 ? 'success' : 'error'}
                    variant="filled"
                    size="small"
                />
            )
        }
    ];

    // Solo mostrar acciones si el usuario puede gestionar datos.
    // Desactivar/Activar y Eliminar solo se muestran para usuarios ADMIN (o SUPER según useAuth).
    const actions: TableAction<Vehicle>[] = canManageData()
        ? isAdmin()
            ? [
                {
                    label: 'Editar',
                    icon: <EditIcon />,
                    onClick: onEdit,
                },
                {
                    label: (vehicle: Vehicle) => (vehicle.state === 1 ? 'Desactivar' : 'Activar'),
                    icon: (vehicle: Vehicle) => (vehicle.state === 1 ? <ToggleOffIcon /> : <ToggleOnIcon />),
                    onClick: onToggleState,
                    color: (vehicle: Vehicle) => (vehicle.state === 1 ? 'warning' : 'success'),
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
                },
            ]
        : [];

    return (
        <DataTable
            data={vehicles}
            columns={columns}
            actions={actions}
            loading={loading}
            searchable
            sortable
            paginated
            pageSize={5}
            emptyMessage="No hay vehículos registrados"
            exportConfig={canManageData() ? {
                endpoint: '/vehicles/export/excel',
                filename: 'listado-vehiculos.xlsx'
            } : undefined}
        />
    );
}
