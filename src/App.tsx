import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import Sidebar from './components/Sidebar';
import Vehicles from './pages/Vehicles';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { SnackbarProvider } from './components/SnackbarProvider';
import { AuthData } from './types/auth';
import Drivers from './pages/Drivers';
import ControlCard from './pages/ControlCard';
import PrintControlCard from './pages/PrintControlCard';
import AbsolutePrintCard from './pages/AbsolutePrintCard';
import AbsoluteAdministrationPaymentPrint from './pages/AbsoluteAdministrationPaymentPrint';
import Administration from './pages/Administration';
import AdministrationPayments from './pages/AdministrationPayments';
import IncomeCertificates from './pages/IncomeCertificates';
import WorkCertificate from './pages/WorkCertificate';
import Owners from './pages/Owners';
import OperationCardsQuery from './pages/OperationCardsQuery';
import Users from './pages/Users';
import Policies from './pages/Policies';
import { ProtectedRoute } from './components/ProtectedRoute';

function App(): JSX.Element {
  const [currentUser, setCurrentUser] = useState<AuthData | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isPrintOnly = location.pathname === '/absolute-print' || location.pathname === '/absolute-print-administration';

  useEffect(() => {
    const loadUser = () => {
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          const user = JSON.parse(raw);
          setCurrentUser(user);
        } catch {
          setCurrentUser(undefined);
        }
      } else {
        setCurrentUser(undefined);
      }
    };

    // Cargar usuario inicial
    loadUser();

    // Escuchar cambios en localStorage (para login/logout)
    window.addEventListener('storage', loadUser);
    
    // Custom event para cambios en la misma pestaña
    const handleAuthChange = () => loadUser();
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // Close sidebar on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const logOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    localStorage.removeItem('companyId');
    window.dispatchEvent(new Event('authChange'));
    setCurrentUser(undefined);
  };

  if (isPrintOnly) {
    // Render bare printing page without header/sidebar/auth wrappers
    if (location.pathname === '/absolute-print') {
      return <AbsolutePrintCard />;
    }
    if (location.pathname === '/absolute-print-administration') {
      return <AbsoluteAdministrationPaymentPrint />;
    }
  }

  return (
    <SnackbarProvider>
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white relative z-[60]">
        <nav className="flex h-12 w-full items-center justify-between px-2">
          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-1 hover:bg-white/10 md:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
                title="Abrir menú"
              >
                <span className="material-symbols-outlined" aria-hidden>
                  menu
                </span>
              </button>
            )}
            <a href="/" className="font-semibold tracking-wide">
              UESIS
            </a>
          </div>
          {currentUser ? (
            <button
              onClick={logOut}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="inline-flex items-center hover:text-white/80"
            >
              <PowerSettingsNewIcon fontSize="small" />
            </button>
          ) : (
            <a href="/login" className="hover:text-white/80">
              Login
            </a>
          )}
        </nav>
      </header>

      <main className="w-full p-0">
        {currentUser ? (
          <div className="flex w-full min-h-[calc(100vh-3rem)]">{/* 3rem = h-12 del header */}
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/40 md:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden
              />
            )}

            {/* Sidebar */}
            <aside
              className={
                `fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow transition-transform duration-200 ease-in-out md:static md:z-auto md:block md:translate-x-0 md:shadow-none md:sticky md:top-12 md:h-[calc(100vh-3rem)] ` +
                (sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0')
              }
            >
              <Sidebar onItemClick={() => setSidebarOpen(false)} />
            </aside>

            {/* Content area */}
            <section className="flex-1 overflow-auto p-3 sm:p-4">
              <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<Home />} />
                
                {/* Rutas protegidas - SUPER, ADMIN y OPERATOR pueden gestionar, VIEWER solo ver */}
                <Route path="/vehicles" element={
                  <ProtectedRoute allowedPermissions={['SUPER', 'ADMIN', 'OPERATOR', 'VIEWER']}>
                    <Vehicles />
                  </ProtectedRoute>
                } />
                <Route path="/drivers" element={
                  <ProtectedRoute allowedPermissions={['SUPER', 'ADMIN', 'OPERATOR', 'VIEWER']}>
                    <Drivers />
                  </ProtectedRoute>
                } />
                <Route path="/owners" element={
                  <ProtectedRoute allowedPermissions={['SUPER', 'ADMIN', 'OPERATOR', 'VIEWER']}>
                    <Owners />
                  </ProtectedRoute>
                } />
                <Route path="/policies" element={
                  <ProtectedRoute allowedPermissions={['SUPER', 'ADMIN']}>
                    <Policies />
                  </ProtectedRoute>
                } />
                <Route path="/control-sheet" element={
                  <ProtectedRoute allowedPermissions={['SUPER', 'ADMIN', 'OPERATOR']}>
                    <ControlCard />
                  </ProtectedRoute>
                } />
                <Route path="/print-control-card" element={
                  <ProtectedRoute allowedPermissions={['SUPER', 'ADMIN', 'OPERATOR']}>
                    <PrintControlCard />
                  </ProtectedRoute>
                } />
                
                {/* Rutas protegidas - Solo SUPER y ADMIN */}
                <Route path="/administration" element={
                  <ProtectedRoute allowedPermissions={['SUPER', 'ADMIN']}>
                    <Administration />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute allowedPermissions={['SUPER', 'ADMIN']}>
                    <Users />
                  </ProtectedRoute>
                } />
                
                {/* Rutas de reportes - Todos los usuarios autenticados */}
                <Route path="/reports/administration-payments" element={
                  <ProtectedRoute>
                    <AdministrationPayments />
                  </ProtectedRoute>
                } />
                <Route path="/reports/operation-cards" element={
                  <ProtectedRoute>
                    <OperationCardsQuery />
                  </ProtectedRoute>
                } />
                
                {/* Rutas de documentos - Solo SUPER, ADMIN y OPERATOR */}
                <Route path="/documents" element={
                  <ProtectedRoute allowedPermissions={['SUPER', 'ADMIN', 'OPERATOR']}>
                    <IncomeCertificates />
                  </ProtectedRoute>
                } />
                <Route path="/documents/work-certificate" element={
                  <ProtectedRoute allowedPermissions={['SUPER', 'ADMIN', 'OPERATOR']}>
                    <WorkCertificate />
                  </ProtectedRoute>
                } />
                
                {/* Rutas de impresión sin protección */}
                <Route path="/absolute-print" element={<AbsolutePrintCard />} />
                <Route path="/absolute-print-administration" element={<AbsoluteAdministrationPaymentPrint />} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </section>
          </div>
        ) : (
          <Login />
        )}
      </main>
    </div>
    </SnackbarProvider>
  );
}

export default App;
