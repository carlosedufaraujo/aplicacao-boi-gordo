import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App.tsx';
import './index.css';
import { logWebVitals } from './utils/webVitals';

// Monitorar Web Vitals
if (import.meta.env.PROD) {
  logWebVitals();
}

// Configurar o router com future flags para v7
const router = createBrowserRouter(
  [
    {
      path: "*",
      element: <App />
    }
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true
    }
  }
);

createRoot(document.getElementById('root')!).render(
  <>
    <RouterProvider router={router} />
    <Toaster 
      position="top-right"
      richColors
      closeButton
      duration={4000}
    />
  </>
);