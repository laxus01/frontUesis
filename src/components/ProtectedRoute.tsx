import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, Alert, Typography, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedPermissions?: string[];
}

/**
 * Componente para proteger rutas según permisos del usuario
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedPermissions
}) => {
  const { isAuthenticated, isLoading, hasPermission, currentUser } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se especificaron permisos, verificar que el usuario tenga uno de ellos
  if (allowedPermissions && allowedPermissions.length > 0) {
    if (!hasPermission(allowedPermissions)) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            p: 3
          }}
        >
          <Alert severity="error" sx={{ maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              Acceso Denegado
            </Typography>
            <Typography variant="body2">
              No tienes permisos para acceder a esta página.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Tu permiso actual: <strong>{currentUser?.permissions}</strong>
            </Typography>
            <Typography variant="body2">
              Permisos requeridos: <strong>{allowedPermissions.join(', ')}</strong>
            </Typography>
          </Alert>
        </Box>
      );
    }
  }

  return <>{children}</>;
};
