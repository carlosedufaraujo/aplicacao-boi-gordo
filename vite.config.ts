import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    // Incluir dependências problemáticas explicitamente
    include: [
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'recharts',
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-slot',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-separator',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-tabs',
      '@radix-ui/react-checkbox',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'framer-motion',
      'lucide-react',
      '@tabler/icons-react',
      'axios'
    ],
    // Forçar re-otimização
    force: true
  },
  build: {
    // Configurações simplificadas
    sourcemap: false,
    // Aumenta o limite para 2MB para evitar warnings
    chunkSizeWarningLimit: 2000,
    // Configurações de chunk manual para evitar problemas de circular dependency
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-slot',
            '@radix-ui/react-avatar',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-separator',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-checkbox'
          ],
          'vendor-utils': [
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'axios',
            'date-fns',
            'zod'
          ]
        }
      }
    }
  }
}); 