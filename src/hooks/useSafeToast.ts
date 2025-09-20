import { useCallback, useRef } from 'react';
import { toast as sonnerToast } from 'sonner';

/**
 * Hook customizado que envolve o toast da biblioteca sonner
 * para evitar warnings de atualização de estado durante renderização
 */
export const useSafeToast = () => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Usar setTimeout para garantir que o toast seja chamado após o render
    timeoutRef.current = setTimeout(() => {
      switch (type) {
        case 'success':
      {
          sonnerToast.success(message);
          }
      break;
        case 'error':
      {
          sonnerToast.error(message);
          }
      break;
        case 'info':
      {
          sonnerToast.info(message);
          }
      break;
        case 'warning':
      {
          sonnerToast.warning(message);
          }
      break;
        default:
          sonnerToast(message);
      }
    }, 0);
  }, []);

  return {
    success: useCallback((message: string) => toast(message, 'success'), [toast]),
    error: useCallback((message: string) => toast(message, 'error'), [toast]),
    info: useCallback((message: string) => toast(message, 'info'), [toast]),
    warning: useCallback((message: string) => toast(message, 'warning'), [toast]),
  };
};