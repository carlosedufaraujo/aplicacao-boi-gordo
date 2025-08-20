import React from 'react';
import { useRealData } from '../../hooks/useRealData';
import { Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';

export const ConnectionStatus: React.FC = () => {
  const { connected, loading, error, stats, refetch } = useRealData();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {connected ? (
            <div className="flex items-center space-x-2 text-green-600">
              <Wifi className="w-5 h-5" />
              <span className="font-medium">Conectado ao Backend</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600">
              <WifiOff className="w-5 h-5" />
              <span className="font-medium">Desconectado</span>
            </div>
          )}
          
          {loading && (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          )}
        </div>

        <button
          onClick={refetch}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            <strong>Erro:</strong> {error}
          </p>
        </div>
      )}

      {connected && stats && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Lotes</p>
              <p className="font-semibold">{stats.cattle_lots || 0}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Parceiros</p>
              <p className="font-semibold">{stats.partners || 0}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">Despesas</p>
              <p className="font-semibold">{stats.expenses || 0}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Receitas</p>
              <p className="font-semibold">{stats.revenues || 0}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-xs text-gray-500">Ordens</p>
              <p className="font-semibold">{stats.purchase_orders || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
