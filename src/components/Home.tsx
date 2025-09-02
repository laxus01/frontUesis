import React, { useEffect, useState } from 'react';

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
        return;
      } catch {}
    }
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
  }, []);

  const Field: React.FC<{ label: string; value?: any }> = ({ label, value }) => (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value ? String(value) : '-'}</span>
    </div>
  );

  return (
    <div className="w-full mt-0 px-0">
      <div className="w-full rounded-none bg-white p-6 shadow">
        <h3 className="mb-1 text-xl font-semibold">Inicio</h3>
        <p className="text-sm text-gray-600 mb-4">Has iniciado sesión correctamente.</p>

        <h4 className="text-base font-semibold mb-2">Información de la empresa</h4>
        {company ? (
          <div className="rounded border border-gray-200 p-4 bg-white">
            <Field label="Nombre" value={company.name || company.razonSocial} />
            <Field label="NIT" value={company.nit || company.taxId} />
            <Field label="Dirección" value={company.address || company.direccion} />
            <Field label="Teléfono" value={company.phone || company.telefono} />
          </div>
        ) : (
          <p className="text-sm text-gray-600">No se encontró información de la empresa en el almacenamiento.</p>
        )}
      </div>
    </div>
  );
};

export default Home;
