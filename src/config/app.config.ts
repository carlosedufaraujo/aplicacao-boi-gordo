/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 * Edit config.shared.js instead and run npm run sync-config
 */

export const APP_CONFIG = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
    backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  frontend: {
    port: 5173,
  },
  backend: {
    port: 3001,
  },
} as const;
