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

// Owner selector with search/create modal (based on Vehicles.tsx)
type WithOwnerDialogSelectorProps = {
  value: number;
  options: Option[];
  onChange: (id: number) => void;
  disabled?: boolean;
};

function WithOwnerDialogSelector({ value, options, onChange, disabled }: WithOwnerDialogSelectorProps) {
  return (
    <Box sx={{ flex: 1 }}>
      <Autocomplete
        options={options}
        value={options.find(o => o.id === value) || null}
        getOptionLabel={(o) => o?.name ?? ''}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        onChange={(event, newValue) => onChange(newValue ? newValue.id : 0)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Propietario"
            size="small"
            required
            fullWidth
          />
        )}
        disabled={disabled}
      />
    </Box>
  );
}

// Number to words (Spanish) for amount display
function numberToSpanishWords(num: number): string {
  if (!isFinite(num)) return '';
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const toWords999 = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cien';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    let parts: string[] = [];
    if (c) parts.push(centenas[c]);
    if (d === 1) {
      parts.push(especiales[u]);
    } else if (d === 2) {
      if (u === 0) parts.push('veinte'); else parts.push('veinti' + (u === 2 ? 'dós' : u === 3 ? 'trés' : unidades[u]));
    } else if (d > 2) {
      if (u === 0) parts.push(decenas[d]); else parts.push(`${decenas[d]} y ${unidades[u]}`);
    } else if (u) {
      parts.push(unidades[u]);
    }
    return parts.join(' ').trim();
  };

  const toWords = (n: number): string => {
    if (n === 0) return 'cero';
    let words: string[] = [];
    const millones = Math.floor(n / 1_000_000);
    const miles = Math.floor((n % 1_000_000) / 1000);
    const resto = n % 1000;
    if (millones) {
      words.push(millones === 1 ? 'un millón' : `${toWords(millones)} millones`);
    }
    if (miles) {
      words.push(miles === 1 ? 'mil' : `${toWords999(miles)} mil`);
    }
    if (resto) {
      words.push(toWords999(resto));
    }
    return words.join(' ').trim();
  };

  const entero = Math.floor(Math.abs(num));
  const centavos = Math.round((Math.abs(num) - entero) * 100);
  let texto = toWords(entero);
  texto = texto.replace(/\buno\b/g, 'un');
  return centavos > 0 ? `${texto} con ${centavos.toString().padStart(2, '0')}/100` : texto;
}

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

  // Formatea solo enteros con separador de miles (es-CO). No permite decimales
  const formatMoneyInput = (input: string): string => {
    if (!input) return '';
    const digits = input.replace(/\D/g, '');
    if (!digits) return '';
    const n = Number(digits);
    return new Intl.NumberFormat('es-CO').format(n);
  };

  // Convierte a entero: elimina puntos y descarta decimales (no aplican aquí)
  const moneyToInteger = (s: string): number => {
    if (!s) return 0;
    const noThousands = s.replace(/\./g, '');
    const intPart = noThousands.split(',')[0] || '';
    const digits = intPart.replace(/[^0-9]/g, '');
    const n = Number(digits || '0');
    return isNaN(n) ? 0 : n;
  };

  const amountNumber = useMemo(() => moneyToInteger(amount), [amount]);

  const toTitleCase = (s: string): string => s.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
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
