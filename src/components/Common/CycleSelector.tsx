import React, { useEffect, useState } from 'react';
import { useCyclesApi } from '@/hooks/api/useCyclesApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

interface CycleSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  showAll?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const CycleSelector: React.FC<CycleSelectorProps> = ({
  value,
  onChange,
  showAll = false,
  required = false,
  label = 'Ciclo',
  placeholder = 'Selecione um ciclo',
  className = '',
}) => {
  const { cycles, loading, getCurrentCycle } = useCyclesApi();
  const [currentCycleId, setCurrentCycleId] = useState<string>('');

  // Debug logs
  useEffect(() => {
  }, [cycles, loading]);

  useEffect(() => {
    const loadCurrentCycle = async () => {
      const current = await getCurrentCycle();
      if (current) {
        setCurrentCycleId(current.id);
        // Se não há valor selecionado, seleciona o ciclo ativo por padrão
        if (!value && current.status === 'ACTIVE') {
          onChange(current.id);
        }
      }
    };
    loadCurrentCycle();
  }, [getCurrentCycle, onChange, value]);

  // Filtra apenas ciclos ativos e planejados se showAll for false
  const displayCycles = showAll 
    ? cycles 
    : cycles.filter(c => c.status === 'ACTIVE' || c.status === 'PLANNED');
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" className="ml-2">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'PLANNED':
        return (
          <Badge variant="secondary" className="ml-2">
            <Clock className="w-3 h-3 mr-1" />
            Planejado
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="ml-2">
            <Calendar className="w-3 h-3 mr-1" />
            Concluído
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="ml-2">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Carregando ciclos..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {displayCycles.length === 0 ? (
            <div className="px-2 py-4 text-sm text-gray-500 text-center">
              Nenhum ciclo disponível
            </div>
          ) : (
            displayCycles.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <span className="font-medium">{cycle.name}</span>
                    {cycle.id === currentCycleId && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Atual
                      </Badge>
                    )}
                    {getStatusBadge(cycle.status)}
                  </div>
                  <span className="text-xs text-gray-500 ml-4">
                    {formatDate(cycle.startDate)}
                    {cycle.endDate && ` - ${formatDate(cycle.endDate)}`}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
