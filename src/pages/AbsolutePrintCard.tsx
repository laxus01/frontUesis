import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { CircularProgress } from '@mui/material';
import api from '../services/http';

interface Eps {
  id: number;
  name: string;
}

interface Arl {
  id: number;
  name: string;
}

interface Make {
  id: number;
  name: string;
}

interface Insurer {
  id: number;
  name: string;
}

interface CommunicationCompany {
  id: number;
  name: string;
}

interface Owner {
  id: number;
  name: string;
}

interface Driver {
  id: number;
  identification: string;
  issuedIn: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  license: string;
  category: string;
  expiresOn: string;
  bloodType: string;
  photo: string;
  eps: Eps;
  arl: Arl;
}

interface Vehicle {
  id: number;
  plate: string;
  model: string;
  make: Make;
  internalNumber?: string;
  insurer?: Insurer;
  communicationCompany?: CommunicationCompany;
  mobileNumber?: string;
  owner?: Owner;
  company?: Company;
}

interface Company {
  id: number;
  name: string;
  nit: string;
}

interface DriverVehicleRes {
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
  insurer?: string | null;
  internalNumber?: string | number | null;
  driver?: Driver;
  vehicle?: Vehicle;
}

function useQuery() {
  return new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
}

const fmt = (s?: string | null) => {
  if (!s) return '';
  const d = String(s).slice(0, 10);
  return d;
};

