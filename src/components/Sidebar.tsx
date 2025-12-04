import React, { useEffect, useState } from 'react';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { NavLink } from 'react-router-dom';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlagiarismOutlinedIcon from '@mui/icons-material/PlagiarismOutlined';
import CarCrashIcon from '@mui/icons-material/CarCrash';
import { useAuth } from '../hooks/useAuth';

type SidebarProps = {
  onItemClick?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const { canManageData, isAdmin } = useAuth();
  const linkBase =
    'flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100';
  const linkActive = 'bg-blue-50 text-blue-700 font-medium';
  const [reportsOpen, setReportsOpen] = useState<boolean>(false);
  const [adminOpen, setAdminOpen] = useState<boolean>(false);
  const [controlOpen, setControlOpen] = useState<boolean>(false);
  const [documentsOpen, setDocumentsOpen] = useState<boolean>(false);
  const [companyId, setCompanyId] = useState<number | null>(null);

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('companyId');
    if (storedCompanyId) {
      setCompanyId(Number(storedCompanyId));
    }
  }, []);

  const showAdministration = companyId === 1;

  return (
    <nav className="h-full w-full bg-white border-r border-gray-200" aria-label="Menú principal">
      <div className="px-4 py-3 text-sm font-semibold text-gray-700">Menú</div>
      <ul className="px-2 pb-4 text-sm text-gray-700">
        <li>
          <NavLink
            to="/"
            end
            onClick={onItemClick}
            className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
          >
            <span className="material-symbols-outlined text-base">home</span>
            <span>Inicio</span>
          </NavLink>
        </li>
        {/* Propietarios - Todos los usuarios autenticados */}
        <li>
          <NavLink
            to="/owners"
            onClick={onItemClick}
            className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
          >
            <PersonAddAlt1Icon color="inherit" sx={{ fontSize: 18 }} />
            <span>Propietarios</span>
          </NavLink>
        </li>

        {/* Vehículos - Todos los usuarios autenticados */}
        <li>
          <NavLink
            to="/vehicles"
            onClick={onItemClick}
            className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
          >
            <DirectionsCarIcon color="inherit" sx={{ fontSize: 18 }} />
            <span>Vehículos</span>
          </NavLink>
        </li>

        {/* Conductores - Todos los usuarios autenticados */}
        <li>
          <NavLink
            to="/drivers"
            onClick={onItemClick}
            className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
          >
            <PersonAddAlt1Icon color="inherit" sx={{ fontSize: 18 }} />
            <span>Conductores</span>
          </NavLink>
        </li>

        {/* Accidentalidad - Todos los usuarios autenticados */}
        <li>
          <NavLink
            to="/accidents"
            onClick={onItemClick}
            className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
          >
            <CarCrashIcon color="inherit" sx={{ fontSize: 18 }} />
            <span>Accidentalidad</span>
          </NavLink>
        </li>

        {/* Tarjeta de control - Solo ADMIN y OPERATOR */}
        {canManageData() && (
          <li>
            <button
              type="button"
              onClick={() => setControlOpen(v => !v)}
              className={`${linkBase} w-full justify-between`}
              aria-expanded={controlOpen}
              aria-controls="submenu-control-card"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">credit_card</span>
                <span>Tarjeta de control</span>
              </span>
              {controlOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </button>
            {controlOpen && (
              <ul id="submenu-control-card" className="mt-1 ml-6 space-y-1">
                <li>
                  <NavLink
                    to="/control-sheet"
                    onClick={onItemClick}
                    className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    <span>Registrar Tarjeta Control</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/print-control-card"
                    onClick={onItemClick}
                    className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    <span>Imprimir Tarjeta Control</span>
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
        )}
        {/* Administración */}
        {showAdministration && (
          <li>
            <button
              type="button"
              onClick={() => setAdminOpen(v => !v)}
              className={`${linkBase} w-full justify-between`}
              aria-expanded={adminOpen}
              aria-controls="submenu-admin"
            >
              <span className="flex items-center gap-2">
                <AdminPanelSettingsIcon color="inherit" sx={{ fontSize: 18 }} />
                <span>Administración</span>
              </span>
              {adminOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </button>
            {adminOpen && (
              <ul id="submenu-admin" className="mt-1 ml-6 space-y-1">
                {/* Generar pago - Solo ADMIN */}
                {isAdmin() && (
                  <li>
                    <NavLink
                      to="/administration"
                      onClick={onItemClick}
                      className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
                    >
                      <span className="material-symbols-outlined text-base">add_card</span>
                      <span>Generar pago</span>
                    </NavLink>
                  </li>
                )}
                {/* Consultar pagos - Todos los usuarios */}
                <li>
                  <NavLink
                    to="/reports/administration-payments"
                    onClick={onItemClick}
                    className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
                  >
                    <span className="material-symbols-outlined text-base">payments</span>
                    <span>Consultar pagos</span>
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
        )}
        <li>
          <button
            type="button"
            onClick={() => setReportsOpen(v => !v)}
            className={`${linkBase} w-full justify-between`}
            aria-expanded={reportsOpen}
            aria-controls="submenu-reports"
          >
            <span className="flex items-center gap-2">
              <PlagiarismOutlinedIcon color="inherit" sx={{ fontSize: 18 }} />
              <span>Consultar Documentos</span>
            </span>
            {reportsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </button>
          {reportsOpen && (
            <ul id="submenu-reports" className="mt-1 ml-6 space-y-1">
              <li>
                <NavLink
                  to="/reports/operation-cards"
                  onClick={onItemClick}
                  className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
                >
                  <span className="material-symbols-outlined text-base">credit_card</span>
                  <span>Consultar Documentos</span>
                </NavLink>
              </li>
            </ul>
          )}
        </li>

        {/* Documentos - Solo ADMIN y OPERATOR */}
        {canManageData() && (
          <li>
            <button
              type="button"
              onClick={() => setDocumentsOpen(v => !v)}
              className={`${linkBase} w-full justify-between`}
              aria-expanded={documentsOpen}
              aria-controls="submenu-documents"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">folder</span>
                <span>Documentos</span>
              </span>
              {documentsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </button>
            {documentsOpen && (
              <ul id="submenu-documents" className="mt-1 ml-6 space-y-1">
                <li>
                  <NavLink
                    to="/documents/operation-card-request"
                    onClick={onItemClick}
                    className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
                  >
                    <span className="material-symbols-outlined text-base">credit_card</span>
                    <span>Tarjeta Operación</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/documents/active-contract"
                    onClick={onItemClick}
                    className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
                  >
                    <span className="material-symbols-outlined text-base">assignment</span>
                    <span>Contrato Vigente</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/documents/work-certificate"
                    onClick={onItemClick}
                    className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
                  >
                    <span className="material-symbols-outlined text-base">badge</span>
                    <span>Referencia Laboral</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/documents"
                    end
                    onClick={onItemClick}
                    className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
                  >
                    <span className="material-symbols-outlined text-base">description</span>
                    <span>Certificación de Ingresos</span>
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
        )}

        {/* Polizas - Solo ADMIN */}
        {isAdmin() && (
          <li>
            <NavLink
              to="/policies"
              onClick={onItemClick}
              className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
            >
              <span className="material-symbols-outlined text-base">security</span>
              <span>Polizas</span>
            </NavLink>
          </li>
        )}

        {/* Usuarios - Solo ADMIN */}
        {isAdmin() && (
          <li>
            <NavLink
              to="/users"
              onClick={onItemClick}
              className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
            >
              <span className="material-symbols-outlined text-base">group</span>
              <span>Usuarios</span>
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Sidebar;
