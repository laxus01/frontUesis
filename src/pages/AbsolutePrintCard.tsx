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
  police?: {
    insurer?: Insurer;
    contractual?: string;
    contractualExpires?: string;
    extraContractual?: string;
    extraContractualExpires?: string;
  };
}

interface Company {
  id: number;
  name: string;
  nit: string;
  phone: string;
  address: string;
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
  const [photoReady, setPhotoReady] = useState(false);
  const [hasPrinted, setHasPrinted] = useState(false);

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

  // Auto print when data (and photo, if any) is ready in a popup window
  useEffect(() => {
    const hasPhoto = !!printableItem?.driver?.photo;
    const canPrint = !loading && printableItem && (!hasPhoto || photoReady) && !hasPrinted;

    if (canPrint) {
      const t = setTimeout(() => {
        try {
          window.print();
          setHasPrinted(true);
        } catch { }
      }, 100);
      return () => clearTimeout(t);
    }
  }, [loading, printableItem, photoReady, hasPrinted]);

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
        #qr { top: 110px; right: 60px; font-size: 14pt; }
        #photo { top: 130px; left: 40px; }
        #name { top: 150px; left: 195px; font-size: 14pt; font-weight: 600; }
        #identification { top: 195px; left: 195px; font-size: 14pt; }
        #issuedIn { top: 195px; left: 430px; font-size: 14pt; }
        #category { top: 245px; left: 195px; font-size: 14pt; }
        #expiresOn { top: 245px; left: 340px; font-size: 14pt; }
        #bloodType { top: 245px; left: 490px; font-size: 14pt; }
        #eps { top: 245px; left: 640px; font-size: 14pt; }
        #communicationCompany { top: 310px; left: 50px; font-size: 14pt; }
        #plate { top: 415px; left: 55px; font-size: 20pt; }
        #soat { top: 415px; left: 210px; font-size: 14pt; }
        #soatExpires { top: 415px; left: 540px; font-size: 14pt; }
        #operationCard { top: 465px; left: 210px; font-size: 14pt; }
        #operationCardExpires { top: 465px; left: 540px; font-size: 14pt; }
        #contractualExpires { top: 520px; left: 210px; font-size: 14pt; }
        #extraContractualExpires { top: 520px; left: 400px; font-size: 14pt; }
        #technicalMechanicExpires { top: 520px; left: 580px; font-size: 14pt; }
        #model { top: 595px; left: 55px; font-size: 14pt; }
        #make { top: 595px; left: 410px; font-size: 14pt; }
        #insurer { top: 645px; left: 55px; font-size: 14pt; }
        #licenseNumber { top: 645px; left: 410px; font-size: 14pt; }
        #phone { top: 695px; left: 55px; font-size: 14pt; }
        #ownerPhone { top: 695px; left: 410px; font-size: 14pt; }
        #communicationCompany { top: 255px; left: 1060px; font-size: 14pt; }
        #mobileNumber { top: 300px; left: 1060px; font-size: 14pt; }
        #ownerAddress { top: 325px; left: 1060px; font-size: 14pt; }
        #note { top: 485px; left: 910px; font-size: 12pt; }
        #internalNumber { top: 60px; right: 70px; font-size: 16pt; }
        #permitExpiresOn { top: 735px; left: 180px; font-size: 24pt; }
        #company { top: 310px; left: 55px; font-size: 14pt; }
        #nit_company { top: 310px; left: 495px; font-size: 14pt; }
        #phone_company { top: 355px; left: 495px; font-size: 14pt; }
        #address_company { top: 355px; left: 55px; font-size: 14pt; }
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
          const driver: Driver = printableItem.driver || {} as any;
          const vehicle: Vehicle = printableItem.vehicle || {} as any;
          const fullName = [driver.firstName, driver.lastName].filter(Boolean).join(' ');
          const qrValue = `${vehicle.plate ?? ''}/${driver.identification ?? ''}`;
          return (
            <div style={{ marginBottom: '12mm' }}>
              <div>
                {/* QR */}
                <div id="qr" className="field">
                  <QRCode value={qrValue} size={96} />
                </div>

                {/* Foto del conductor */}
                <div id="photo" className="field">
                  {driver.photo ? (
                    <img
                      src={driver.photo}
                      alt="Foto"
                      style={{ width: '115px', height: '150px', objectFit: 'cover' }}
                      onLoad={() => setPhotoReady(true)}
                      onError={() => setPhotoReady(true)}
                    />
                  ) : (
                    <span style={{ color: '#999' }}>FOTO</span>
                  )}
                </div>

                {/* Nombre e identificación */}
                <div id="name" className="field">{fullName || '\u2014'}</div>
                <div id="identification" className="field">{driver.identification || '\u2014'}</div>
                <div id="issuedIn" className="field">{driver.issuedIn || '\u2014'}</div>

                {/* Licencia / salud */}
                <div id="category" className="field">{driver.category || '\u2014'}</div>
                <div id="expiresOn" className="field">{fmt(driver.expiresOn) || '\u2014'}</div>
                <div id="bloodType" className="field">{driver.bloodType || '\u2014'}</div>
                <div id="eps" className="field">{driver.eps?.name || '\u2014'}</div>

                {/* Empresa */}
                <div id="company" className="field">{vehicle.company?.name || '\u2014'}</div>
                <div id="nit_company" className="field">{vehicle.company?.nit || '\u2014'}</div>
                <div id="phone_company" className="field">{vehicle.company?.phone || '\u2014'}</div>
                <div id="address_company" className="field">{vehicle.company?.address || '\u2014'}</div>

                {/* Vehículo y pólizas */}
                <div id="plate" className="field">{vehicle.plate || '\u2014'}</div>
                <div id="soat" className="field">{printableItem.soat || '\u2014'}</div>
                <div id="soatExpires" className="field">{fmt(printableItem.soatExpires) || '\u2014'}</div>
                <div id="operationCard" className="field">{printableItem.operationCard || '\u2014'}</div>
                <div id="operationCardExpires" className="field">{fmt(printableItem.operationCardExpires) || '\u2014'}</div>
                <div id="contractualExpires" className="field">{fmt(vehicle.police?.contractualExpires) || '\u2014'}</div>
                <div id="extraContractualExpires" className="field">{fmt(vehicle.police?.extraContractualExpires) || '\u2014'}</div>
                <div id="technicalMechanicExpires" className="field">{fmt(printableItem.technicalMechanicExpires) || '\u2014'}</div>

                {/* Especificaciones vehículo */}
                <div id="model" className="field">{vehicle.model || '\u2014'}</div>
                <div id="make" className="field">{vehicle.make?.name || '\u2014'}</div>
                <div id="insurer" className="field">{vehicle.police?.insurer?.name || '\u2014'}</div>
                <div id="licenseNumber" className="field">{driver.license || '\u2014'}</div>
                <div id="phone" className="field">{driver.phone || '\u2014'}</div>

                {/* Radio / contactos adicionales 
              <div id="communicationCompany" className="field">{v.communicationCompany?.name || '\u2014'}</div>
            */}

                {/* Nota y cabecera */}
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
