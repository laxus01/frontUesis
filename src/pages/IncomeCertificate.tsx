import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CatalogService, { Option } from '../services/catalog.service';
import api from '../services/http';
import { useNotify } from '../services/notify';
import { formatMoneyInput, moneyToInteger, numberToSpanishWords, toTitleCase } from '../utils/format';
import WithOwnerDialogSelector from '../components/WithOwnerDialogSelector';


export default function IncomeCertificate(): JSX.Element {
  const { success, warning, error } = useNotify();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ownerId, setOwnerId] = useState<number>(0);
  const [owners, setOwners] = useState<Option[]>([]);
  const [amount, setAmount] = useState<string>('');
  const disabledAll = loading || submitting;

  useEffect(() => {
    setLoading(true);
    try {
      const catalogs = CatalogService.getCatalogsFromStorage();
      if (!catalogs) {
        warning('Catálogos no disponibles. Inicia sesión para precargar los catálogos.');
      } else {
        setOwners(catalogs.owners);
      }
    } finally {
      setLoading(false);
    }
  }, []);



  const amountNumber = useMemo(() => moneyToInteger(amount), [amount]);

  const amountWords = useMemo(() => {
    if (!amountNumber || isNaN(amountNumber)) return '';
    const words = numberToSpanishWords(amountNumber);
    if (!words) return '';
    return `${toTitleCase(words)} Pesos MCTE.`;
  }, [amountNumber]);

  const canSubmit = useMemo(() => ownerId > 0 && amountNumber > 0, [ownerId, amountNumber]);

  const onGenerate = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload: any = { amountNumber, amountWords };
      const res = await api.post(`/documents/taxi-certificate/${ownerId}`, payload, { responseType: 'blob' as any });
      const dispo = (res as any)?.headers?.['content-disposition'] || (res as any)?.headers?.['Content-Disposition'];
      let filename = 'income-certificate.pdf';
      if (typeof dispo === 'string') {
        const match = dispo.match(/filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i);
        const raw = decodeURIComponent(match?.[1] || match?.[2] || '');
        if (raw) filename = raw;
      }
      const blob = new Blob([res.data], { type: (res as any)?.headers?.['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      success('Certificado generado');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'No se pudo generar el certificado';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxWidth={900} mx="auto" p={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <DescriptionIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
          Certificación de Ingresos
        </Typography>
      </Box>
      <Box sx={{ height: 3, width: 220, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <WithOwnerDialogSelector
              value={ownerId}
              options={owners}
              onChange={(id) => setOwnerId(id)}
              onCreate={async (payload) => { const created = await CatalogService.createOwner(payload); setOwners(prev => [...prev, created]); return created; }}
              disabled={disabledAll}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Valor"
                  size="small"
                  fullWidth
                  value={amount}
                  onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
                  placeholder="0"
                  type="text"
                  inputMode="decimal"
                  inputProps={{ pattern: "[0-9.,]*" }}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  disabled={disabledAll}
                  required
                />
              </Box>
              <Box sx={{ flex: 2 }}>
                <TextField
                  label="Valor en letras"
                  size="small"
                  fullWidth
                  value={amountWords}
                  disabled
                />
              </Box>
            </Stack>

            <Box display="flex" gap={1}>
              <Button variant="contained" onClick={onGenerate} disabled={!canSubmit || disabledAll}>
                {submitting ? 'Generando...' : 'Generar Certificado'}
              </Button>
              <Button
                variant="outlined"
                disabled={disabledAll}
                onClick={() => { setOwnerId(0); setAmount(''); }}
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
