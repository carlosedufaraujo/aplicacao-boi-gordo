import { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { trackSystemChange } from '../utils/systemUpdates';

// Hook para rastrear ações importantes do sistema
export const useSystemTracking = () => {
  const store = useAppStore();
  
  useEffect(() => {
    // Rastrear mudanças importantes
    const unsubscribe = useAppStore.subscribe(
      (state, prevState) => {
        // Rastrear adição de novos registros
        if (state.purchaseOrders.length > prevState.purchaseOrders.length) {
          trackSystemChange('Nova ordem de compra criada', 'pipeline', 'feature');
        }
        
        if (state.cattleLots.length > prevState.cattleLots.length) {
          trackSystemChange('Novo lote de animais criado', 'pipeline', 'feature');
        }
        
        if (state.saleRecords.length > prevState.saleRecords.length) {
          trackSystemChange('Nova venda registrada', 'financial', 'feature');
        }
        
        // Rastrear mudanças financeiras
        if (state.financialAccounts.length > prevState.financialAccounts.length) {
          trackSystemChange('Nova conta financeira criada', 'financial', 'feature');
        }
        
        if (state.expenses.length > prevState.expenses.length) {
          trackSystemChange('Nova despesa registrada', 'financial', 'feature');
        }
        
        // Rastrear mudanças de configuração
        if (state.darkMode !== prevState.darkMode) {
          trackSystemChange(`Modo ${state.darkMode ? 'escuro' : 'claro'} ativado`, 'ui', 'improvement');
        }
      }
    );
    
    return unsubscribe;
  }, []);
}; 