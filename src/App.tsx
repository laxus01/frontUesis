import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import Sidebar from './components/Sidebar';
import Vehicles from './pages/Vehicles';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { SnackbarProvider } from './components/SnackbarProvider';
import Drivers from './pages/Drivers';
import ControlCard from './pages/ControlCard';
import PrintControlCard from './pages/PrintControlCard';
import AbsolutePrintCard from './pages/AbsolutePrintCard';
import Administration from './pages/Administration';
import AdministrationPayments from './pages/AdministrationPayments';

function App(): JSX.Element {
  const [currentUser, setCurrentUser] = useState<any>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isPrintOnly = location.pathname === '/absolute-print';

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        const user = JSON.parse(raw);
        setCurrentUser(user);
      } catch {
        setCurrentUser(undefined);
      }
    }
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
    setCurrentUser(undefined);
  };

  if (isPrintOnly) {
    // Render bare printing page without header/sidebar/auth wrappers
    return <AbsolutePrintCard />;
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
                <Route path="/" element={<Home />} />
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/control-sheet" element={<ControlCard />} />
                <Route path="/print-control-card" element={<PrintControlCard />} />
                <Route path="/absolute-print" element={<AbsolutePrintCard />} />
                <Route path="/administration" element={<Administration />} />
                <Route path="/reports/administration-payments" element={<AdministrationPayments />} />
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
