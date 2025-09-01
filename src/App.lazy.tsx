import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/providers/theme-provider';
import { BackendProvider } from '@/providers/BackendProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { Toaster } from '@/components/ui/toaster';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Componente de Loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

// Lazy load de páginas - Carregamento sob demanda
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Pipeline = lazy(() => import('@/pages/Pipeline'));
const Lots = lazy(() => import('@/pages/Lots'));
const Sales = lazy(() => import('@/pages/Sales'));
const Financial = lazy(() => import('@/pages/Financial'));
const Reports = lazy(() => import('@/pages/Reports'));
const Registrations = lazy(() => import('@/pages/Registrations'));
const Settings = lazy(() => import('@/pages/Settings'));

// Componente de Layout com lazy loading
const Layout = lazy(() => import('@/components/Layout').then(module => ({
  default: module.Layout
})));

function App() {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <BackendProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Rota de Login */}
                <Route path="/login" element={<Login />} />
                
                {/* Rotas Protegidas */}
                <Route element={<AuthGuard />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/pipeline/*" element={<Pipeline />} />
                    <Route path="/lots/*" element={<Lots />} />
                    <Route path="/sales/*" element={<Sales />} />
                    <Route path="/financial/*" element={<Financial />} />
                    <Route path="/reports/*" element={<Reports />} />
                    <Route path="/registrations/*" element={<Registrations />} />
                    <Route path="/settings/*" element={<Settings />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </Router>
          <Toaster />
        </BackendProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;