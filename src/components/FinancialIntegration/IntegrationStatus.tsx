import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  DollarSign,
  Link2,
  Unlink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface IntegrationStatusProps {
  purchaseId: string;
  onSync?: () => void;
  className?: string;
}

export const IntegrationStatus: React.FC<IntegrationStatusProps> = ({
  purchaseId,
  onSync,
  className
}) => {
  const [status, setStatus] = useState<'checking' | 'integrated' | 'partial' | 'not_integrated'>('checking');
  const [details, setDetails] = useState<{
    expenseCount: number;
    totalAmount: number;
    errors: string[];
  }>({ expenseCount: 0, totalAmount: 0, errors: [] });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkIntegrationStatus();
  }, [purchaseId]);

  const checkIntegrationStatus = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api/v1' : 'http://localhost:3001/api/v1');
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/expenses?purchaseId=${purchaseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      const expenses = result.data?.items || [];
      
      if (expenses.length === 0) {
        setStatus('not_integrated');
        setDetails({
          expenseCount: 0,
          totalAmount: 0,
          errors: ['Nenhuma despesa encontrada no centro financeiro']
        });
      } else if (expenses.length >= 3) {
        // Esperamos pelo menos 3 despesas (compra, frete, comissão)
        setStatus('integrated');
        const total = expenses.reduce((sum: number, exp: any) => sum + exp.totalAmount, 0);
        setDetails({
          expenseCount: expenses.length,
          totalAmount: total,
          errors: []
        });
      } else {
        setStatus('partial');
        const total = expenses.reduce((sum: number, exp: any) => sum + exp.totalAmount, 0);
        setDetails({
          expenseCount: expenses.length,
          totalAmount: total,
          errors: [`Apenas ${expenses.length} despesa(s) criada(s)`]
        });
      }
    } catch (_error) {
      setStatus('not_integrated');
      setDetails({
        expenseCount: 0,
        totalAmount: 0,
        errors: ['Erro ao verificar integração']
      });
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      // Chamar API para sincronizar
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api/v1' : 'http://localhost:3001/api/v1');
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/cattle-purchases/${purchaseId}/sync-expenses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast('As despesas foram criadas no centro financeiro' ? `${'Sincronização concluída'}: ${'As despesas foram criadas no centro financeiro'}` : 'Sincronização concluída');
        await checkIntegrationStatus();
        onSync?.();
      } else {
        throw new Error('Falha na sincronização');
      }
    } catch (_error) {
      toast.error('Não foi possível sincronizar as despesas' ? `${'Erro na sincronização'}: ${'Não foi possível sincronizar as despesas'}` : 'Erro na sincronização');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'integrated':
        return (
          <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Integrado
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
            <AlertCircle className="h-3 w-3" />
            Parcial
          </Badge>
        );
      case 'not_integrated':
        return (
          <Badge variant="outline" className="gap-1 border-red-500 text-red-600">
            <XCircle className="h-3 w-3" />
            Não Integrado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Verificando...
          </Badge>
        );
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Integração Financeira</span>
        </div>
        {getStatusBadge()}
      </div>
      
      {status === 'integrated' && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Link2 className="h-3 w-3" />
          {details.expenseCount} despesas • Total: R$ {details.totalAmount.toFixed(2)}
        </div>
      )}
      
      {status === 'partial' && (
        <Alert className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm">Integração Parcial</AlertTitle>
          <AlertDescription className="text-xs">
            {details.errors.join(', ')}
          </AlertDescription>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleSync}
            disabled={loading}
            className="mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Sincronizar
              </>
            )}
          </Button>
        </Alert>
      )}
      
      {status === 'not_integrated' && (
        <Alert className="py-2 border-red-200">
          <Unlink className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-sm text-red-600">Não Integrado</AlertTitle>
          <AlertDescription className="text-xs">
            Esta compra não possui despesas no centro financeiro.
          </AlertDescription>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleSync}
            disabled={loading}
            className="mt-2 border-red-300 hover:bg-red-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Criando despesas...
              </>
            ) : (
              <>
                <DollarSign className="h-3 w-3 mr-1" />
                Criar Despesas
              </>
            )}
          </Button>
        </Alert>
      )}
    </div>
  );
};
