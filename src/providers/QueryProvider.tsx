import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configuração do Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tempo que os dados ficam "fresh" (não refetch automático)
      staleTime: 1000 * 60 * 5, // 5 minutos
      
      // Tempo que os dados ficam em cache
      gcTime: 1000 * 60 * 10, // 10 minutos (anteriormente cacheTime)
      
      // Retry em caso de erro
      retry: (failureCount, error: any) => {
        // Não retry em 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Máximo 3 tentativas
        return failureCount < 3;
      },
      
      // Delay entre retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch quando a janela ganha foco
      refetchOnWindowFocus: false,
      
      // Refetch quando reconecta
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry em mutations
      retry: 1,
      retryDelay: 1000,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

export { queryClient };