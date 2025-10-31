import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { Home as HomeIcon } from '@mui/icons-material';

interface CompanyInfo {
  id?: number | string;
  name?: string;
  nit?: string;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  [key: string]: any;
}

const Home: React.FC = () => {
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    // Intenta leer 'company' directo
    const rawCompany = localStorage.getItem('company');
    if (rawCompany) {
      try {
        const c = JSON.parse(rawCompany);
        setCompany(c || null);
      } catch {}
    } else {
      // Fallback: extraer desde 'user'
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        try {
          const u = JSON.parse(rawUser);
          const c = u?.user?.company || null;
          setCompany(c || null);
        } catch {
          setCompany(null);
        }
      }
    }
  }, []);


  const Field: React.FC<{ label: string; value?: any }> = ({ label, value }) => (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value ? String(value) : '-'}</Typography>
    </Stack>
  );

  return (
    <Box maxWidth={900} mx="auto" p={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <HomeIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
          Inicio
        </Typography>
      </Box>
      <Box sx={{ height: 3, width: 100, bgcolor: 'primary.main', borderRadius: 1, mb: 2 }} />
      
      {company && (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Información de la empresa
              </Typography>
              <Stack spacing={1}>
                <Field label="Nombre" value={company.name || company.razonSocial} />
                <Field label="NIT" value={company.nit || company.taxId} />
                <Field label="Dirección" value={company.address || company.direccion} />
                <Field label="Teléfono" value={company.phone || company.telefono} />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
};

export default Home;
