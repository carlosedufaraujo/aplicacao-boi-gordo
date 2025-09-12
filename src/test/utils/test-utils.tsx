import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SupabaseProvider } from '@/providers/SupabaseProvider';
import { NotificationProvider } from '@/components/Notifications/ModernNotificationSystem';

// Componente wrapper para testes
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <SupabaseProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </SupabaseProvider>
    </BrowserRouter>
  );
};

// Render customizado que inclui todos os providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Helpers para criar mocks de dados
export const createMockLot = (overrides = {}) => ({
  id: '1',
  name: 'Lote Teste',
  quantity: 50,
  weight: 25000,
  averageWeight: 500,
  breed: 'Nelore',
  origin: 'Fazenda ABC',
  purchaseDate: new Date('2024-01-01'),
  purchasePrice: 250000,
  currentValue: 275000,
  status: 'active',
  penId: 'pen-1',
  healthStatus: 'healthy',
  ...overrides
});

export const createMockSale = (overrides = {}) => ({
  id: '1',
  lotId: 'lot-1',
  lotName: 'Lote Nelore',
  buyer: 'Frigorífico ABC',
  status: 'confirmed',
  quantity: 50,
  weight: 25000,
  pricePerKg: 18.50,
  totalValue: 462500,
  createdAt: new Date('2024-01-15'),
  expectedDelivery: new Date('2024-01-30'),
  paymentMethod: 'transfer',
  ...overrides
});

export const createMockTransaction = (overrides = {}) => ({
  id: '1',
  date: new Date('2024-01-15'),
  description: 'Venda Lote #234',
  amount: 185000,
  type: 'revenue',
  category: 'Vendas',
  status: 'paid',
  account: 'Conta Corrente',
  ...overrides
});

export const createMockUser = (overrides = {}) => ({
  id: '1',
  name: 'João Silva',
  email: 'joao@exemplo.com',
  role: 'admin',
  createdAt: new Date('2023-01-01'),
  ...overrides
});

// Helpers para simular eventos assíncronos
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

export const flushPromises = () => 
  new Promise(resolve => setImmediate(resolve));