import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/test-utils';
import { ShadcnDashboard } from '../ShadcnDashboard';
import { useAppStore } from '@/stores/useAppStore';

// Mock do store
vi.mock('@/stores/useAppStore', () => ({
  useAppStore: vi.fn()
}));

// Mock dos hooks de dados do Supabase
vi.mock('@/hooks/useSupabaseData', () => ({
  useCattleLots: () => ({
    lots: [
      { id: '1', name: 'Lote A', quantity: 50, currentValue: 250000 },
      { id: '2', name: 'Lote B', quantity: 30, currentValue: 150000 }
    ],
    loading: false,
    error: null
  }),
  usePurchaseOrders: () => ({
    orders: [],
    loading: false,
    error: null
  }),
  usePartners: () => ({
    partners: [],
    loading: false,
    error: null
  }),
  usePens: () => ({
    pens: [],
    loading: false,
    error: null
  }),
  usePayerAccounts: () => ({
    accounts: [],
    loading: false,
    error: null
  }),
  useExpenses: () => ({
    expenses: [
      { id: '1', amount: 25000, category: 'Alimentação' },
      { id: '2', amount: 8500, category: 'Veterinária' }
    ],
    loading: false,
    error: null
  }),
  useRevenues: () => ({
    revenues: [
      { id: '1', amount: 185000, date: new Date('2024-01-15') },
      { id: '2', amount: 220000, date: new Date('2024-01-20') }
    ],
    loading: false,
    error: null
  }),
  useSales: () => ({
    sales: [],
    loading: false,
    error: null
  })
}));

describe('ShadcnDashboard', () => {
  const mockStore = {
    lots: [
      { id: '1', name: 'Lote A', quantity: 50, currentValue: 250000 },
      { id: '2', name: 'Lote B', quantity: 30, currentValue: 150000 }
    ],
    sales: [],
    expenses: [],
    revenues: [],
    fetchLots: vi.fn(),
    fetchSales: vi.fn(),
    fetchExpenses: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockReturnValue(mockStore);
  });

  it('deve renderizar o dashboard corretamente', async () => {
    render(<ShadcnDashboard />);
    
    // Verifica se o título está presente
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Visão geral do sistema de gestão de gado')).toBeInTheDocument();
  });

  it('deve exibir os cards de KPI', async () => {
    render(<ShadcnDashboard />);
    
    await waitFor(() => {
      // Verifica se os cards de KPI estão presentes
      expect(screen.getByText('Total de Animais')).toBeInTheDocument();
      expect(screen.getByText('Valor do Rebanho')).toBeInTheDocument();
      expect(screen.getByText('Receita Mensal')).toBeInTheDocument();
      expect(screen.getByText('Despesas Mensais')).toBeInTheDocument();
    });
  });

  it('deve permitir alternar entre períodos de filtro', async () => {
    const user = userEvent.setup();
    render(<ShadcnDashboard />);
    
    // Encontra e clica no seletor de período
    const periodSelector = screen.getByRole('combobox');
    await user.click(periodSelector);
    
    // Seleciona um período diferente
    const lastMonthOption = screen.getByText('Últimos 30 dias');
    await user.click(lastMonthOption);
    
    // Verifica se o filtro foi aplicado (o texto do botão deve mudar)
    expect(periodSelector).toHaveTextContent('Últimos 30 dias');
  });

  it('deve exibir o botão de exportar', async () => {
    render(<ShadcnDashboard />);
    
    const exportButton = screen.getByRole('button', { name: /exportar/i });
    expect(exportButton).toBeInTheDocument();
  });

  it('deve calcular corretamente os totais', async () => {
    render(<ShadcnDashboard />);
    
    await waitFor(() => {
      // Total de animais: 50 + 30 = 80
      expect(screen.getByText('80')).toBeInTheDocument();
      
      // Valor do rebanho deve estar formatado em moeda
      expect(screen.getByText(/R\$.*400\.000/)).toBeInTheDocument();
    });
  });

  it('deve exibir gráficos quando há dados', async () => {
    render(<ShadcnDashboard />);
    
    await waitFor(() => {
      // Verifica se os títulos dos gráficos estão presentes
      expect(screen.getByText('Receita vs Custos')).toBeInTheDocument();
      expect(screen.getByText('Valor do Rebanho')).toBeInTheDocument();
    });
  });

  it('deve mostrar atividades recentes', async () => {
    render(<ShadcnDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Atividades Recentes')).toBeInTheDocument();
    });
  });

  it('deve abrir o seletor de data personalizada', async () => {
    const user = userEvent.setup();
    render(<ShadcnDashboard />);
    
    // Primeiro seleciona período personalizado
    const periodSelector = screen.getByRole('combobox');
    await user.click(periodSelector);
    
    const customOption = screen.getByText('Personalizado');
    await user.click(customOption);
    
    // Verifica se o botão de calendário aparece
    const calendarButton = screen.getByRole('button', { name: /selecionar período/i });
    expect(calendarButton).toBeInTheDocument();
  });

  it('deve atualizar dados ao clicar em atualizar', async () => {
    const user = userEvent.setup();
    render(<ShadcnDashboard />);
    
    // Encontra e clica no botão de atualizar
    const refreshButton = screen.getByRole('button', { name: /atualizar/i });
    await user.click(refreshButton);
    
    // Verifica se as funções de fetch foram chamadas
    expect(mockStore.fetchLots).toHaveBeenCalled();
    expect(mockStore.fetchSales).toHaveBeenCalled();
    expect(mockStore.fetchExpenses).toHaveBeenCalled();
  });

  it('deve exibir mensagem quando não há dados', async () => {
    // Mock com dados vazios
    (useAppStore as any).mockReturnValue({
      ...mockStore,
      lots: [],
      sales: [],
      expenses: []
    });
    
    render(<ShadcnDashboard />);
    
    await waitFor(() => {
      // Deve mostrar valores zerados
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});