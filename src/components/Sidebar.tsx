import React, { useState } from 'react';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { NavLink } from 'react-router-dom';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

type SidebarProps = {
  onItemClick?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const linkBase =
    'flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100';
  const linkActive = 'bg-blue-50 text-blue-700 font-medium';
  const [reportsOpen, setReportsOpen] = useState<boolean>(false);

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
        <li>
          <NavLink
            to="/control-sheet"
            onClick={onItemClick}
            className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
          >
            <span className="material-symbols-outlined text-base">description</span>
            <span>Planilla de Control</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/print-control-card"
            onClick={onItemClick}
            className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Imprimir tarjeta control</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/administration"
            onClick={onItemClick}
            className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
          >
            <AdminPanelSettingsIcon color="inherit" sx={{ fontSize: 18 }} />
            <span>Administración</span>
          </NavLink>
        </li>
        <li>
          <button
            type="button"
            onClick={() => setReportsOpen(v => !v)}
            className={`${linkBase} w-full justify-between`}
            aria-expanded={reportsOpen}
            aria-controls="submenu-reports"
          >
            <span className="flex items-center gap-2">
              <AssessmentIcon color="inherit" sx={{ fontSize: 18 }} />
              <span>Informes</span>
            </span>
            {reportsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </button>
          {reportsOpen && (
            <ul id="submenu-reports" className="mt-1 ml-6 space-y-1">
              <li>
                <NavLink
                  to="/reports/administration-payments"
                  onClick={onItemClick}
                  className={({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? linkActive : ''}`}
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  <span>Pagos de Administración</span>
                </NavLink>
              </li>
            </ul>
          )}
        </li>
        
      </ul>
    </nav>
  );
};

export default Sidebar;
