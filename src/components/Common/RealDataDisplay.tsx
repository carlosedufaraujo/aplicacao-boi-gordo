import React from 'react';
import { useRealData } from '../../hooks/useRealData';

export const RealDataDisplay: React.FC = () => {
  const { connected, loading, error, stats, lots, refetch } = useRealData();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📊 Dados Reais do Sistema</h3>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={loading}
        >
          {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
        </button>
      </div>

      {/* Status de Conexão */}
      <div className={`p-3 rounded-md mb-4 ${
        connected 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center space-x-2">
          <span>{connected ? '✅' : '❌'}</span>
          <span className="font-medium">
            {connected ? 'Conectado ao Backend' : 'Desconectado'}
          </span>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-2">
            <strong>Erro:</strong> {error}
          </p>
        )}
      </div>

      {/* Estatísticas */}
      {connected && stats && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">📈 Estatísticas do Banco:</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-3 rounded-md text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.cattle_lots || 0}</p>
              <p className="text-sm text-gray-600">Lotes</p>
            </div>
            <div className="bg-green-50 p-3 rounded-md text-center">
              <p className="text-2xl font-bold text-green-600">{stats.partners || 0}</p>
              <p className="text-sm text-gray-600">Parceiros</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-md text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.expenses || 0}</p>
              <p className="text-sm text-gray-600">Despesas</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-md text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.revenues || 0}</p>
              <p className="text-sm text-gray-600">Receitas</p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-md text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.purchase_orders || 0}</p>
              <p className="text-sm text-gray-600">Ordens</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Lotes */}
      {connected && lots && lots.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">🐄 Lotes de Gado:</h4>
          <div className="space-y-3">
            {lots.map((lot: any) => (
              <div key={lot.id} className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Número do Lote</p>
                    <p className="font-semibold">{lot.lotnumber || lot.lotNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Animais</p>
                    <p className="font-semibold">{lot.animalcount || lot.animalCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Peso Total</p>
                    <p className="font-semibold">{(lot.totalweight || lot.totalWeight)?.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Custo Total</p>
                    <p className="font-semibold">R$ {(lot.totalcost || lot.totalCost)?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    lot.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {lot.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há lotes */}
      {connected && lots && lots.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>📭 Nenhum lote encontrado no sistema</p>
          <p className="text-sm mt-2">Os dados podem estar sendo carregados...</p>
        </div>
      )}
    </div>
  );
};
