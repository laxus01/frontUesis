import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  TextField,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import DriverStateHistoryService, {
  DriverStateHistoryRecord,
} from '../../services/driver-state-history.service';
import { useNotify } from '../../services/notify';

interface DriverStateHistoryModalProps {
  open: boolean;
  onClose: () => void;
  driverId: number;
  driverName: string;
}

const getStateLabel = (state: number): string => {
  switch (state) {
    case 1:
      return 'Activo';
    case 0:
      return 'Inactivo';
    default:
      return `Estado ${state}`;
  }
};

const getStateColor = (state: number): 'success' | 'error' | 'default' => {
  switch (state) {
    case 1:
      return 'success';
    case 0:
      return 'error';
    default:
      return 'default';
  }
};

export default function DriverStateHistoryModal({
  open,
  onClose,
  driverId,
  driverName,
}: DriverStateHistoryModalProps) {
  const [history, setHistory] = useState<DriverStateHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<DriverStateHistoryRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<DriverStateHistoryRecord | null>(null);
  const [editedReason, setEditedReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const { success, error: notifyError } = useNotify();

  const fetchHistory = async () => {
    if (!driverId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await DriverStateHistoryService.getDriverStateHistory(driverId);
      setHistory(data);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error al cargar el historial';
      setError(Array.isArray(message) ? message.join('\n') : String(message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && driverId) {
      fetchHistory();
    }
  }, [open, driverId]);

  const handleDeleteClick = (record: DriverStateHistoryRecord) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    setDeleting(true);
    try {
      await DriverStateHistoryService.deleteDriverStateHistoryRecord(recordToDelete.id);
      success('Registro eliminado exitosamente');
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      fetchHistory();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error al eliminar el registro';
      notifyError(Array.isArray(message) ? message.join('\n') : String(message));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  const handleEditClick = (record: DriverStateHistoryRecord) => {
    setRecordToEdit(record);
    setEditedReason(record.reason);
    setEditDialogOpen(true);
  };

  const handleEditConfirm = async () => {
    if (!recordToEdit || !editedReason.trim()) return;

    setUpdating(true);
    try {
      await DriverStateHistoryService.updateDriverStateHistoryReason(
        recordToEdit.id,
        editedReason.trim()
      );
      success('Razón actualizada exitosamente');
      setEditDialogOpen(false);
      setRecordToEdit(null);
      setEditedReason('');
      fetchHistory();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error al actualizar la razón';
      notifyError(Array.isArray(message) ? message.join('\n') : String(message));
    } finally {
      setUpdating(false);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setRecordToEdit(null);
    setEditedReason('');
  };

  const handleClose = () => {
    setHistory([]);
    setError(null);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '60vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <HistoryIcon color="primary" />
              <Box>
                <Typography variant="h6" component="div">
                  Historial de Estados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {driverName}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && history.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No hay registros de cambios de estado para este conductor
              </Typography>
            </Box>
          )}

          {!loading && !error && history.length > 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Estado Anterior</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Nuevo Estado</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Razón</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((record, index) => {
                    const isFirstRecord = index === 0;
                    const canDelete = !isFirstRecord;
                    
                    return (
                      <TableRow key={record.id} hover>
                        <TableCell>
                          {new Date(record.createdAt).toLocaleString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStateLabel(record.previousState)}
                            color={getStateColor(record.previousState)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStateLabel(record.newState)}
                            color={getStateColor(record.newState)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 400 }}>
                            {record.reason}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar razón">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditClick(record)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip 
                            title={
                              canDelete 
                                ? "Eliminar registro" 
                                : "No se puede eliminar el registro más reciente (estado actual del conductor)"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(record)}
                                disabled={!canDelete}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Reason Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Razón del Cambio</DialogTitle>
        <DialogContent>
          {recordToEdit && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Fecha:</strong>{' '}
                  {new Date(recordToEdit.createdAt).toLocaleString('es-ES')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  <strong>Cambio:</strong> {getStateLabel(recordToEdit.previousState)} →{' '}
                  {getStateLabel(recordToEdit.newState)}
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Razón"
                value={editedReason}
                onChange={(e) => setEditedReason(e.target.value)}
                placeholder="Ingrese la razón del cambio de estado..."
                required
                autoFocus
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel} disabled={updating}>
            Cancelar
          </Button>
          <Button
            onClick={handleEditConfirm}
            color="primary"
            variant="contained"
            disabled={updating || !editedReason.trim()}
          >
            {updating ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar este registro del historial?
          </Typography>
          {recordToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Fecha:</strong>{' '}
                {new Date(recordToDelete.createdAt).toLocaleString('es-ES')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                <strong>Cambio:</strong> {getStateLabel(recordToDelete.previousState)} →{' '}
                {getStateLabel(recordToDelete.newState)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                <strong>Razón:</strong> {recordToDelete.reason}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
