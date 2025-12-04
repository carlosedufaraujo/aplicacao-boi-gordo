import React, { useState, useEffect } from 'react';

export const TestConnection: React.FC = () => {
  const [status, setStatus] = useState<{
    connected: boolean;
    loading: boolean;
    error: string | null;
    data: any;
  }>({
    connected: false,
    loading: true,
    error: null,
    data: null
  });

  const testConnection = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api/v1' : 'https://aplicacao-boi-gordo.pages.dev/api/v1');
      const baseUrl = apiUrl.replace('/api/v1', '');
      
      // Teste 1: Health check
      const healthResponse = await fetch(`${baseUrl}/health`);
      if (!healthResponse.ok) {
        throw new Error(`Health check falhou: ${healthResponse.status} ${healthResponse.statusText}`);
      }
      const healthData = await healthResponse.json();
      
      // Teste 2: Stats
      const statsResponse = await fetch(`${apiUrl}/stats`);
      if (!statsResponse.ok) {
        throw new Error(`Stats falhou: ${statsResponse.status} ${statsResponse.statusText}`);
      }
      const statsData = await statsResponse.json();
      
      // Teste 3: Frontend data
      const frontendResponse = await fetch(`${apiUrl}/frontend-data`);
      if (!frontendResponse.ok) {
        throw new Error(`Frontend data falhou: ${frontendResponse.status} ${frontendResponse.statusText}`);
      }
      const frontendData = await frontendResponse.json();
      
      setStatus({
        connected: true,
        loading: false,
        error: null,
        data: { health: healthData, stats: statsData, frontend: frontendData }
      });
      
    } catch (_error) {
      console.error('❌ Erro na conexão:', error);
      setStatus({
        connected: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        data: null
      });
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🧪 Teste de Conexão</h3>
        <button
          onClick={testConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={status.loading}
        >
          {status.loading ? '⏳ Testando...' : '🔄 Testar Novamente'}
        </button>
      </div>

      <div className="space-y-3">
        <div className={`p-3 rounded-md ${
          status.connected 
            ? 'bg-green-50 border border-green-200' 
            : status.error 
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2">
            {status.loading && <span>⏳</span>}
            {status.connected && <span>✅</span>}
            {status.error && <span>❌</span>}
            <span className="font-medium">
              {status.loading && 'Testando conexão...'}
              {status.connected && 'Conectado ao Backend!'}
              {status.error && 'Erro na conexão'}
            </span>
          </div>
          
          {status.error && (
            <p className="text-sm text-red-600 mt-2">
              <strong>Erro:</strong> {status.error}
            </p>
          )}
        </div>

        {status.data && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium mb-2">📊 Dados Recebidos:</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Health:</strong> {status.data.health?.status || 'N/A'}
              </div>
              <div>
                <strong>Stats:</strong> 
                {status.data.stats?.stats ? (
                  <span className="ml-2">
                    Lotes: {status.data.stats.stats.cattle_lots}, 
                    Parceiros: {status.data.stats.stats.partners}
                  </span>
                ) : ' N/A'}
              </div>
              <div>
                <strong>Frontend Data:</strong> 
                {status.data.frontend?.success ? (
                  <span className="ml-2">
                    {status.data.frontend.lots?.length || 0} lotes encontrados
                  </span>
                ) : ' N/A'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
