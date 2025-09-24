/**
 * Hook para inicializar o store de forma segura
 * Evita problemas de temporal dead zone
 */

import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export const useStoreInitializer = () => {
  const initializeStore = useAppStore(state => state.initializeStore);

  useEffect(() => {
    // Inicializar o store após múltiplos ticks para garantir segurança
    const timer1 = setTimeout(() => {
      const timer2 = setTimeout(() => {
        const timer3 = setTimeout(() => {
          try {
            initializeStore();
          } catch (error) {
            console.error('Error initializing store:', error);
            // Tentar novamente em caso de erro
            setTimeout(() => {
              try {
                initializeStore();
              } catch (retryError) {
                console.error('Retry error initializing store:', retryError);
              }
            }, 100);
          }
        }, 10);
        return () => clearTimeout(timer3);
      }, 10);
      return () => clearTimeout(timer2);
    }, 10);

    return () => clearTimeout(timer1);
  }, [initializeStore]);
};
