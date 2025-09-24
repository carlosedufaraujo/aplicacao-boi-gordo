/**
 * Hook para inicializar o store de forma segura
 * Evita problemas de temporal dead zone
 */

import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export const useStoreInitializer = () => {
  const initializeStore = useAppStore(state => state.initializeStore);

  useEffect(() => {
    // Inicializar o store após o primeiro render
    const timer = setTimeout(() => {
      try {
        initializeStore();
      } catch (error) {
        console.error('Error initializing store:', error);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [initializeStore]);
};
