import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { apiService } from '../services/api';

interface SyncState {
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
}

export function useRealDataSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    loading: false,
    error: null,
    lastSync: null
  });

  const store = useAppStore();
  const { 
    cycles, 
    cattlePurchases, 
    partners,
    expenses,
    revenues,
    penRegistrations,
    healthRecords,
    currentWeightReadings,
    setCycles,
    setCattlePurchases,
    setPartners,
    setExpenses,
    setRevenues,
    setPenRegistrations,
    setHealthRecords,
    setWeightReadings
  } = store;

  const syncWithBackend = async () => {
    try {
      setSyncState(prev => ({ ...prev, loading: true, error: null }));

      // Buscar TODOS os dados do backend
      const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
      const [allData, statsData] = await Promise.all([
        fetch(`${apiUrl}/all-data`).then(r => r.json()),
        apiService.getStats()
      ]);
      // Converter TODOS os dados do backend para o formato do frontend
      if (allData.success && allData.data) {
        const data = allData.data;

        // 1. Ciclos
        if (data.cycles && data.cycles.length > 0) {
          const realCycles = data.cycles.map((cycle: any) => ({
            id: cycle.id,
            name: cycle.name,
            startDate: new Date(cycle.startDate || cycle.createdAt),
            endDate: cycle.endDate ? new Date(cycle.endDate) : undefined,
            status: cycle.status.toLowerCase() as 'active' | 'completed' | 'planned',
            description: cycle.description || '',
            budget: cycle.budget || 0,
            targetAnimals: cycle.targetAnimals || 0,
            createdAt: new Date(cycle.createdAt)
          }));
          setCycles(realCycles);
        }

        // 2. Lotes
        if (data.cattlePurchases && data.cattlePurchases.length > 0) {
          const realLots = data.cattlePurchases.map((lot: any) => ({
            id: lot.id,
            lotNumber: lot.lotNumber,
            animalCount: lot.entryQuantity,
            totalWeight: lot.entryWeight,
            totalCost: lot.totalCost,
            status: lot.status,
            createdAt: new Date(lot.createdAt),
            purchaseId: lot.purchaseId,
            entryDate: new Date(lot.entryDate),
            entryWeight: lot.entryWeight,
            entryQuantity: lot.entryQuantity,
            acquisitionCost: lot.acquisitionCost,
            currentQuantity: lot.currentQuantity,
            deathCount: lot.deathCount || 0,
            healthCost: lot.healthCost || 0,
            feedCost: lot.feedCost || 0,
            operationalCost: lot.operationalCost || 0,
            freightCost: lot.freightCost || 0,
            otherCosts: lot.otherCosts || 0
          }));
          setCattlePurchases(realLots);
        }

        // 3. Parceiros
        if (data.partners && data.partners.length > 0) {
          const realPartners = data.partners.map((partner: any) => ({
            id: partner.id,
            name: partner.name,
            type: partner.type,
            cpfCnpj: partner.cpfCnpj || '',
            phone: partner.phone || '',
            email: partner.email || '',
            address: partner.address || '',
            notes: partner.notes || '',
            isActive: partner.isActive,
            createdAt: new Date(partner.createdAt)
          }));
          setPartners(realPartners);
        }

        // 4. Despesas
        if (data.expenses && data.expenses.length > 0) {
          const realExpenses = data.expenses.map((expense: any) => ({
            id: expense.id,
            category: expense.category,
            description: expense.description,
            purchaseValue: expense.purchaseValue,
            dueDate: new Date(expense.dueDate),
            paymentDate: expense.paymentDate ? new Date(expense.paymentDate) : undefined,
            isPaid: expense.isPaid,
            impactsCashFlow: expense.impactsCashFlow !== false,
            createdAt: new Date(expense.createdAt),
            updatedAt: new Date(expense.updatedAt || expense.createdAt)
          }));
          if (setExpenses) {
            setExpenses(realExpenses);
          } else {
          }
        }

        // 5. Receitas
        if (data.revenues && data.revenues.length > 0) {
          const realRevenues = data.revenues.map((revenue: any) => ({
            id: revenue.id,
            category: revenue.category,
            description: revenue.description,
            purchaseValue: revenue.purchaseValue,
            dueDate: new Date(revenue.dueDate),
            receiptDate: revenue.receiptDate ? new Date(revenue.receiptDate) : undefined,
            isReceived: revenue.isReceived,
            createdAt: new Date(revenue.createdAt),
            updatedAt: new Date(revenue.updatedAt || revenue.createdAt)
          }));
          setRevenues(realRevenues);
        }

        // 6. Currais (como PenRegistrations)
        if (data.pens && data.pens.length > 0) {
          const realPens = data.pens.map((pen: any) => ({
            id: pen.id,
            penNumber: pen.penNumber,
            capacity: pen.capacity,
            location: pen.location || '',
            type: pen.type,
            status: pen.status,
            isActive: pen.isActive,
            createdAt: new Date(pen.createdAt)
          }));
          setPenRegistrations(realPens);
        }

        // 7. Registros de Saúde
        if (data.healthRecords && data.healthRecords.length > 0) {
          const realHealthRecords = data.healthRecords.map((record: any) => ({
            id: record.id,
            protocolId: record.protocolId,
            lotId: record.lotId,
            animalCount: record.animalCount,
            costPerAnimal: record.costPerAnimal,
            totalCost: record.totalCost,
            createdAt: new Date(record.createdAt)
          }));
          setHealthRecords(realHealthRecords);
        }

        // 8. Leituras de Peso
        if (data.currentWeightReadings && data.currentWeightReadings.length > 0) {
          const realWeightReadings = data.currentWeightReadings.map((reading: any) => ({
            id: reading.id,
            lotId: reading.lotId,
            readingDate: new Date(reading.readingDate),
            averageWeight: reading.averageWeight,
            totalWeight: reading.totalWeight,
            animalCount: reading.animalCount,
            createdAt: new Date(reading.createdAt)
          }));
          if (setWeightReadings) {
            setWeightReadings(realWeightReadings);
          } else {
          }
        }
      }

      setSyncState({
        loading: false,
        error: null,
        lastSync: new Date()
      });
    } catch (_error) {
      console.error('❌ Erro na sincronização:', error);
      setSyncState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  };

  // Sincronizar automaticamente na inicialização
  useEffect(() => {
    console.log('[RealDataSync] Estado inicial dos dados:', {
      cycles: cycles?.length || 'undefined',
      cattlePurchases: cattlePurchases?.length || 'undefined',
      partners: partners?.length || 'undefined',
      expenses: expenses?.length || 'undefined',
      revenues: revenues?.length || 'undefined',
      penRegistrations: penRegistrations?.length || 'undefined',
      healthRecords: healthRecords?.length || 'undefined',
      currentWeightReadings: currentWeightReadings?.length || 'undefined'
    });
    syncWithBackend();
  }, []);

  return {
    ...syncState,
    sync: syncWithBackend,
    hasRealData: (cycles?.length || 0) > 0 || (cattlePurchases?.length || 0) > 0 || (partners?.length || 0) > 0 || (expenses?.length || 0) > 0 || (revenues?.length || 0) > 0,
    dataCounts: {
      cycles: cycles?.length || 0,
      cattlePurchases: cattlePurchases?.length || 0,
      partners: partners?.length || 0,
      expenses: expenses?.length || 0,
      revenues: revenues?.length || 0,
      pens: penRegistrations?.length || 0,
      healthRecords: healthRecords?.length || 0,
      currentWeightReadings: currentWeightReadings?.length || 0
    }
  };
}
