import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Configurações de otimização
    rollupOptions: {
      output: {
        // Estratégia de chunking manual
        manualChunks: {
          // Vendor chunks - bibliotecas que raramente mudam
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'clsx'],
          'date-vendor': ['date-fns'],
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
          'chart-vendor': ['recharts'],
          'state-vendor': ['zustand'],
          'utils-vendor': ['uuid'],
        },
        // Nomear chunks de forma mais clara
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/${facadeModuleId}-[hash].js`;
        },
      },
    },
    // Aumentar o limite de aviso para 600kb (já que vamos dividir melhor)
    chunkSizeWarningLimit: 600,
    // Gerar source maps apenas se necessário (desabilitado por padrão para produção)
    sourcemap: false,
  },
}); 