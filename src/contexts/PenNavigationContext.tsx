import React, { createContext, useContext, useState } from 'react';

interface PenNavigationContextType {
  selectedPenId: string | null;
  selectedPenNumber: string | null;
  navigateToPen: (penId: string, penNumber: string, source: 'cadastros' | 'lotes') => void;
  navigateToRegistrations: (penId?: string) => void;
  navigateToLotsMap: (penId?: string) => void;
  clearSelection: () => void;
}

const PenNavigationContext = createContext<PenNavigationContextType | undefined>(undefined);

interface PenNavigationProviderProps {
  children: React.ReactNode;
}

export const PenNavigationProvider: React.FC<PenNavigationProviderProps> = ({ children }) => {
  const [selectedPenId, setSelectedPenId] = useState<string | null>(null);
  const [selectedPenNumber, setSelectedPenNumber] = useState<string | null>(null);

  const navigateToPen = (penId: string, penNumber: string, source: 'cadastros' | 'lotes') => {
    setSelectedPenId(penId);
    setSelectedPenNumber(penNumber);
    
    // Salvar no localStorage para persistir entre navegações
    localStorage.setItem('selectedPenId', penId);
    localStorage.setItem('selectedPenNumber', penNumber);
    localStorage.setItem('penNavigationSource', source);
  };

  const navigateToRegistrations = (penId?: string) => {
    // Navegar para a página de cadastros
    const targetPenId = penId || selectedPenId;
    if (targetPenId) {
      // Usar React Router para navegar
      window.location.hash = '#/cadastros';
      
      // Aguardar um pouco e então selecionar a aba currais
      setTimeout(() => {
        // Simular clique na aba currais
        const curraisTab = document.querySelector('[data-tab="pens"]') as HTMLElement;
        if (curraisTab) {
          curraisTab.click();
        }
        
        // Destacar o curral específico
        setTimeout(() => {
          const penCard = document.querySelector(`[data-pen-id="${targetPenId}"]`) as HTMLElement;
          if (penCard) {
            penCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            penCard.style.animation = 'pulse 2s ease-in-out 3';
          }
        }, 500);
      }, 100);
    } else {
      window.location.hash = '#/cadastros';
    }
  };

  const navigateToLotsMap = (penId?: string) => {
    // Navegar para a página de lotes
    const targetPenId = penId || selectedPenId;
    if (targetPenId) {
      window.location.hash = '#/lotes';
      
      // Aguardar um pouco e então selecionar a aba mapa
      setTimeout(() => {
        const mapTab = document.querySelector('[data-tab="map"]') as HTMLElement;
        if (mapTab) {
          mapTab.click();
        }
        
        // Destacar o curral específico no mapa
        setTimeout(() => {
          const penMapCard = document.querySelector(`[data-pen-id="${targetPenId}"]`) as HTMLElement;
          if (penMapCard) {
            penMapCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            penMapCard.style.animation = 'pulse 2s ease-in-out 3';
          }
        }, 500);
      }, 100);
    } else {
      window.location.hash = '#/lotes';
    }
  };

  const clearSelection = () => {
    setSelectedPenId(null);
    setSelectedPenNumber(null);
    localStorage.removeItem('selectedPenId');
    localStorage.removeItem('selectedPenNumber');
    localStorage.removeItem('penNavigationSource');
  };

  // Recuperar seleção do localStorage ao inicializar
  React.useEffect(() => {
    const savedPenId = localStorage.getItem('selectedPenId');
    const savedPenNumber = localStorage.getItem('selectedPenNumber');
    
    if (savedPenId && savedPenNumber) {
      setSelectedPenId(savedPenId);
      setSelectedPenNumber(savedPenNumber);
    }
  }, []);

  const value: PenNavigationContextType = {
    selectedPenId,
    selectedPenNumber,
    navigateToPen,
    navigateToRegistrations,
    navigateToLotsMap,
    clearSelection
  };

  return (
    <PenNavigationContext.Provider value={value}>
      {children}
    </PenNavigationContext.Provider>
  );
};

export const usePenNavigation = (): PenNavigationContextType => {
  const context = useContext(PenNavigationContext);
  if (context === undefined) {
    throw new Error('usePenNavigation must be used within a PenNavigationProvider');
  }
  return context;
};

// Hook para detectar se estamos vindo de uma navegação cruzada
export const usePenNavigationEffect = () => {
  const { selectedPenId, selectedPenNumber } = usePenNavigation();
  
  React.useEffect(() => {
    const source = localStorage.getItem('penNavigationSource');
    
    if (selectedPenId && source) {
      
      // Limpar o source após usar
      localStorage.removeItem('penNavigationSource');
      
      return () => {
        // Cleanup se necessário
      };
    }
  }, [selectedPenId, selectedPenNumber]);

  return { selectedPenId, selectedPenNumber };
};
