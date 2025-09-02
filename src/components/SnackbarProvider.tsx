import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

export type SnackbarMessage = {
  message: string;
  severity?: AlertColor; // 'success' | 'info' | 'warning' | 'error'
  autoHideDuration?: number; // ms
};

type SnackbarContextValue = {
  notify: (msg: SnackbarMessage | string) => void;
  success: (msg: string, autoHideDuration?: number) => void;
  info: (msg: string, autoHideDuration?: number) => void;
  warning: (msg: string, autoHideDuration?: number) => void;
  error: (msg: string, autoHideDuration?: number) => void;
  close: () => void;
};

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<Required<SnackbarMessage>>({
    message: '',
    severity: 'info',
    autoHideDuration: 4000,
  });

  const notify = useCallback((msg: SnackbarMessage | string) => {
    const payload: Required<SnackbarMessage> = typeof msg === 'string'
      ? { message: msg, severity: 'info', autoHideDuration: 4000 }
      : {
          message: msg.message,
          severity: msg.severity ?? 'info',
          autoHideDuration: msg.autoHideDuration ?? 4000,
        };
    setState(payload);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const success = useCallback((message: string, autoHideDuration?: number) => notify({ message, severity: 'success', autoHideDuration }), [notify]);
  const info = useCallback((message: string, autoHideDuration?: number) => notify({ message, severity: 'info', autoHideDuration }), [notify]);
  const warning = useCallback((message: string, autoHideDuration?: number) => notify({ message, severity: 'warning', autoHideDuration }), [notify]);
  const error = useCallback((message: string, autoHideDuration?: number) => notify({ message, severity: 'error', autoHideDuration }), [notify]);

  const value = useMemo(() => ({ notify, success, info, warning, error, close }), [notify, success, info, warning, error, close]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        onClose={close}
        autoHideDuration={state.autoHideDuration}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={close} severity={state.severity} sx={{ width: '100%' }}>
          {state.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextValue => {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within a SnackbarProvider');
  return ctx;
};
