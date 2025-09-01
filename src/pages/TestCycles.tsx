import React, { useState } from 'react';
import { CycleSelector } from '@/components/Common/CycleSelector';
import { useCyclesApi } from '@/hooks/api/useCyclesApi';
import { toast } from 'sonner';

export const TestCycles = () => {
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const { cycles, loading, error, createCycle, refresh } = useCyclesApi();

  const handleCreateTestCycle = async () => {
    const testCycle = {
      name: `Ciclo Teste ${new Date().toISOString()}`,
      description: 'Ciclo criado para teste',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PLANNED' as const,
      budget: 100000,
      targetAnimals: 50
    };

    console.log('[TestCycles] Creating test cycle:', testCycle);
    const result = await createCycle(testCycle);
    console.log('[TestCycles] Creation result:', result);
    
    if (result) {
      toast.success('Ciclo de teste criado!');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Ciclos</h1>
      
      {/* Status */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Status</h2>
        <div className="space-y-2">
          <div>Loading: {loading ? 'Sim' : 'Não'}</div>
          <div>Error: {error || 'Nenhum'}</div>
          <div>Total de ciclos: {cycles.length}</div>
        </div>
      </div>

      {/* Lista de Ciclos */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Ciclos Disponíveis</h2>
        {cycles.length === 0 ? (
          <p className="text-gray-500">Nenhum ciclo encontrado</p>
        ) : (
          <div className="space-y-2">
            {cycles.map(cycle => (
              <div key={cycle.id} className="border rounded p-2">
                <div className="font-medium">{cycle.name}</div>
                <div className="text-sm text-gray-600">
                  Status: {cycle.status} | 
                  Início: {new Date(cycle.startDate).toLocaleDateString('pt-BR')}
                  {cycle.endDate && ` | Fim: ${new Date(cycle.endDate).toLocaleDateString('pt-BR')}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teste do CycleSelector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Teste do CycleSelector</h2>
        <CycleSelector
          value={selectedCycle}
          onChange={(value) => {
            console.log('[TestCycles] Cycle selected:', value);
            setSelectedCycle(value);
            toast.info(`Ciclo selecionado: ${value}`);
          }}
          showAll={true}
          label="Selecione um Ciclo"
        />
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <strong>Ciclo Selecionado:</strong> {selectedCycle || 'Nenhum'}
        </div>
      </div>

      {/* Ações */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Ações</h2>
        <div className="space-x-2">
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Recarregar Ciclos
          </button>
          <button
            onClick={handleCreateTestCycle}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Criar Ciclo de Teste
          </button>
        </div>
      </div>
    </div>
  );
};