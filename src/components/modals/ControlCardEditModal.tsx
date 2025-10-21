import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import api from '../../services/http';
import { useNotify } from '../../services/notify';

interface ControlCardData {
  id: number;
  permitExpiresOn?: string | null;
  note?: string | null;
  soat?: string | null;
  soatExpires?: string | null;
  operationCard?: string | null;
  operationCardExpires?: string | null;
  contractualExpires?: string | null;
  extraContractualExpires?: string | null;
  technicalMechanicExpires?: string | null;
  driver?: {
    id: number;
    expiresOn?: string | null;
  };
}

interface ControlCardEditModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  controlCardData: ControlCardData | null;
}

export default function ControlCardEditModal({
  open,
  onClose,
  onSuccess,
  controlCardData,
}: ControlCardEditModalProps): JSX.Element {
  const { success, error } = useNotify();
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [permitExpiresOn, setPermitExpiresOn] = useState<Dayjs | null>(null);
  const [driverExpiresOn, setDriverExpiresOn] = useState<Dayjs | null>(null);
  const [soat, setSoat] = useState('');
  const [soatExpires, setSoatExpires] = useState<Dayjs | null>(null);
  const [operationCard, setOperationCard] = useState('');
  const [operationCardExpires, setOperationCardExpires] = useState<Dayjs | null>(null);
  const [contractualExpires, setContractualExpires] = useState<Dayjs | null>(null);
  const [extraContractualExpires, setExtraContractualExpires] = useState<Dayjs | null>(null);
  const [technicalMechanicExpires, setTechnicalMechanicExpires] = useState<Dayjs | null>(null);
  
  // Original values to track changes
  const [originalDriverExpiresOn, setOriginalDriverExpiresOn] = useState<string | null>(null);

  // Calculate maximum allowed date for permitExpiresOn based on the earliest expiration date from other documents
  const maxPermitDate = useMemo(() => {
    const expirationDates = [
      soatExpires,
      operationCardExpires,
      contractualExpires,
      extraContractualExpires,
      technicalMechanicExpires
    ].filter(date => date !== null) as Dayjs[];

    if (expirationDates.length === 0) {
      // If no expiration dates are set, allow up to 1 year from now
      return dayjs().add(1, 'year');
    }

    // Return the earliest expiration date as the maximum allowed
    return expirationDates.reduce((earliest, current) => 
      current.isBefore(earliest) ? current : earliest
    );
  }, [soatExpires, operationCardExpires, contractualExpires, extraContractualExpires, technicalMechanicExpires]);

  // Auto-adjust permitExpiresOn if it exceeds the maximum allowed date
  useEffect(() => {
    if (permitExpiresOn && permitExpiresOn.isAfter(maxPermitDate)) {
      setPermitExpiresOn(maxPermitDate);
    }
  }, [maxPermitDate, permitExpiresOn]);

  // Helper function to parse date strings
  const parseDate = (dateStr?: string | null): Dayjs | null => {
    if (!dateStr) return null;
    try {
      return dayjs(dateStr);
    } catch {
      return null;
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (open && controlCardData) {
      setPermitExpiresOn(parseDate(controlCardData.permitExpiresOn));
      const driverExpires = controlCardData.driver?.expiresOn;
      setDriverExpiresOn(parseDate(driverExpires));
      setOriginalDriverExpiresOn(driverExpires || null);
      setSoat(controlCardData.soat || '');
      setSoatExpires(parseDate(controlCardData.soatExpires));
      setOperationCard(controlCardData.operationCard || '');
      setOperationCardExpires(parseDate(controlCardData.operationCardExpires));
      
      // Load insurance dates from controlCardData or fallback to company storage
      let contractual = parseDate(controlCardData.contractualExpires);
      let extraContractual = parseDate(controlCardData.extraContractualExpires);
      
      // If not present in controlCardData, try to load from company storage
      if (!contractual || !extraContractual) {
        try {
          const rawCompany = localStorage.getItem('company');
          if (rawCompany) {
            const company = JSON.parse(rawCompany);
            if (!contractual && company.contractualExpires) {
              contractual = parseDate(company.contractualExpires);
            }
            if (!extraContractual && company.extraContractualExpires) {
              extraContractual = parseDate(company.extraContractualExpires);
            }
          }
        } catch (e) {
          console.error('Error loading company insurance dates', e);
        }
      }
      
      setContractualExpires(contractual);
      setExtraContractualExpires(extraContractual);
      setTechnicalMechanicExpires(parseDate(controlCardData.technicalMechanicExpires));
    }
  }, [open, controlCardData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setPermitExpiresOn(null);
      setDriverExpiresOn(null);
      setOriginalDriverExpiresOn(null);
      setSoat('');
      setSoatExpires(null);
      setOperationCard('');
      setOperationCardExpires(null);
      setContractualExpires(null);
      setExtraContractualExpires(null);
      setTechnicalMechanicExpires(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!controlCardData) return;

    const formatDate = (date: Dayjs | null): string | undefined => {
      return date ? date.format('YYYY-MM-DD') : undefined;
    };

    const driverVehiclePayload = {
      permitExpiresOn: formatDate(permitExpiresOn),
      soat: soat.trim() || undefined,
      soatExpires: formatDate(soatExpires),
      operationCard: operationCard.trim() || undefined,
      operationCardExpires: formatDate(operationCardExpires),
      contractualExpires: formatDate(contractualExpires),
      extraContractualExpires: formatDate(extraContractualExpires),
      technicalMechanicExpires: formatDate(technicalMechanicExpires),
    };

    setSubmitting(true);
    try {
      // Update driver-vehicle data
      await api.put(`/driver-vehicles/${controlCardData.id}`, driverVehiclePayload);
      
      // Check if driver license expiration date changed
      const newDriverExpiresOn = formatDate(driverExpiresOn);
      if (newDriverExpiresOn !== originalDriverExpiresOn && controlCardData.driver?.id) {
        // Update driver data separately
        const driverPayload = {
          expiresOn: newDriverExpiresOn,
        };
        await api.put(`/drivers/${controlCardData.driver.id}`, driverPayload);
      }
      
      success('Tarjeta de control actualizada correctamente');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'No se pudo actualizar la tarjeta de control';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        Editar Tarjeta de Control
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Permit Expiration and Note */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <DatePicker
                label="Permiso vence"
                value={permitExpiresOn}
                onChange={(v) => setPermitExpiresOn(v)}
                format="YYYY-MM-DD"
                minDate={dayjs()}
                maxDate={maxPermitDate}
                slotProps={{ 
                  textField: { 
                    size: 'small', 
                    fullWidth: true,
                    disabled: submitting,
                    required: true
                  } 
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <DatePicker
                label="Vencimiento Licencia"
                value={driverExpiresOn}
                onChange={(v) => setDriverExpiresOn(v)}
                format="YYYY-MM-DD"
                slotProps={{ 
                  textField: { 
                    size: 'small', 
                    fullWidth: true,
                    disabled: submitting
                  } 
                }}
              />
            </Box>
          </Stack>

          {/* SOAT Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
              SOAT
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Número SOAT"
                  size="small"
                  fullWidth
                  value={soat}
                  onChange={e => setSoat(e.target.value)}
                  inputProps={{ maxLength: 60 }}
                  disabled={submitting}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <DatePicker
                  label="SOAT vence"
                  value={soatExpires}
                  onChange={(v) => setSoatExpires(v)}
                  format="YYYY-MM-DD"
                  slotProps={{ 
                    textField: { 
                      size: 'small', 
                      fullWidth: true,
                      disabled: submitting
                    } 
                  }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Operation Card Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
              TARJETA DE OPERACIÓN
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Número Tarjeta de Operación"
                  size="small"
                  fullWidth
                  value={operationCard}
                  onChange={e => setOperationCard(e.target.value)}
                  inputProps={{ maxLength: 60 }}
                  disabled={submitting}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <DatePicker
                  label="Tarjeta de Operación vence"
                  value={operationCardExpires}
                  onChange={(v) => setOperationCardExpires(v)}
                  format="YYYY-MM-DD"
                  slotProps={{ 
                    textField: { 
                      size: 'small', 
                      fullWidth: true,
                      disabled: submitting
                    } 
                  }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Other Documents Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
              OTROS DOCUMENTOS
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <DatePicker
                  label="Contractual vence"
                  value={contractualExpires}
                  onChange={(v) => setContractualExpires(v)}
                  format="YYYY-MM-DD"
                  slotProps={{ 
                    textField: { 
                      size: 'small', 
                      fullWidth: true,
                      disabled: submitting
                    } 
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <DatePicker
                  label="Extracontractual vence"
                  value={extraContractualExpires}
                  onChange={(v) => setExtraContractualExpires(v)}
                  format="YYYY-MM-DD"
                  slotProps={{ 
                    textField: { 
                      size: 'small', 
                      fullWidth: true,
                      disabled: submitting
                    } 
                  }}
                />
              </Box>
            <Box sx={{ mt: 1 }}>
              <DatePicker
                label="Tecnomecánica vence"
                value={technicalMechanicExpires}
                onChange={(v) => setTechnicalMechanicExpires(v)}
                format="YYYY-MM-DD"
                slotProps={{ 
                  textField: { 
                    size: 'small', 
                    fullWidth: true,
                    disabled: submitting
                  } 
                }}
              />
            </Box>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={submitting}
        >
          {submitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
