import React, { useState, useMemo } from 'react';
import api from '../../services/http';
import { useNotify } from '../../services/notify';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TableFooter,
  Paper,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';

export interface TableColumn<T = any> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  searchable?: boolean;
  format?: (value: any, row: T) => React.ReactNode;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableAction<T = any> {
  label: string;
  icon: React.ReactNode;
  onClick: (row: T) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  disabled?: (row: T) => boolean;
  show?: (row: T) => boolean;
}

export interface ExportConfig {
  endpoint: string;
  filename: string;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  actions?: TableAction<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  title?: string;
  searchPlaceholder?: string;
  dense?: boolean;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  rowKey?: keyof T | ((row: T) => string | number);
  exportConfig?: ExportConfig;
}

type Order = 'asc' | 'desc';

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  sortable = true,
  paginated = true,
  pageSize = 10,
  actions = [],
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  title,
  searchPlaceholder = 'Buscar...',
  dense = false,
  stickyHeader = false,
  maxHeight = 400,
  rowKey = 'id',
  exportConfig,
}: DataTableProps<T>): JSX.Element {
  const { success, error } = useNotify();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [orderBy, setOrderBy] = useState<keyof T | string>('');
  const [order, setOrder] = useState<Order>('asc');
  const [page, setPage] = useState<number>(1);
  const [exporting, setExporting] = useState<boolean>(false);

  // Get row key function
  const getRowKey = useMemo(() => {
    if (typeof rowKey === 'function') {
      return rowKey;
    }
    return (row: T) => row[rowKey] as string | number;
  }, [rowKey]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm.trim()) {
      return data;
    }

    const searchLower = searchTerm.toLowerCase();
    const searchableColumns = columns.filter(col => col.searchable !== false);

    return data.filter((row) =>
      searchableColumns.some((column) => {
        const value = row[column.id as keyof T];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [data, searchTerm, searchable, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortable || !orderBy) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aValue = a[orderBy as keyof T];
      const bValue = b[orderBy as keyof T];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return order === 'asc' ? 1 : -1;
      if (bValue == null) return order === 'asc' ? -1 : 1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, orderBy, order, sortable]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) {
      return sortedData;
    }

    const startIndex = (page - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, page, pageSize, paginated]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnId: keyof T | string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable && sortable) return;

    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleExport = async () => {
    if (!exportConfig) return;
    
    setExporting(true);
    try {
      console.log('Exporting data from:', exportConfig.endpoint);
      
      const res = await api.get(exportConfig.endpoint, { responseType: 'blob' as any });
      
      // Handle filename from response headers
      const dispo = (res as any)?.headers?.['content-disposition'] || (res as any)?.headers?.['Content-Disposition'];
      let finalFilename = exportConfig.filename;
      if (typeof dispo === 'string') {
        const match = dispo.match(/filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i);
        const raw = decodeURIComponent(match?.[1] || match?.[2] || '');
        if (raw) finalFilename = raw;
      }
      
      // Create and download the file
      const blob = new Blob([res.data], { type: (res as any)?.headers?.['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      success('Datos exportados exitosamente');
    } catch (e: any) {
      console.error('Export error:', e);
      const msg = e?.response?.data?.message || 'No se pudo exportar los datos';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setExporting(false);
    }
  };

  const renderCellContent = (column: TableColumn<T>, row: T) => {
    const value = row[column.id as keyof T];

    if (column.render) {
      return column.render(value, row);
    }

    if (column.format) {
      return column.format(value, row);
    }

    if (value == null) {
      return '-';
    }

    if (typeof value === 'boolean') {
      return (
        <Chip
          label={value ? 'Sí' : 'No'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      );
    }

    return String(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
      )}

      {searchable && (
        <Box mb={2}>
          <TextField
            fullWidth
            size="small"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}

      <TableContainer
        component={Paper}
        sx={{
          maxHeight: stickyHeader ? maxHeight : undefined,
          overflow: stickyHeader ? 'auto' : undefined,
        }}
      >
        <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  {sortable && column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="center" style={{ minWidth: actions.length * 50 }}>
                  Acciones
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow
                  key={getRowKey(row)}
                  hover={!!onRowClick}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.id)}
                      align={column.align || 'left'}
                    >
                      {renderCellContent(column, row)}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        {actions
                          .filter(action => !action.show || action.show(row))
                          .map((action, index) => (
                            <Tooltip key={index} title={action.label}>
                              <span>
                                <IconButton
                                  size="small"
                                  color={action.color || 'primary'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(row);
                                  }}
                                  disabled={action.disabled ? action.disabled(row) : false}
                                >
                                  {action.icon}
                                </IconButton>
                              </span>
                            </Tooltip>
                          ))}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
          
          {(paginated || exportConfig) && (
            <TableFooter>
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  sx={{ 
                    borderTop: '1px solid rgba(224, 224, 224, 1)',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    py: 1.5
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    {/* Left: Pagination */}
                    <Box display="flex" alignItems="center">
                      {paginated && totalPages > 1 && (
                        <Pagination
                          count={totalPages}
                          page={page}
                          onChange={handlePageChange}
                          color="primary"
                          showFirstButton
                          showLastButton
                          size="small"
                          siblingCount={1}
                          boundaryCount={1}
                        />
                      )}
                    </Box>
                    
                    {/* Center: Records description */}
                    <Box display="flex" alignItems="center" justifyContent="center" flex={1}>
                      <Typography variant="caption" color="text.secondary" textAlign="center">
                        {paginated ? (
                          <>
                            Mostrando {Math.min((page - 1) * pageSize + 1, sortedData.length)}-{Math.min(page * pageSize, sortedData.length)} de {sortedData.length} registros
                            {searchTerm && ` (filtrados de ${data.length} total)`}
                          </>
                        ) : (
                          `${sortedData.length} registros${searchTerm ? ` (filtrados de ${data.length} total)` : ''}`
                        )}
                      </Typography>
                    </Box>
                    
                    {/* Right: Export button */}
                    <Box display="flex" alignItems="center">
                      {exportConfig && (
                        <Button
                          size="small"
                          color="primary"
                          variant="outlined"
                          startIcon={<FileDownloadIcon />}
                          onClick={handleExport}
                          disabled={exporting || loading}
                        >
                          {exporting ? 'Exportando...' : 'Exportar'}
                        </Button>
                      )}
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
    </Box>
  );
}

// Pre-configured action buttons for common use cases
export const tableActions = {
  view: (onClick: (row: any) => void): TableAction => ({
    label: 'Ver',
    icon: <ViewIcon />,
    onClick,
    color: 'info' as const,
  }),
  edit: (onClick: (row: any) => void): TableAction => ({
    label: 'Editar',
    icon: <EditIcon />,
    onClick,
    color: 'primary' as const,
  }),
  delete: (onClick: (row: any) => void): TableAction => ({
    label: 'Eliminar',
    icon: <DeleteIcon />,
    onClick,
    color: 'error' as const,
  }),
};

export default DataTable;
