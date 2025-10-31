import { useState, useEffect } from 'react';
import { AuthData, User } from '../types/auth';

/**
 * Hook simple para manejar autenticación y permisos
 */
export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
    
    // Escuchar cambios en localStorage
    window.addEventListener('storage', loadUser);
    window.addEventListener('authChange', loadUser);

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('authChange', loadUser);
    };
  }, []);

  const loadUser = () => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        const authData: AuthData = JSON.parse(raw);
        setCurrentUser(authData.user || authData as any);
        setIsAuthenticated(true);
      } catch {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  /**
   * Verifica si el usuario tiene alguno de los permisos especificados
   */
  const hasPermission = (allowedPermissions: string[]): boolean => {
    if (!currentUser || !currentUser.permissions) return false;
    return allowedPermissions.includes(currentUser.permissions);
  };

  /**
   * Verifica si el usuario es ADMIN o SUPER
   */
  const isAdmin = (): boolean => {
    return currentUser?.permissions === 'ADMIN' || currentUser?.permissions === 'SUPER';
  };

  /**
   * Verifica si el usuario es SUPER, ADMIN u OPERATOR
   */
  const canManageData = (): boolean => {
    return hasPermission(['SUPER', 'ADMIN', 'OPERATOR']);
  };

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    hasPermission,
    isAdmin,
    canManageData,
    permissions: currentUser?.permissions || null
  };
};
