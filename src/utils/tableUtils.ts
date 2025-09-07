import { TableColumn } from '../components/common/DataTable';

// Common column configurations for reuse across different tables
export const commonColumns = {
  id: <T extends { id: number }>(): TableColumn<T> => ({
    id: 'id',
    label: 'ID',
    minWidth: 70,
    align: 'center',
    sortable: true,
  }),

  identification: <T extends { identification: string }>(): TableColumn<T> => ({
    id: 'identification',
    label: 'Identificación',
    minWidth: 120,
    sortable: true,
    searchable: true,
  }),

  name: <T extends { name: string }>(): TableColumn<T> => ({
    id: 'name',
    label: 'Nombre',
    minWidth: 150,
    sortable: true,
    searchable: true,
  }),

  email: <T extends { email: string }>(): TableColumn<T> => ({
    id: 'email',
    label: 'Correo Electrónico',
    minWidth: 200,
    sortable: true,
    searchable: true,
  }),

  phone: <T extends { phone: string }>(): TableColumn<T> => ({
    id: 'phone',
    label: 'Teléfono',
    minWidth: 120,
    sortable: true,
    searchable: true,
  }),

  address: <T extends { address: string }>(): TableColumn<T> => ({
    id: 'address',
    label: 'Dirección',
    minWidth: 200,
    sortable: true,
    searchable: true,
  }),

  createdAt: <T extends { createdAt: string }>(): TableColumn<T> => ({
    id: 'createdAt',
    label: 'Fecha Creación',
    minWidth: 120,
    sortable: true,
    format: (value: string) => new Date(value).toLocaleDateString('es-ES'),
  }),

  updatedAt: <T extends { updatedAt: string }>(): TableColumn<T> => ({
    id: 'updatedAt',
    label: 'Última Actualización',
    minWidth: 120,
    sortable: true,
    format: (value: string) => new Date(value).toLocaleDateString('es-ES'),
  }),

  status: <T extends { status: boolean }>(): TableColumn<T> => ({
    id: 'status',
    label: 'Estado',
    minWidth: 100,
    align: 'center',
    sortable: true,
    render: (value: boolean) => (
      <span style={{ 
        padding: '4px 8px', 
        borderRadius: '4px', 
        fontSize: '0.75rem',
        backgroundColor: value ? '#e8f5e8' : '#f5f5f5',
        color: value ? '#2e7d32' : '#757575',
        fontWeight: 500
      }}>
        {value ? 'Activo' : 'Inactivo'}
      </span>
    ),
  }),
};

// Utility functions for table data processing
export const tableUtils = {
  // Format currency values
  formatCurrency: (value: number, currency = 'COP'): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
    }).format(value);
  },

  // Format percentage values
  formatPercentage: (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  },

  // Format date with time
  formatDateTime: (value: string): string => {
    return new Date(value).toLocaleString('es-ES');
  },

  // Truncate long text
  truncateText: (text: string, maxLength = 50): string => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  },

  // Create a searchable text from multiple fields
  createSearchableText: <T>(row: T, fields: (keyof T)[]): string => {
    return fields
      .map(field => String(row[field] || ''))
      .join(' ')
      .toLowerCase();
  },

  // Sort function for complex objects
  sortByPath: <T>(path: string) => (a: T, b: T): number => {
    const getValue = (obj: any, path: string): any => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    const aValue = getValue(a, path);
    const bValue = getValue(b, path);

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue);
    }

    return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
  },
};

// Pre-configured table settings for different use cases
export const tablePresets = {
  // Compact table for dialogs or small spaces
  compact: {
    dense: true,
    pageSize: 5,
    maxHeight: 300,
    stickyHeader: true,
  },

  // Standard table for main content areas
  standard: {
    dense: false,
    pageSize: 10,
    maxHeight: 500,
    stickyHeader: true,
  },

  // Large table for detailed views
  detailed: {
    dense: false,
    pageSize: 25,
    maxHeight: 700,
    stickyHeader: true,
  },

  // Print-friendly table (no pagination, no sticky header)
  print: {
    dense: true,
    paginated: false,
    searchable: false,
    stickyHeader: false,
  },
};

export default {
  commonColumns,
  tableUtils,
  tablePresets,
};
