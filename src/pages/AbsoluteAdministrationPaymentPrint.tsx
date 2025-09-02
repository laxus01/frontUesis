import { useEffect, useMemo, useState } from 'react';
import { CircularProgress } from '@mui/material';
import api from '../services/http';

interface Vehicle { id: number; plate?: string }
interface Administration {
  id: number;
  date: string; // YYYY-MM-DD
  value: number;
  detail: string;
  payer: string;
  vehicle?: Vehicle;
}

function useQuery() {
  return new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
}

export default function AbsoluteAdministrationPaymentPrint(): JSX.Element {
  const qs = useQuery();
  const idParam = qs.get('id');
  const id = idParam ? Number(idParam) : undefined;

  const [item, setItem] = useState<Administration | null>(null);
  const [loading, setLoading] = useState(false);

  // Company info persisted on login (see auth.service.ts)
  const company = useMemo(() => {
    try {
      const raw = localStorage.getItem('company');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {} as any;
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (id) {
          const res = await api.get<Administration>(`/administrations/${id}`);
          const data = res?.data as any;
          setItem(data || null);
        } else {
          setItem(null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const formatter = useMemo(() => new Intl.NumberFormat('es-CO'), []);

  useEffect(() => {
    if (!loading && item) {
      const t = setTimeout(() => { try { window.print(); } catch {} }, 150);
      return () => clearTimeout(t);
    }
  }, [loading, item]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <CircularProgress size={18} /> Cargando...
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: 16 }}>
        No hay información para imprimir. Abra esta vista desde el botón de impresión de un registro.
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print { .no-print { display: none !important; } }
        body { font-family: Arial, Helvetica, sans-serif; color: #111; }
        .wrap { max-width: 720px; margin: 0 auto; padding: 12px; }
        h1 { font-size: 20px; margin: 0 0 8px; }
        .meta { font-size: 13px; color: #555; margin-bottom: 12px; }
        .row { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-bottom: 8px; }
        .field { font-size: 14px; }
        .label { font-weight: 700; }
        .detail { margin-top: 10px; font-size: 13px; color: #333; white-space: pre-wrap; }
        hr { border: 0; border-top: 1px solid #e5e7eb; margin: 12px 0; }
        .head { text-align: center; margin: 0 auto 12px; }
        .head .l1 { font-size: 16px; font-weight: 700; }
        .head .l2 { font-size: 15px; font-weight: 600; }
        .head .l3 { font-size: 12px; }
        .head .l4 { font-size: 12px; }
        .head .l5 { font-size: 12px; }
      `}</style>

      <div className="wrap">
        <div className="head">
          <div className="l1">COOPERATIVA DE TRANSPORTE DE CONDUCTORES ASOCIADOS DE SINCELEJO</div>
          <div className="l2">COOTRANCAS LTDA" NIT. 823.002.270-7</div>
          <div className="l3">Habilitado segun resolucion 090 de 2001</div>
          <div className="l4">Dirección: {company?.address || '—'}</div>
          <div className="l5">Teléfono: {company?.phone || '—'}</div>
        </div>
        <h1>Consecutivo: {item.id}</h1>
        <div className="meta">Impreso el {new Date().toLocaleString()}</div>
        <hr />
        <div className="row">
          <div className="field"><span className="label">Fecha:</span> {item.date}</div>
        </div>
        <div className="row">
          <div className="field"><span className="label">Valor:</span> ${formatter.format(Number(item.value) || 0)}</div>
        </div>
        <div className="row">
          <div className="field"><span className="label">Pagador:</span> {item.payer || 'NO APLICA'}</div>
        </div>
        {item.vehicle?.plate && (
          <div className="row">
            <div className="field"><span className="label">Placa:</span> {item.vehicle.plate}</div>
          </div>
        )}
        {item.detail && (
          <div className="detail"><span className="label">Detalle:</span> {item.detail}</div>
        )}
      </div>
    </div>
  );
}
