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
      console.log('🔄 Sincronizando dados com backend...');

      // Buscar TODOS os dados do backend
      const [allData, statsData] = await Promise.all([
        fetch('http://localhost:3002/api/v1/all-data').then(r => r.json()),
        apiService.getStats()
      ]);

      console.log('📦 TODOS os dados recebidos do backend:', { allData, statsData });

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
          console.log('🔄 Atualizando ciclos no store:', realCycles);
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
          console.log('🐄 Atualizando lotes no store:', realLots);
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
          console.log('🤝 Atualizando parceiros no store:', realPartners);
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
          console.log('💰 Atualizando despesas no store:', realExpenses);
          if (setExpenses) {
            setExpenses(realExpenses);
          } else {
            console.warn('⚠️ setExpenses não está disponível');
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
          console.log('💵 Atualizando receitas no store:', realRevenues);
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
          console.log('🏢 Atualizando currais no store:', realPens);
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
          console.log('🏥 Atualizando registros de saúde no store:', realHealthRecords);
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
          console.log('⚖️ Atualizando leituras de peso no store:', realWeightReadings);
          if (setWeightReadings) {
            setWeightReadings(realWeightReadings);
          } else {
            console.warn('⚠️ setWeightReadings não está disponível');
          }
        }
      }

      setSyncState({
        loading: false,
        error: null,
        lastSync: new Date()
      });

      console.log('✅ Sincronização concluída com sucesso!');

    } catch (error) {
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
    console.log('🔍 Debug - Variáveis do store:', {
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
