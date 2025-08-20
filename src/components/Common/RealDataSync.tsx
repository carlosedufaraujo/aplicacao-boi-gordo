import React from 'react';
import { useRealDataSync } from '../../hooks/useRealDataSync';
import { useAppStore } from '../../stores/useAppStore';
import { RefreshCw, Database, CheckCircle, AlertCircle } from 'lucide-react';

export const RealDataSync: React.FC = () => {
  const { loading, error, lastSync, sync, hasRealData, dataCounts } = useRealDataSync();
  const { cycles, cattleLots, partners, expenses, revenues, penRegistrations, healthRecords, weightReadings } = useAppStore();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>🔄 Sincronização de Dados Reais</span>
        </h3>
        <button
          onClick={sync}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>
      </div>

      {/* Status da Sincronização */}
      <div className={`p-3 rounded-md mb-4 ${
        error 
          ? 'bg-red-50 border border-red-200' 
          : hasRealData 
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center space-x-2">
          {error ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : hasRealData ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <RefreshCw className="w-5 h-5 text-yellow-500" />
          )}
          <span className="font-medium">
            {error 
              ? 'Erro na sincronização' 
              : hasRealData 
                ? 'Dados sincronizados com sucesso!'
                : 'Aguardando sincronização...'
            }
          </span>
        </div>
        
        {error && (
          <p className="text-sm text-red-600 mt-2">
            <strong>Erro:</strong> {error}
          </p>
        )}
        
        {lastSync && (
          <p className="text-sm text-gray-600 mt-2">
            <strong>Última sincronização:</strong> {lastSync.toLocaleString()}
          </p>
        )}
      </div>

      {/* Dados Sincronizados */}
      {hasRealData && (
        <div className="space-y-4">
          <h4 className="font-medium">📊 Dados no Store (Frontend):</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Ciclos */}
            <div className="bg-blue-50 p-3 rounded-md">
              <h5 className="font-semibold text-blue-800 mb-1">🔄 Ciclos</h5>
              <p className="text-xl font-bold text-blue-600">{dataCounts?.cycles || 0}</p>
            </div>

            {/* Lotes */}
            <div className="bg-green-50 p-3 rounded-md">
              <h5 className="font-semibold text-green-800 mb-1">🐄 Lotes</h5>
              <p className="text-xl font-bold text-green-600">{dataCounts?.cattleLots || 0}</p>
            </div>

            {/* Parceiros */}
            <div className="bg-purple-50 p-3 rounded-md">
              <h5 className="font-semibold text-purple-800 mb-1">🤝 Parceiros</h5>
              <p className="text-xl font-bold text-purple-600">{dataCounts?.partners || 0}</p>
            </div>

            {/* Despesas */}
            <div className="bg-red-50 p-3 rounded-md">
              <h5 className="font-semibold text-red-800 mb-1">💰 Despesas</h5>
              <p className="text-xl font-bold text-red-600">{dataCounts?.expenses || 0}</p>
            </div>

            {/* Receitas */}
            <div className="bg-yellow-50 p-3 rounded-md">
              <h5 className="font-semibold text-yellow-800 mb-1">💵 Receitas</h5>
              <p className="text-xl font-bold text-yellow-600">{dataCounts?.revenues || 0}</p>
            </div>

            {/* Currais */}
            <div className="bg-indigo-50 p-3 rounded-md">
              <h5 className="font-semibold text-indigo-800 mb-1">🏢 Currais</h5>
              <p className="text-xl font-bold text-indigo-600">{dataCounts?.pens || 0}</p>
            </div>

            {/* Saúde */}
            <div className="bg-pink-50 p-3 rounded-md">
              <h5 className="font-semibold text-pink-800 mb-1">🏥 Saúde</h5>
              <p className="text-xl font-bold text-pink-600">{dataCounts?.healthRecords || 0}</p>
            </div>

            {/* Peso */}
            <div className="bg-teal-50 p-3 rounded-md">
              <h5 className="font-semibold text-teal-800 mb-1">⚖️ Peso</h5>
              <p className="text-xl font-bold text-teal-600">{dataCounts?.weightReadings || 0}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-700">
              ✅ <strong>Persistência funcionando!</strong> Os dados acima vêm diretamente do banco de dados 
              e são mantidos mesmo após recarregar a página.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
