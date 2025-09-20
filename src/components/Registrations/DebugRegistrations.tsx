import React, { useEffect, useState } from 'react';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { usePensApi } from '@/hooks/api/usePensApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { useCyclesApi } from '@/hooks/api/useCyclesApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface HookStatus {
  name: string;
  loading: boolean;
  error: string | null;
  dataCount: number;
  lastUpdate: string;
  fetchAttempts: number;
}

export const DebugRegistrations: React.FC = () => {
  const partners = usePartnersApi();
  const pens = usePensApi();
  const payerAccounts = usePayerAccountsApi();
  const cycles = useCyclesApi();
  
  const [hookStatuses, setHookStatuses] = useState<HookStatus[]>([]);
  const [renderCount, setRenderCount] = useState(0);

  // Rastrear renders - usar useEffect sem dependências apenas para log
  useEffect(() => {
    
  });
  
  // Incrementar contador de render no corpo do componente (não em useEffect)
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, []); // Array vazio para executar apenas na montagem

  // Atualizar status dos hooks
  useEffect(() => {
    const statuses: HookStatus[] = [
      {
        name: 'Partners API',
        loading: partners.loading,
        error: partners.error,
        dataCount: partners.partners?.length || 0,
        lastUpdate: new Date().toLocaleTimeString(),
        fetchAttempts: 0
      },
      {
        name: 'Pens API',
        loading: pens.loading,
        error: pens.error,
        dataCount: pens.pens?.length || 0,
        lastUpdate: new Date().toLocaleTimeString(),
        fetchAttempts: 0
      },
      {
        name: 'Payer Accounts API',
        loading: payerAccounts.loading,
        error: payerAccounts.error,
        dataCount: payerAccounts.payerAccounts?.length || 0,
        lastUpdate: new Date().toLocaleTimeString(),
        fetchAttempts: 0
      },
      {
        name: 'Cycles API',
        loading: cycles.loading,
        error: cycles.error,
        dataCount: cycles.cycles?.length || 0,
        lastUpdate: new Date().toLocaleTimeString(),
        fetchAttempts: 0
      }
    ];

    setHookStatuses(statuses);

    // Log detalhado no console
    console.group('[DEBUG] Status dos Hooks de Cadastros');
    statuses.forEach(status => {
      const icon = status.loading ? '⏳' : status.error ? '❌' : '✅';
      console.log(
        `${icon} ${status.name}:`,
        {
          loading: status.loading,
          error: status.error,
          dataCount: status.dataCount,
          lastUpdate: status.lastUpdate
        }
      );
    });
    console.groupEnd();
  }, [
    partners.loading, partners.error, partners.partners,
    pens.loading, pens.error, pens.pens,
    payerAccounts.loading, payerAccounts.error, payerAccounts.payerAccounts,
    cycles.loading, cycles.error, cycles.cycles
  ]);

  const totalLoading = hookStatuses.filter(s => s.loading).length;
  const totalErrors = hookStatuses.filter(s => s.error).length;
  const totalSuccess = hookStatuses.filter(s => !s.loading && !s.error && s.dataCount > 0).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Debug - Estado dos Hooks de Cadastros</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando: {totalLoading}
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-500" />
              Erros: {totalErrors}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Sucesso: {totalSuccess}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Informações gerais */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">Informações do Debug:</p>
                <ul className="mt-1 space-y-1 text-yellow-700">
                  <li>• Componente renderizado {renderCount} vez(es)</li>
                  <li>• Token de autenticação: {localStorage.getItem('authToken') ? '✅ Presente' : '❌ Ausente'}</li>
                  <li>• Backend URL: {import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Status de cada hook */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hookStatuses.map((status) => (
              <div
                key={status.name}
                className={`border rounded-lg p-4 ${
                  status.loading 
                    ? 'border-blue-300 bg-blue-50' 
                    : status.error 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-green-300 bg-green-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      {status.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : status.error ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {status.name}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Status:</span>{' '}
                        {status.loading ? 'Carregando...' : status.error ? 'Erro' : 'Pronto'}
                      </p>
                      <p>
                        <span className="font-medium">Registros:</span> {status.dataCount}
                      </p>
                      <p>
                        <span className="font-medium">Última atualização:</span> {status.lastUpdate}
                      </p>
                      {status.error && (
                        <p className="text-red-600 mt-2">
                          <span className="font-medium">Erro:</span> {status.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Logs do console */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-medium mb-2">Ações de Debug:</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  console.log('Estado completo dos hooks:', {
                    partners: {
                      loading: partners.loading,
                      error: partners.error,
                      data: partners.partners,
                      count: partners.partners?.length
                    },
                    pens: {
                      loading: pens.loading,
                      error: pens.error,
                      data: pens.pens,
                      count: pens.pens?.length
                    },
                    payerAccounts: {
                      loading: payerAccounts.loading,
                      error: payerAccounts.error,
                      data: payerAccounts.payerAccounts,
                      count: payerAccounts.payerAccounts?.length
                    },
                    cycles: {
                      loading: cycles.loading,
                      error: cycles.error,
                      data: cycles.cycles,
                      count: cycles.cycles?.length
                    }
                  });
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Log Estado Completo no Console
              </button>
              
              <button
                onClick={() => {
                  partners.reload();
                  pens.reload();
                  payerAccounts.reload();
                  cycles.refresh();
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm ml-2"
              >
                Recarregar Todos os Dados
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('authToken');
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm ml-2"
              >
                Limpar Token e Recarregar
              </button>
            </div>
          </div>

          {/* Mensagem de diagnóstico */}
          {totalLoading > 0 && (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Diagnóstico:</strong> {totalLoading} hook(s) ainda estão carregando dados. 
                Verifique o console do navegador para mais detalhes.
              </p>
            </div>
          )}

          {totalErrors > 0 && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>Problema detectado:</strong> {totalErrors} hook(s) retornaram erro. 
                Possíveis causas: falta de autenticação, backend offline ou erro na API.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
