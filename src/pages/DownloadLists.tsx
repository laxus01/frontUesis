import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { useNotify } from '../services/notify';
import api from '../services/http';

type DocumentType = 'VEHICULOS' | 'CONDUCTORES' | 'PROPIETARIOS' | '';

export default function ExportLists(): JSX.Element {
  const { success, error } = useNotify();
  const [submitting, setSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('');

  const disabledAll = submitting;

  const handleDocumentTypeChange = (event: SelectChangeEvent) => {
    setDocumentType(event.target.value as DocumentType);
  };

  const getEndpointAndFilename = (type: DocumentType) => {
    const companyIdStr = localStorage.getItem('companyId');
    const companyId = companyIdStr ? Number(companyIdStr) : 1;
    
    switch (type) {
      case 'VEHICULOS':
        return { endpoint: `/vehicles/export/excel?companyId=${companyId}`, filename: 'listado-vehiculos.xlsx' };
      case 'CONDUCTORES':
        return { endpoint: '/drivers/export/excel', filename: 'listado-conductores.xlsx' };
      case 'PROPIETARIOS':
        return { endpoint: '/owner/export/excel', filename: 'listado-propietarios.xlsx' };
      default:
        return { endpoint: '', filename: '' };
    }
  };

  const onGenerate = async () => {
    if (!documentType) return;
    
    setSubmitting(true);
    try {
      const { endpoint, filename } = getEndpointAndFilename(documentType);
      
      const res = await api.get(endpoint, { responseType: 'blob' as any });
      
      // Handle filename from response headers
      const dispo = (res as any)?.headers?.['content-disposition'] || (res as any)?.headers?.['Content-Disposition'];
      let finalFilename = filename;
      if (typeof dispo === 'string') {
        const match = dispo.match(/filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i);
        const raw = decodeURIComponent(match?.[1] || match?.[2] || '');
        if (raw) finalFilename = raw;
      }
      
      // Create and download the file
      const blob = new Blob([res.data], { type: (res as any)?.headers?.['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      success('Listado generado y exportado exitosamente');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'No se pudo exportar el listado';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = documentType !== '';

  const resetForm = () => {
    setDocumentType('');
  };

  return (
    <Box maxWidth={900} mx="auto" p={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#1976d2' }}>file_export</span>
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
          Exportar Listados
        </Typography>
      </Box>
      <Box sx={{ height: 3, width: 220, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Seleccionar tipo
            </Typography>
            
            <FormControl fullWidth size="small" required>
              <InputLabel id="document-type-label">Tipo</InputLabel>
              <Select
                labelId="document-type-label"
                id="document-type-select"
                value={documentType}
                label="Tipo de documento"
                onChange={handleDocumentTypeChange}
                disabled={disabledAll}
              >
                <MenuItem value="VEHICULOS">Listado de Vehículos</MenuItem>
                <MenuItem value="CONDUCTORES">Listado de Conductores</MenuItem>
                <MenuItem value="PROPIETARIOS">Listado de Propietarios</MenuItem>
              </Select>
            </FormControl>

            <Box display="flex" gap={1}>
              <Button 
                variant="contained" 
                onClick={onGenerate} 
                disabled={!canSubmit || disabledAll}
                startIcon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>file_export</span>}
              >
                {submitting ? 'Exportando...' : 'Exportar'}
              </Button>
              <Button
                variant="outlined"
                disabled={disabledAll}
                onClick={resetForm}
              >
                Limpiar
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
