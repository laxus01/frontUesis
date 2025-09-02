import { useSnackbar } from '../components/SnackbarProvider';

// Domain-level notification helper. Prefer using this hook instead of importing the provider directly.
export const useNotify = () => {
  const { notify, success, info, warning, error, close } = useSnackbar();
  return { notify, success, info, warning, error, close };
};

export type NotifyApi = ReturnType<typeof useNotify>;
