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
    // Removido proxy - sempre usar Cloudflare Pages diretamente
    // As requisições vão direto para aplicacao-boi-gordo.pages.dev/api/v1
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
    // Configuração otimizada para Cloudflare Pages
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    // Hash normal (Cloudflare faz cache busting automaticamente)
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
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