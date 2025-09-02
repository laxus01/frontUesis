import React, { useState } from 'react';
import AuthService from '../services/auth.service';

const Login: React.FC = () => {
  const [user, setUser] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      await AuthService.login(user, password);
      // Redirigir a la raíz para mostrar el componente Home
      window.location.href = '/';
    } catch (error: any) {
      const resMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      setMessage(resMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex min-h-screen w-screen items-center justify-center bg-blue-600 p-8">
      <div className="card-tw">
        <div className="p-2 sm:p-4">
          <div className="mb-6 text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15">
              <span className="text-[28px] font-bold text-blue-700">U</span>
            </div>
            <h4 className="mt-3 text-lg font-bold">Bienvenido</h4>
            <p className="mt-1 text-sm text-gray-500">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleLogin} noValidate>
            <div className="mb-4">
              <label htmlFor="username" className="label-tw">Usuario</label>
              <input
                id="username"
                type="text"
                className="input-tw"
                name="username"
                placeholder="Tu usuario"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="label-tw">Contraseña</label>
              <div className="flex items-stretch gap-2">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-tw"
                  name="password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-gray-600 hover:bg-gray-50"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary-tw w-full h-11 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <span
                    className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent"
                    role="status"
                    aria-hidden="true"
                  />
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>

            {message && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