export default function AbsolutePrintCard(): JSX.Element {
  const qs = useQuery();
  const dvIdParam = qs.get('dvId');
  const dvId = dvIdParam ? Number(dvIdParam) : undefined;

  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState<DriverVehicleRes | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (dvId) {
          const res = await api.get<DriverVehicleRes>(`/driver-vehicles/by-id/${dvId}`);
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
  }, [dvId]);

  const printableItem = useMemo(() => item, [item]);

  // Auto print when data is ready in a popup window
  useEffect(() => {
    if (!loading && printableItem) {
      const t = setTimeout(() => {
        try { window.print(); } catch {}
      }, 100);
      return () => clearTimeout(t);
    }
  }, [loading, printableItem]);

  return (
    <div>
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          .no-print { display: none !important; }
          .page { break-inside: avoid; page-break-inside: avoid; }
        }
        .canvas {
          position: relative;
          width: 210mm;
          height: 297mm;
          background: #fff;
        }
        .field { position: absolute; font-family: Arial, Helvetica, sans-serif; font-size: 12pt; }
        #qr { top: 60px; right: 0px; font-size: 14pt; }
        #photo { top: 90px; left: 20px; }
        #name { top: 115px; left: 165px; font-size: 14pt; font-weight: 600; }
        #identification { top: 160px; left: 165px; font-size: 14pt; }
        #issuedIn { top: 160px; left: 400px; font-size: 14pt; }
        #category { top: 210px; left: 165px; font-size: 14pt; }
        #expiresOn { top: 210px; left: 300px; font-size: 14pt; }
        #bloodType { top: 210px; left: 450px; font-size: 14pt; }
        #eps { top: 210px; left: 600px; font-size: 14pt; }
        #communicationCompany { top: 275px; left: 20px; font-size: 14pt; }
        #plate { top: 380px; left: 25px; font-size: 20pt; }
        #soat { top: 380px; left: 170px; font-size: 14pt; }
        #soatExpires { top: 380px; left: 500px; font-size: 14pt; }
        #operationCard { top: 430px; left: 170px; font-size: 14pt; }
        #operationCardExpires { top: 430px; left: 500px; font-size: 14pt; }
        #contractualExpires { top: 485px; left: 170px; font-size: 14pt; }
        #extraContractualExpires { top: 485px; left: 360px; font-size: 14pt; }
        #technicalMechanicExpires { top: 485px; left: 550px; font-size: 14pt; }
        #model { top: 560px; left: 20px; font-size: 14pt; }
        #make { top: 560px; left: 380px; font-size: 14pt; }
        #insurer { top: 610px; left: 20px; font-size: 14pt; }
        #licenseNumber { top: 610px; left: 380px; font-size: 14pt; }
        #phone { top: 660px; left: 20px; font-size: 14pt; }
        #ownerPhone { top: 660px; left: 380px; font-size: 14pt; }
        #communicationCompany { top: 220px; left: 1030px; font-size: 14pt; }
        #mobileNumber { top: 265px; left: 1030px; font-size: 14pt; }
        #ownerAddress { top: 290px; left: 1030px; font-size: 14pt; }
        #note { top: 450px; left: 880px; font-size: 12pt; }
        #internalNumber { top: 25px; right: 70px; font-size: 16pt; }
        #permitExpiresOn { top: 700px; left: 150px; font-size: 24pt; }
        #company { top: 275px; left: 20px; font-size: 14pt; }
        #nit_company { top: 275px; left: 460px; font-size: 14pt; }
      `}</style>

      {loading && (
        <div className="no-print" style={{ padding: 16 }}>
          <CircularProgress size={18} /> Cargando...
        </div>
      )}

      {(!loading && !printableItem) && (
        <div className="no-print" style={{ padding: 16 }}>
          No hay datos para imprimir. Abra esta vista desde el botón de impresión de una tarjeta (falta dvId).
        </div>
      )}

      {printableItem && (
        (() => {
          const d: Driver = printableItem.driver || {} as any;
          const v: Vehicle = printableItem.vehicle || {} as any;
          const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ');
          const qrValue = `${v.plate ?? ''}/${d.identification ?? ''}`;
          return (
            <div style={{ marginBottom: '12mm' }}>
              <div>
              {/* QR */}
              <div id="qr" className="field">
                <QRCode value={qrValue} size={96} />
              </div>

              {/* Foto del conductor */}
              <div id="photo" className="field">
                {d.photo ? (
                  <img src={d.photo} alt="Foto" style={{ width: '115px', height: '150px', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#999' }}>FOTO</span>
                )}
              </div>

              {/* Nombre e identificación */}
              <div id="name" className="field">{fullName || '\u2014'}</div>
              <div id="identification" className="field">{d.identification || '\u2014'}</div>
              <div id="issuedIn" className="field">{d.issuedIn || '\u2014'}</div>

              {/* Licencia / salud */}
              <div id="category" className="field">{d.category || '\u2014'}</div>
              <div id="expiresOn" className="field">{fmt(d.expiresOn) || '\u2014'}</div>
              <div id="bloodType" className="field">{d.bloodType || '\u2014'}</div>
              <div id="eps" className="field">{d.eps?.name || '\u2014'}</div>

              {/* Empresa */}
              <div id="company" className="field">{v.company?.name || '\u2014'}</div>
              <div id="nit_company" className="field">{v.company?.nit || '\u2014'}</div>
              
              {/* Vehículo y pólizas */}
              <div id="plate" className="field">{v.plate || '\u2014'}</div>
              <div id="soat" className="field">{printableItem.soat || '\u2014'}</div>
              <div id="soatExpires" className="field">{fmt(printableItem.soatExpires) || '\u2014'}</div>
              <div id="operationCard" className="field">{printableItem.operationCard || '\u2014'}</div>
              <div id="operationCardExpires" className="field">{fmt(printableItem.operationCardExpires) || '\u2014'}</div>
              <div id="contractualExpires" className="field">{fmt(printableItem.contractualExpires) || '\u2014'}</div>
              <div id="extraContractualExpires" className="field">{fmt(printableItem.extraContractualExpires) || '\u2014'}</div>
              <div id="technicalMechanicExpires" className="field">{fmt(printableItem.technicalMechanicExpires) || '\u2014'}</div>

              {/* Especificaciones vehículo */}
              <div id="model" className="field">{v.model || '\u2014'}</div>
              <div id="make" className="field">{v.make?.name || '\u2014'}</div>
              <div id="insurer" className="field">{v.insurer?.name || '\u2014'}</div>
              <div id="licenseNumber" className="field">{d.license || '\u2014'}</div>
              <div id="phone" className="field">{d.phone || '\u2014'}</div>

              {/* Radio / contactos adicionales 
              <div id="communicationCompany" className="field">{v.communicationCompany?.name || '\u2014'}</div>
            */}
            
              {/* Nota y cabecera */}
              <div id="note" className="field">{printableItem.note || '\u2014'}</div>
              <div id="internalNumber" className="field">{printableItem.vehicle?.internalNumber || '\u2014'}</div>
              <div id="permitExpiresOn" className="field">{fmt(printableItem.permitExpiresOn) || '\u2014'}</div>
            </div>
          </div>
          );
        })()
      )}
    </div>
  );
}
